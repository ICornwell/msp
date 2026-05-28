# Manifest-Driven Module Enablement Roadmap

## Why This Matters
The manifest model is now pivotal infrastructure for module development.

It should enable other developers to build modules that follow a consistent pattern for:
- actor, work, and link declarations
- derived permissions and entitlements
- static validation before runtime
- dynamic observation and optimization after rollout

## Product/UX Direction
Admin journeys should be human-first, not prerequisite-first.

Principles:
- Non-annoying setup: avoid dead-ends and forced restart when a dependency appears late.
- Gap filling in place: if an admin discovers they need X or Y first, they can create it inline and continue without losing progress.
- Work-first onboarding: start with the thing the admin wants to enable, then derive who should do it and what links/permissions are needed.
- Safe defaults first: module activation should guide a basic but safe setup path.

## Module Activation Pattern (Target)
When an admin enables a module (example: AWS Resource Module):
1. Walk through minimum safe setup.
2. Show the work model the module uses.
3. Ask who should perform each kind of work.
4. Derive and enable links/permissions from those choices.
5. Surface blockers and risks before activation is finalized.

## Analysis Model
### Static Analysis (Design Time)
- Validate actor/work/link graph completeness.
- Detect gaps: work that nobody can perform.
- Detect SoD concerns: where segregation of duty is recommended or required.
- Explainability views:
  - what can be done by who
  - who can do what

### Dynamic Analysis (Runtime)
- Capture usage and flow statistics.
- Assess against SLA targets.
- Detect key-person dependencies and bottlenecks.
- Feed findings back into manifest and assignment design.

## Future Extension Point
Add pluggable agent-style actors (for monitoring and recommendations), for example:
- detect emerging risks and bottlenecks
- suggest safer or more resilient assignment patterns
- recommend manifest/workflow improvements from observed behavior

## Delivery Guidance
Keep near-term scope tight to current needs, while preserving compatibility with the future analysis and recommendation capabilities above.
