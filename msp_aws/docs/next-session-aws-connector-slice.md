# Next Session: AWS Connector Slice - End-to-End Walkthrough

Goal: build a real end-to-end "Check AWS connection" flow through all platform layers,
deliberately starting verbose so we can identify and then consolidate into orchestration patterns.

---

## Phase 1: Build it the verbose way (one responsibility per piece)

### 1. Test resources and setups

- Add `test/resources/aws-connector.base.json`
  - system actor identity, connection profile, expected tenancy shape.
- Add `test/setups/awsConnectorSetup.ts`
  - seeds: system actor, connection profile, a parent human task, linked system task.

### 2. Data activity: AWS connector (`dataActivityElements`)

- Name: `VerifyAwsConnectionActivity`
- Zone: data (calls datahub outbound only).
- Responsibilities:
  - Accept system actor identity + connection profile.
  - Resolve credentials via credential provider chain.
  - Call `sts:GetCallerIdentity`.
  - Return normalised tenancy snapshot or classified failure.

### 3. System actor + token flow

- System actor: `AwsDiscoverySystemActor`
- On execution, actor acquires its access token using its system identity (client credentials / jwt).
- Token is scoped to the data activity call only.
- Token and credential handles are never written to task payloads.

### 4. Service activity: connector request (`serviceActivityElements`)

- Name: `RequestAwsConnectorCheckActivity`
- Zone: service (calls servicehub or datahub only).
- Responsibilities:
  - Validate caller (human actor with appropriate role).
  - Create a human task linked to the request.
  - Create a system task linked to the human task.
  - Dispatch system task to `VerifyAwsConnectionActivity`.
  - Return task reference and pending status to caller.

### 5. Human task + system task definitions

- `CheckAwsConnectionHumanTask`
  - owner: human actor who initiated.
  - status lifecycle: `requested -> accepted -> awaiting_result -> resolved | failed`.
- `CheckAwsConnectionSystemTask`
  - owner: `AwsDiscoverySystemActor`.
  - linked to parent human task.
  - status lifecycle: `pending -> executing -> completed | failed`.

### 6. Human actor

- `HumanOperatorActor` with role that allows raising `CheckAwsConnectionHumanTask`.

### 7. UI element: "Check AWS connection"

- Add menu item to existing AWS resources tab or top-level nav.
- Behaviour:
  - On click, calls `RequestAwsConnectorCheckActivity`.
  - Shows pending state while tasks are executing.
  - Shows tenancy result or failure on completion.
- Fluxor object: `checkAwsConnectionFluxor.ts`
  - state: `idle | pending | success | failure`
  - actions: `triggerCheck`, `receiveResult`, `receiveError`

---

## Phase 2: Notice it's too much, and consolidate

### Observation after Phase 1

Three separate activities (`UI behaviour -> service activity -> system task -> data activity`) is
visible overhead for what should be one coherent operation.

Trigger for refactor: cannot easily reason about state without looking at three disconnected places.

### 8. Orchestrating activity

- Name: `AwsConnectionCheckOrchestration`
- Replaces the three-activity chain.
- Single entry point.
- Internally manages both task lifecycles.
- Behaviour governed by:
  1. The state of the human task.
  2. The state of the system task.
  3. The actor type of the caller (human vs system path).

---

## Phase 3: Codify the patterns

### 9. Orchestration activity support structures

- Base type: `OrchestratingActivity<TContext, TResult>`
  - encapsulates task state machine, actor-type dispatch, and result propagation.
- Execution modes:
  - `straight-through`: synchronous result when possible.
  - `event-driven`: emits completion event when result is ready asynchronously.
- Coding convention:
  - Single file per orchestration.
  - Explicit state transitions at the top.
  - Actor-type guard before each branch.
  - No inline API calls - delegate to named activities.

### 10. Paired task definition

- Type: `PairedTask<THumanTask, TSystemTask>`
  - `humanTask` and `systemTask` are intrinsically linked.
  - Lifecycle of the pair is managed together: parent human task fails if system task fails.
  - Supports labelling the pair as `StraightThroughPairedTask` for flows where the human
    element is purely a request/response wrapper with no human decision step.

### 11. Straight-through flow mechanism

- `StraightThroughPairedTask`:
  - If result arrives before client polls, return synchronously.
  - If result is delayed, emit a named completion event the UI can subscribe to.
  - Event carries: `workId`, `actorId`, `correlationId`, `result | error`.
- Convention: every straight-through flow must define max timeout and timeout error shape.

---

## Acceptance criteria for the session

1. `VerifyAwsConnectionActivity` calls real AWS (dev creds) and returns a tenancy snapshot.
2. `CheckAwsConnectionHumanTask` and `CheckAwsConnectionSystemTask` are created and linked.
3. UI "Check AWS connection" action triggers the chain and shows a result.
4. After consolidation, the orchestration activity handles all three steps coherently.
5. `PairedTask` and `StraightThroughPairedTask` types are defined and used in the refactored flow.
6. Test resources and setups cover happy path, credential failure, and timeout cases.
