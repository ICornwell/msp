import { loadResourceJson } from './resourceLoader.js';

export type AwsTenancyFixture = {
  scenarioId: string;
  connectionProfile: {
    id: string;
    providerType: string;
    region: string;
    accountHint: string;
  };
  expected: {
    accountId: string;
    issuer: string;
  };
};

export type SeedResult = {
  fixture: AwsTenancyFixture;
  seededAt: string;
};

export async function seedAwsTenancyFixture(fileName = 'aws-tenancy.base.json'): Promise<SeedResult> {
  const fixture = await loadResourceJson<AwsTenancyFixture>(fileName);

  // Placeholder for DB injection.
  // Replace with real data-layer writes when the msp_aws test entrypoint is ready.
  return {
    fixture,
    seededAt: new Date().toISOString(),
  };
}
