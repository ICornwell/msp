# Future Patterns For SDK Support

## Why this exists

msp_security must remain core, stable, and SDK-neutral. Provider SDK churn (new versions, patch cadence, behavior shifts) should not drive msp_security lifecycle.

## Target architecture

1. msp_security core:
- policy decisions
- capability issuance
- envelope execution for HTTP-only patterns
- strict sanitization and audit

2. secure_sdk_<provider> modules:
- provider SDK usage
- provider-specific transport/signing behavior
- conversion of short-lived capability material into runtime SDK auth context

3. shared model:
- profile-driven request/capability patterns
- versioned, reviewed templates
- least-privilege defaults

## Hybrid pattern: standard profiles + constrained DSL

Use both:

1. Standard profile references for stable provider scenarios (AWS/Azure/GCP)
2. Constrained DSL templates for long-tail/custom integrations
3. Standard profiles are internalized DSL/templates with stable names

Runtime callers should usually pass `profileRef` and bounded parameters, not raw signing definitions.

## Safety model for interpretable config

1. No executable code in config
2. Strict schema with reject-unknown-fields
3. Versioned profile/template IDs
4. Policy checks for host/method/scope/ttl/key-handle usage
5. Deterministic canonicalization and validation
6. Redaction of tokens, secrets, signatures, and credential fields

## Immediate minimal subset implemented now

Implemented in msp_security:

1. `issueAccessCapability` supports curated `profileRef` presets.
2. Current built-in profiles:
- `aws.eks.listClusters.read.v1`
- `aws.ecr.listRepositories.read.v1`
3. Current profile/module binding:
- AWS curated profiles are currently allowlisted to `msp_aws` only.
4. Profile defaults include provider/operation/scope/ttl/returnType constraints.
5. Callers may still use explicit provider/operation for non-profile use.

This gives immediate value without introducing SDK coupling in msp_security.

## Next increments

1. Add registry-backed profile catalog (graph-backed, approval status, version pinning).
2. Add module-level allowlists mapping moduleId -> allowed profileRefs.
3. Add actor/work policy gates before issuance.
4. Add one-time-use capability mode plus nonce binding.
5. Add capability introspection and revocation endpoints.
6. Add signed template artifacts and integrity hash validation.

## Notes on provider-specific signing

Provider-specific signing remains outside msp_security core. If needed:

1. Resolve profile/template in msp_security.
2. Issue bounded capability material.
3. secure_sdk module performs provider SDK signing at execution time.

This preserves trust boundaries and keeps msp_security lifecycle independent of provider SDK updates.
