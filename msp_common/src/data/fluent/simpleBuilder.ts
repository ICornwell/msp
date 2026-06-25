import { createSchema } from './schemaBuilder.js';
import { createEntityObject, createValueObject } from './objectBuilder.js';
import type { DomainObject, Schema, SchemaPropertyInfoType, versionedResourceId } from '../models/api/data.js';

type SimpleSchemaShape = Record<string, any>;

export type SimpleSchemaPropertyDefinition =
  | SchemaPropertyInfoType
  | {
      infoType?: SchemaPropertyInfoType;
      dictionaryId?: string;
      dictionaryVersion?: string;
      defaultLabel?: string;
    };

export type SimpleSchemaDefinition<T extends SimpleSchemaShape> = {
  [K in keyof T]: SimpleSchemaPropertyDefinition;
};

export type SimpleSchemaFromType<T extends SimpleSchemaShape> = Schema<any, undefined> & {
  readonly __simpleType?: T;
};

export type SimpleDomainObject<T extends SimpleSchemaShape, N extends string = string, P extends string = N> =
  DomainObject<N, P, SimpleSchemaFromType<T>>;

export interface SimpleSchemaOptions {
  namespace?: string;
  version?: string;
  variantName?: string;
  infoType?: SchemaPropertyInfoType;
  dictionaryVersion?: string;
  labelFormatter?: (propertyName: string) => string;
  dictionaryIdFormatter?: (propertyName: string) => string;
}

export interface SimpleDomainObjectOptions<P extends string = string> {
  fqId?: Omit<versionedResourceId, 'name'>;
  domain?: versionedResourceId;
  product?: versionedResourceId;
  defaultPresentationLabel?: string;
  defaultDocPathName?: P;
  dbStoreLabel?: string;
  businessKey?: string | string[] | ((data: any) => string);
  alternateKey?: string | string[] | ((data: any) => string);
  entity?: boolean;
}

function toKebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[ _]+/g, '-')
    .toLowerCase();
}

function toDefaultLabel(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, first => first.toUpperCase());
}

function normalizePropertyDefinition(
  definition: SimpleSchemaPropertyDefinition | undefined,
  propertyName: string,
  options: SimpleSchemaOptions,
) {
  const normalized = typeof definition === 'string' ? { infoType: definition } : definition ?? {};
  const dictionaryVersion = normalized.dictionaryVersion ?? options.dictionaryVersion ?? '1.0';

  return {
    infoType: normalized.infoType ?? options.infoType ?? 'Text',
    dictionaryId: normalized.dictionaryId ?? options.dictionaryIdFormatter?.(propertyName) ?? `dict-${toKebabCase(propertyName)}`,
    dictionaryVersion,
    defaultLabel: normalized.defaultLabel ?? options.labelFormatter?.(propertyName) ?? toDefaultLabel(propertyName),
  };
}

export function createSimpleSchemaFromType<T extends SimpleSchemaShape>(
  name: string,
  definition: SimpleSchemaDefinition<T>,
  options: SimpleSchemaOptions = {},
): SimpleSchemaFromType<T> {
  const schemaBuilder = createSchema(name).withFQId({
    namespace: options.namespace ?? 'default',
    version: options.version ?? '1.0',
    variantName: options.variantName ?? 'default',
  });

  for (const [propertyName, propertyDefinition] of Object.entries(definition) as Array<[
    keyof T & string,
    SimpleSchemaPropertyDefinition,
  ]>) {
    const normalized = normalizePropertyDefinition(propertyDefinition, propertyName, options);

    schemaBuilder
      .withProperty(propertyName)
      .forType<T[typeof propertyName]>()
      .withDictionaryId(normalized.dictionaryId, normalized.dictionaryVersion)
      .withInfoType(normalized.infoType)
      .withDefaultLabel(normalized.defaultLabel)
      .endProperty();
  }

  return schemaBuilder.buildSchema() as unknown as SimpleSchemaFromType<T>;
}

export function createSimpleDomainObject<T extends SimpleSchemaShape, N extends string, P extends string = N>(
  name: N,
  schema: SimpleSchemaFromType<T>,
  options: SimpleDomainObjectOptions<P> = {},
): SimpleDomainObject<T, N, P> {
  const isEntity = options.entity ?? Boolean(options.businessKey ?? options.alternateKey);

  if (isEntity) {
    const builder = createEntityObject(name, schema);

    if (options.fqId) {
      builder.withFQId(options.fqId);
    }

    if (options.domain) {
      builder.forDomain(options.domain);
    }

    if (options.product) {
      builder.forProduct(options.product);
    }

    if (options.defaultPresentationLabel) {
      builder.withDefaultPresentationLabel(options.defaultPresentationLabel);
    }

    if (options.defaultDocPathName) {
      builder.withDefaultDocPathName(options.defaultDocPathName);
    }

    if (options.dbStoreLabel) {
      builder.withDbStoreLabel(options.dbStoreLabel);
    }

    if (options.businessKey) {
      builder.withUniqueBusinessKey(options.businessKey);
    }

    if (options.alternateKey && builder.withAlternateKey) {
      builder.withAlternateKey(options.alternateKey);
    }

    return builder.buildObject() as unknown as SimpleDomainObject<T, N, P>;
  }

  const builder = createValueObject(name, schema);

  if (options.fqId) {
    builder.withFQId(options.fqId);
  }

  if (options.domain) {
    builder.forDomain(options.domain);
  }

  if (options.product) {
    builder.forProduct(options.product);
  }

  if (options.defaultPresentationLabel) {
    builder.withDefaultPresentationLabel(options.defaultPresentationLabel);
  }

  if (options.defaultDocPathName) {
    builder.withDefaultDocPathName(options.defaultDocPathName);
  }

  if (options.dbStoreLabel) {
    builder.withDbStoreLabel(options.dbStoreLabel);
  }

  return builder.buildObject() as unknown as SimpleDomainObject<T, N, P>;
}