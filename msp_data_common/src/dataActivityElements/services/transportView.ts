import type { DomainObject, Schema, View, ViewElement } from 'msp_common';

type TransportRelation = {
  name: string;
  relatedObjectId: { namespace?: string; name: string; version: string };
  delinkOnRemoval?: boolean;
  cascadeDeletes: boolean;
};

type TransportDomainObject = {
  vid: { namespace?: string; name: string; version: string };
  name: string;
  domain?: { namespace?: string; name: string; version: string };
  product?: { namespace?: string; name: string; version: string };
  schema?: TransportSchema;
  schemaId?: { namespace?: string; name: string; version: string };
  isEntity?: boolean;
  defaultPresentationLabel?: string;
  defaultDocPathName: string;
  businessKey?: string | string[];
  alternateKey?: string | string[];
  storeWithDBLabel?: string;
  allowedRelationsTo: TransportRelation[];
  allowedRelationsFrom: TransportRelation[];
  schemaProperties: Record<string, unknown>;
};

type TransportSchema = {
  vid: { namespace?: string; name: string; version: string };
  name?: string;
  product?: { namespace?: string; name: string; version: string };
  inheritsFromSchema?: TransportSchema;
  properties: Record<string, unknown>;
};

type TransportViewElement = Omit<ViewElement, 'domainObject' | 'subElements'> & {
  domainObject?: TransportDomainObject;
  subElements?: TransportViewElement[];
};

export type TransportView = Omit<View, 'rootElement' | 'getViewIdentifier' | 'getViewDataIdentifier'> & {
  rootElement: TransportViewElement;
};

function toTransportSchema(schema: Schema<any, any> | undefined): TransportSchema | undefined {
  if (!schema) return undefined;

  return {
    vid: { ...schema.vid },
    name: schema.name,
    product: schema.product ? { ...schema.product } : undefined,
    inheritsFromSchema: toTransportSchema(schema.inheritsFromSchema),
    properties: { ...schema.properties },
  };
}

function toTransportRelation(relation: DomainObject['allowedRelationsFrom'][number]): TransportRelation {
  return {
    name: relation.name,
    relatedObjectId: { ...relation.relatedObjectId },
    delinkOnRemoval: relation.delinkOnRemoval,
    cascadeDeletes: relation.cascadeDeletes,
  };
}

function toTransportDomainObject(domainObject: DomainObject | undefined): TransportDomainObject | undefined {
  if (!domainObject) return undefined;

  return {
    vid: { ...domainObject.vid },
    name: domainObject.name,
    domain: domainObject.domain ? { ...domainObject.domain } : undefined,
    product: domainObject.product ? { ...domainObject.product } : undefined,
    schema: toTransportSchema(domainObject.schema),
    schemaId: domainObject.schemaId ? { ...domainObject.schemaId } : undefined,
    isEntity: domainObject.isEntity,
    defaultPresentationLabel: domainObject.defaultPresentationLabel,
    defaultDocPathName: domainObject.defaultDocPathName,
    businessKey: typeof domainObject.businessKey === 'function' ? undefined : domainObject.businessKey,
    alternateKey: typeof domainObject.alternateKey === 'function' ? undefined : domainObject.alternateKey,
    storeWithDBLabel: domainObject.storeWithDBLabel,
    allowedRelationsTo: domainObject.allowedRelationsTo.map(toTransportRelation),
    allowedRelationsFrom: domainObject.allowedRelationsFrom.map(toTransportRelation),
    schemaProperties: { ...domainObject.schemaProperties },
  };
}

function toTransportViewElement(element: ViewElement): TransportViewElement {
  return {
    ...element,
    domainObject: toTransportDomainObject(element.domainObject),
    subElements: element.subElements?.map(toTransportViewElement),
  };
}

export function toTransportView(view: View): TransportView {
  return {
    targetDataStore: view.targetDataStore,
    namespace: view.namespace,
    name: view.name,
    version: view.version,
    variantName: view.variantName,
    configSet: view.configSet,
    rootKey: typeof view.rootKey === 'function' ? '__entityId' : view.rootKey,
    rootElement: toTransportViewElement(view.rootElement),
    viewDataIdentifier: { ...view.viewDataIdentifier },
  };
}
