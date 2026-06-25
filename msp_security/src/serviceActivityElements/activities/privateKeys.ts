import { buildActivitySet } from 'msp_svr_common';
import {
  issueAccessCapabilityHandler,
  executeProxyFlowHandler,
  storeServiceSecretHandler,
  retrieveServiceSecretHandler,
  getEncryptionPublicKeyHandler,
  configureEncryptionKeyPairHandler,
  rotateServiceSecretVaultKeysHandler,
} from '../services/index.js';

export const PrivateKeysActivities = buildActivitySet()
  .withNamespace('security')
  .withVersion('1.0.0')
  .withMatchingVersionRange('*')
  .withContext('*')
  .use({
    activityName: 'issueAccessCapability',
    funcs: issueAccessCapabilityHandler,
  })
  .use({
    activityName: 'executeProxyFlow',
    funcs: executeProxyFlowHandler,
  })
  .use({
    activityName: 'storeServiceSecret',
    funcs: storeServiceSecretHandler,
  })
  .use({
    activityName: 'retrieveServiceSecret',
    funcs: retrieveServiceSecretHandler,
  })
  .use({
    activityName: 'getEncryptionPublicKey',
    funcs: getEncryptionPublicKeyHandler,
  })
  .use({
    activityName: 'configureEncryptionKeyPair',
    funcs: configureEncryptionKeyPairHandler,
  })
  .use({
    activityName: 'rotateServiceSecretVaultKeys',
    funcs: rotateServiceSecretVaultKeysHandler,
  })
  .build();



