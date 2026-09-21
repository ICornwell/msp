import { View, ViewElement } from 'msp_common';

import { getRegisteredJsonCodec } from './jsonCodecs.js';
import { toTransportView } from './transportView.js';

export async function ReadData(view: View, id: string) {
  try {
    const readResponse = await fetch(`http://localhost:5000/v1/doc/query/${id}`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(toTransportView(view)),
    });

    if (!readResponse.ok) {
      const responseBody = await readResponse.text();
      throw new Error(`ReadData request failed with status ${readResponse.status}${responseBody ? `: ${responseBody}` : ''}`);
    }

    const responseBody = await readResponse.text();
    let result: unknown;
    try {
      result = JSON.parse(responseBody);
    } catch (error) {
      throw invalidJsonError(readResponse, responseBody, error);
    }
    return normalizeJsonFieldsFromRead(view, result);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('ReadData ')) {
      throw error;
    }
    throw new Error(`ReadData request failed for view '${view.name}' and id '${id}': ${error instanceof Error ? error.message : String(error)}`);
  }
}

function invalidJsonError(response: Response, responseBody: string, error: unknown): Error {
    const preview = responseBody.length > 1000
      ? `${responseBody.slice(0, 1000)}...`
      : responseBody;
    return new Error(
      `ReadData returned invalid JSON (${response.status}, `
      + `content-type=${response.headers.get('content-type') ?? 'unknown'}, `
      + `bytes=${Buffer.byteLength(responseBody, 'utf8')}): `
      + `${error instanceof Error ? error.message : String(error)}; body=${JSON.stringify(preview)}`,
    );
}

function normalizeJsonFieldsFromRead(view: View, payload: any): any {
  const rootElement = view.rootElement;
  if (!rootElement || !payload || typeof payload !== 'object') {
    return payload;
  }

  if (payload.content && typeof payload.content === 'object') {
    return {
      ...payload,
      content: normalizeViewElementDataFromRead(rootElement, payload.content, new WeakMap<object, any>()),
    };
  }

  if (Array.isArray(payload.data)) {
    return {
      ...payload,
      data: payload.data.map((row: any) => {
        if (row?.content && typeof row.content === 'object') {
          return {
            ...row,
            content: normalizeViewElementDataFromRead(rootElement, row.content, new WeakMap<object, any>()),
          };
        }
        return normalizeViewElementDataFromRead(rootElement, row, new WeakMap<object, any>());
      }),
    };
  }

  return normalizeViewElementDataFromRead(rootElement, payload, new WeakMap<object, any>());
}

function normalizeViewElementDataFromRead(viewElement: ViewElement, data: any, seen: WeakMap<object, any>): any {
  if (Array.isArray(data)) {
    return data.map(item => normalizeViewElementDataFromRead(viewElement, item, seen));
  }

  if (!data || typeof data !== 'object') {
    return data;
  }

  if (seen.has(data as object)) {
    return seen.get(data as object);
  }

  const normalized = { ...(data as Record<string, any>) };
  seen.set(data as object, normalized);

  const schemaProperties = viewElement.domainObject?.schema?.properties ?? {};
  for (const [propertyName, propertyDefinition] of Object.entries(schemaProperties) as Array<[string, any]>) {
    if (propertyDefinition?.infoType !== 'Json') {
      continue;
    }

    const value = normalized[propertyName];
    if (typeof value !== 'string') {
      continue;
    }

    const codecKey = typeof propertyDefinition?.jsonCodecKey === 'string'
      ? propertyDefinition.jsonCodecKey.trim()
      : '';

    if (codecKey) {
      const codec = getRegisteredJsonCodec(codecKey);
      if (!codec) {
        throw new Error(`No JSON codec is registered for key '${codecKey}' (property '${propertyName}').`);
      }
      normalized[propertyName] = codec.deserialize(value);
      continue;
    }

    try {
      normalized[propertyName] = JSON.parse(value);
    } catch {
      // Keep raw value if it is not valid JSON text.
    }
  }

  for (const subElement of viewElement.subElements ?? []) {
    const subDataKey = subElement.docPathName ?? subElement.domainObjectId.name;
    if (normalized[subDataKey] !== undefined) {
      normalized[subDataKey] = normalizeViewElementDataFromRead(subElement, normalized[subDataKey], seen);
    }
  }

  return normalized;
}