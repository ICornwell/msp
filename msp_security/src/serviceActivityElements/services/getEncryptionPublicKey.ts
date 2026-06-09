import type { ServiceActivityResultBuilder } from 'msp_svr_common';

import { getDiscoveryProvider } from '../discovery/discoveryProvider.js';

export type GetEncryptionPublicKeyPayload = {
  kid?: string;
};

export async function getEncryptionPublicKeyHandler(
  _payload: GetEncryptionPublicKeyPayload,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  const provider = getDiscoveryProvider({
    myUrl: process.env['MSP_SECURITY_ISSUER_URL'] ?? 'http://localhost:4005',
  });

  const key = await provider.getEncryptionPublicKey();
  if (!key) {
    return resultBuilder.failed('No encryption public key is configured', {
      code: 'NOT_FOUND',
    });
  }

  resultBuilder.log(`Returning encryption public key kid=${key.kid}`);
  return resultBuilder.success({ data: key });
}
