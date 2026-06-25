import {
  createSimpleDomainObject,
  createSimpleSchemaFromType,
  createView,
  type View,
} from 'msp_common';

export type ServiceSecretVaultData = {
  vaultKey: string;
  serviceId: string;
  secretName: string;
  encryptedSecret: string;
  kid: string;
  alg: 'RSA-OAEP-256' | 'RSA-OAEP';
  metadata: Record<string, string>;
  version: number;
  storedAt: string;
  lastAccessedAt?: string;
  checksumSha256: string;
  ownerSubjectId: string;
  ownerTenantId?: string;
  ownerIssuer?: string;
};

export type ServiceSecretVaultIndexData = {
  indexId: string;
  keys: string[];
  updatedAt: string;
};

export const SERVICE_SECRET_VAULT_INDEX_ID = 'service-secret-vault-index';

const serviceSecretVaultSchema = createSimpleSchemaFromType<ServiceSecretVaultData>(
  'serviceSecretVaultRecord',
  {
    vaultKey: 'Text',
    serviceId: 'Text',
    secretName: 'Text',
    encryptedSecret: 'Text',
    kid: 'Text',
    alg: 'Text',
    metadata: 'Json',
    version: 'Integer',
    storedAt: 'DateTime',
    lastAccessedAt: 'DateTime',
    checksumSha256: 'Text',
    ownerSubjectId: 'Text',
    ownerTenantId: 'Text',
    ownerIssuer: 'Text',
  },
  {
    namespace: 'security',
    version: '1.0.0',
    variantName: 'default',
    dictionaryVersion: '1.0.0',
    dictionaryIdFormatter: propertyName => `security-secret-vault-${propertyName}`,
  },
);

const serviceSecretVaultDomainObject = createSimpleDomainObject<ServiceSecretVaultData, 'serviceSecretVaultRecord', 'secret'>(
  'serviceSecretVaultRecord',
  serviceSecretVaultSchema,
  {
    entity: true,
    businessKey: 'vaultKey',
    fqId: {
      namespace: 'security',
      version: '1.0.0',
      variantName: 'default',
    },
    domain: {
      namespace: 'security',
      name: 'security',
      version: '1.0.0',
      variantName: 'default',
    },
    defaultDocPathName: 'secret',
    dbStoreLabel: 'security-secret-vault',
  },
);

const serviceSecretVaultViewContext = createView({
  namespace: 'security',
  name: 'serviceSecretVaultByVaultKey',
  version: '1.0.0',
  variantName: 'default',
})
  .withConfigSet('main')
  .withRootKey('vaultKey')
  .withRootElement(serviceSecretVaultDomainObject, false)
  .end()
  .endView();

export const serviceSecretVaultView = serviceSecretVaultViewContext.build() as View<ServiceSecretVaultData>;

const serviceSecretVaultIndexSchema = createSimpleSchemaFromType<ServiceSecretVaultIndexData>(
  'serviceSecretVaultIndexRecord',
  {
    indexId: 'Text',
    keys: 'Json',
    updatedAt: 'DateTime',
  },
  {
    namespace: 'security',
    version: '1.0.0',
    variantName: 'default',
    dictionaryVersion: '1.0.0',
    dictionaryIdFormatter: propertyName => `security-secret-vault-index-${propertyName}`,
  },
);

const serviceSecretVaultIndexDomainObject = createSimpleDomainObject<ServiceSecretVaultIndexData, 'serviceSecretVaultIndexRecord', 'index'>(
  'serviceSecretVaultIndexRecord',
  serviceSecretVaultIndexSchema,
  {
    entity: true,
    businessKey: 'indexId',
    fqId: {
      namespace: 'security',
      version: '1.0.0',
      variantName: 'default',
    },
    domain: {
      namespace: 'security',
      name: 'security',
      version: '1.0.0',
      variantName: 'default',
    },
    defaultDocPathName: 'index',
    dbStoreLabel: 'security-secret-vault-index',
  },
);

const serviceSecretVaultIndexViewContext = createView({
  namespace: 'security',
  name: 'serviceSecretVaultIndexById',
  version: '1.0.0',
  variantName: 'default',
})
  .withConfigSet('main')
  .withRootKey('indexId')
  .withRootElement(serviceSecretVaultIndexDomainObject, false)
  .end()
  .endView();

export const serviceSecretVaultIndexView = serviceSecretVaultIndexViewContext.build() as View<ServiceSecretVaultIndexData>;