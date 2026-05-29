# Test Resources

Purpose:

- Store deterministic, templated input data for integration tests.
- Keep fixtures environment-agnostic where possible.

Conventions:

1. Use JSON files only for static fixture payloads.
2. Name files by domain and scenario, for example:
   - `aws-tenancy.base.json`
   - `aws-tenancy.invalid-creds.json`
3. Keep secrets out of fixture files.
4. Prefer small composable fixtures over large monolithic fixtures.

Loading:

- Use helper methods from `test/setups/resourceLoader.ts`.
- Create scenario-specific setup code in `test/setups/*.ts`.
