# Foundational Entry Point Slice 1 Checklist

Purpose:

- Deliver one end-to-end human-to-system work path that verifies AWS connectivity and returns tenancy identity data.
- Keep scope minimal and test continuously.

Scope:

- One human actor: `HumanOperatorActor`
- One system actor: `AwsDiscoverySystemActor`
- One work type: `VerifyAwsTenancyWork`
- One environment target (dev)

## Execution Checklist (in order)

1. Define work contract
- Add `VerifyAwsTenancyWork` request schema.
- Required fields: `workId`, `requestedByActorId`, `targetEnvironment`, `targetAccountHint`, `requestedAt`.
- Add status lifecycle: `requested`, `accepted`, `executing`, `completed`, `failed`.

2. Define actor identities
- Register `HumanOperatorActor` and `AwsDiscoverySystemActor` in actor registry.
- Add ownership rules so only system actor can execute this work type.

3. Add minimal graph node models
- Create `HumanActorNode`, `SystemActorNode`, `WorkNode`, `AwsConnectionProfileNode`, `AwsTenancySnapshotNode`.
- Ensure each node has stable ID, timestamp, and environment labels.

4. Add minimal graph edges
- Implement `REQUESTED_BY`, `EXECUTED_BY`, `USES_CONNECTION_PROFILE`, `PRODUCED`.
- Validate edge creation is idempotent for retry runs.

5. Create connection profile model
- Add `AwsConnectionProfileNode` shape with non-secret metadata only:
  - `profileId`, `providerType`, `region`, `accountHint`, `createdBy`, `createdAt`.
- Do not store raw credentials.

6. Implement credential provider chain adapter
- Add abstraction call: `resolveCredentials(connectionProfileId, workContext)`.
- Use existing local AWS profile or role chain for first pass.
- Log only credential metadata (issuer/expiry), never secret values.

7. Implement AWS identity retrieval activity
- Call `sts:GetCallerIdentity`.
- Optionally call account alias lookup if permission exists.
- Normalize output into `AwsTenancySnapshotNode` payload.

8. Persist work execution trail
- Record transitions with timestamps for each lifecycle status.
- Persist execution metadata: actor IDs, correlation ID, duration, result code.

9. Add error taxonomy and handling
- Classify failures: auth failure, network failure, permission denied, unknown.
- Ensure failed runs still produce audit-safe diagnostic metadata.

10. Add API endpoint or command handler
- Trigger `VerifyAwsTenancyWork` creation from one user action.
- Return immediate acknowledgement with `workId`.
- Provide query endpoint to fetch status and result by `workId`.

11. Add focused tests (unit)
- Work lifecycle transition test.
- Edge/node persistence test.
- Credential adapter redaction test.
- AWS result normalization test.

12. Add focused tests (integration)
- Happy path with valid credentials.
- Invalid credential path.
- Retry path idempotency (same work retried safely).

13. Add observability and audit checks
- Structured logs contain `workId`, `requestedBy`, `executedBy`, `status`.
- Metrics: work success rate, failure rate by error class, median latency.

14. Run acceptance gates
- Functional, security, audit/history, and operability checks from day-1 doc.
- Capture evidence links and attach to a single evaluation record.

15. Score and decide next slice
- Score the foundational slice using the objective scoring model.
- If all gates pass and average score >= 2.0, proceed to credential subsystem slice.

## Exit Artifacts

1. One completed `VerifyAwsTenancyWork` record with full trace.
2. One `AwsTenancySnapshotNode` linked to work and actors.
3. Test report for unit and integration checks.
4. Scoring record with gate outcomes and next-step decision.

## Out of Scope (slice 1)

1. Full resource inventory beyond tenancy identity.
2. Multi-account orchestration.
3. Token rotation workflows.
4. Terraform backend execution.
