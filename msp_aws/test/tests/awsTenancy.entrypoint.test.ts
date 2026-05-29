import { describe, expect, it } from 'vitest';
import { seedAwsTenancyFixture } from '../setups/awsTenancySetup.js';

describe('AWS tenancy entrypoint fixture setup', () => {
  it('loads templated resource data via setup helper', async () => {
    const seeded = await seedAwsTenancyFixture();

    expect(seeded.fixture.scenarioId).toBe('aws-tenancy-base');
    expect(seeded.fixture.connectionProfile.providerType).toBe('aws-profile');
    expect(seeded.fixture.expected.accountId).toMatch(/^\d{12}$/);
    expect(seeded.seededAt.length).toBeGreaterThan(0);
  });
});
