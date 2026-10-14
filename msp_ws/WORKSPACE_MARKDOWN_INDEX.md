# MSP Workspace Markdown Index

_Updated October 2026_

This is the catalog of first-party Markdown in the 17-folder MSP VS Code
workspace. It is intended for both people and coding agents: start with the
platform documents for system constraints, then consult the repository-local
documents for the code being changed.

The inventory excludes dependencies, generated output, build artifacts, and
VCS metadata (for example `node_modules`, `dist`, and `.git`). The
`link_to_ws_docs` directory is a workspace symlink to the canonical shared
documentation at `/home/ian/msp/docs`.

## Start here

| Document | Purpose |
|---|---|
| [.github/copilot-instructions.md](.github/copilot-instructions.md) | Main Copilot instructions for the umbrella workspace folder and documentation routing rules. |
| [WORKSPACE_MARKDOWN_INDEX.md](WORKSPACE_MARKDOWN_INDEX.md) | Complete cross-repository catalog of first-party Markdown in this VS Code workspace. |
| [link_to_ws_docs/README.md](link_to_ws_docs/README.md) | Canonical platform documentation entry point and summary of core concepts. |
| [link_to_ws_docs/dev/BUILD_AND_RUN.md](link_to_ws_docs/dev/BUILD_AND_RUN.md) | Build order, development startup commands, and common workspace tasks. |
| [link_to_ws_docs/platform/ARCHITECTURE.md](link_to_ws_docs/platform/ARCHITECTURE.md) | Overall module federation, service, BFF, and network-boundary architecture. |
| [link_to_ws_docs/domain/WORK_MODEL.md](link_to_ws_docs/domain/WORK_MODEL.md) | Canonical File, Case, Task, Actor, and Participation domain model. |
| [link_to_ws_docs/domain/PERMISSIONS.md](link_to_ws_docs/domain/PERMISSIONS.md) | Canonical participation-based permission model and access semantics. |

## Shared platform documentation

### Domain and governance

| Document | Purpose |
|---|---|
| [link_to_ws_docs/IDENTIFIER_GOVERNANCE_ONE_PAGER.md](link_to_ws_docs/IDENTIFIER_GOVERNANCE_ONE_PAGER.md) | Rules for choosing and governing domain-based versus namespace-based identifiers. |
| [link_to_ws_docs/domain/WORK_MODEL.md](link_to_ws_docs/domain/WORK_MODEL.md) | File, Case, and Task hierarchy, Actor types, and Participations. |
| [link_to_ws_docs/domain/PERMISSIONS.md](link_to_ws_docs/domain/PERMISSIONS.md) | CBAC, ABAC, and ReBAC model in which rights derive from Participation. |

### Architecture and module authoring

| Document | Purpose |
|---|---|
| [link_to_ws_docs/platform/ARCHITECTURE.md](link_to_ws_docs/platform/ARCHITECTURE.md) | System topology, module federation, service mesh, BFF pattern, and network boundaries. |
| [link_to_ws_docs/platform/MODULE_AUTHORING.md](link_to_ws_docs/platform/MODULE_AUTHORING.md) | Contract and workflow for building conformant UI, service, and data modules. |
| [link_to_ws_docs/platform/indexing-strategy.md](link_to_ws_docs/platform/indexing-strategy.md) | Strategy for treating indexes as derived, rebuildable, non-authoritative data structures. |

### Security

| Document | Purpose |
|---|---|
| [link_to_ws_docs/security/RGAM.md](link_to_ws_docs/security/RGAM.md) | Reasonably Good Access Management design, including auditability and access decisions. |
| [link_to_ws_docs/security/copilotContext.md](link_to_ws_docs/security/copilotContext.md) | Working security context and constraints for AI-assisted implementation. |

### UX

| Document | Purpose |
|---|---|
| [link_to_ws_docs/ux/UX_STRUCTURE.md](link_to_ws_docs/ux/UX_STRUCTURE.md) | Shell regions, navigation tree, tabs and pages, Blades, Info Panels, and unsaved state. |

### Developer reference

| Document | Purpose |
|---|---|
| [link_to_ws_docs/dev/BUILD_AND_RUN.md](link_to_ws_docs/dev/BUILD_AND_RUN.md) | Workspace build order, development startup commands, and routine tasks. |
| [link_to_ws_docs/dev/msp_ui_common.md](link_to_ws_docs/dev/msp_ui_common.md) | Behaviour system, dispatch contexts, render engine, and shared component library. |
| [link_to_ws_docs/dev/msp_fes.md](link_to_ws_docs/dev/msp_fes.md) | Shell host, Module Federation host configuration, BFF, and theme ownership. |
| [link_to_ws_docs/dev/msp_servicehub.md](link_to_ws_docs/dev/msp_servicehub.md) | Manifest registration, routing, admission, and service-to-service calls. |
| [link_to_ws_docs/dev/msp_datahub.md](link_to_ws_docs/dev/msp_datahub.md) | Data connector pattern, minimisation, and DataHub API responsibilities. |

## Shared packages

### msp_common

| Document | Purpose |
|---|---|
| [../msp_common/src/data/docs/type-safe-view-builder.md](../msp_common/src/data/docs/type-safe-view-builder.md) | Type-safe declarative schema/view builder patterns and examples. |
| [../msp_common/src/data/docs/literal-type-inference-pattern.md](../msp_common/src/data/docs/literal-type-inference-pattern.md) | Fluent builder pattern that preserves literal types without code generation. |

### msp_svr_common

| Document | Purpose |
|---|---|
| [../msp_svr_common/manifest-roadmap.md](../msp_svr_common/manifest-roadmap.md) | Roadmap for manifest-driven module enablement and administration journeys. |
| [../msp_svr_common/src/service-manager/VERSION_COMPATIBILITY_GUIDE.md](../msp_svr_common/src/service-manager/VERSION_COMPATIBILITY_GUIDE.md) | Plugin version matching and support for multiple file versions. |
| [../msp_svr_common/src/als/README.md](../msp_svr_common/src/als/README.md) | JWT validation and AsyncLocalStorage request-context utilities. |

### msp_ui_common

| Document | Purpose |
|---|---|
| [../msp_ui_common/docs/work-plan-status.md](../msp_ui_common/docs/work-plan-status.md) | Current implementation checkpoint for fluent extension typing and the Stepper builder. |
| [../msp_ui_common/docs/extension-type-generation.md](../msp_ui_common/docs/extension-type-generation.md) | Generation of extension types for fluent `ComponentWrapper` chains. |
| [../msp_ui_common/docs/table-keyboard-navigation.md](../msp_ui_common/docs/table-keyboard-navigation.md) | Keyboard navigation design and read/edit interaction semantics for tables. |
| [../msp_ui_common/src/uiLib/copilotContext.md](../msp_ui_common/src/uiLib/copilotContext.md) | UIEvent, Dispatch, Context, and local-effect communication patterns. |
| [../msp_ui_common/src/uiLib/behaviours/FluentBehaviours.md](../msp_ui_common/src/uiLib/behaviours/FluentBehaviours.md) | Fluent DSL for expressing When-to-Then UI behaviour rules. |

`msp_data_common` currently has no first-party Markdown files.

## Platform services and applications

### msp_actorwork

| Document | Purpose |
|---|---|
| [../msp_actorwork/docs/core-type-and-link-matrix.md](../msp_actorwork/docs/core-type-and-link-matrix.md) | MVP ActorWork core model and links between actor and work types by tier. |

### msp_semaphores

| Document | Purpose |
|---|---|
| [../msp_semaphores/README.md](../msp_semaphores/README.md) | Semaphore issuer service, endpoints, and ServiceHub manifest guard. |

`msp_servicehub`, `msp_datahub`, and `msp_fes` currently have no
repository-local first-party Markdown; use their shared developer-reference
documents above.

## Module Federation tooling

### module-federation-vite

| Document | Purpose |
|---|---|
| [../module-federation-vite/README.md](../module-federation-vite/README.md) | Usage and configuration of the Vite Module Federation plugin. |
| [../module-federation-vite/CHANGELOG.md](../module-federation-vite/CHANGELOG.md) | Plugin release history and behavior changes. |
| [../module-federation-vite/scripts/generate-factory-files.usage.md](../module-federation-vite/scripts/generate-factory-files.usage.md) | Usage of the ESM/CJS package factory-file generator. |
| [../module-federation-vite/src/esmExportEnumerator/usage.md](../module-federation-vite/src/esmExportEnumerator/usage.md) | API and examples for ESM static-export discovery. |
| [../module-federation-vite/src/esmExportEnumerator/copilotContext.md](../module-federation-vite/src/esmExportEnumerator/copilotContext.md) | Implementation context for the static export enumerator. |

## Data services

### msp_bus_data

| Document | Purpose |
|---|---|
| [../msp_bus_data/docs/msp-data-persistence-paper.md](../msp_bus_data/docs/msp-data-persistence-paper.md) | First-principles design for graph-backed, view-driven persistence. |
| [../msp_bus_data/docs/isr-data-helper.md](../msp_bus_data/docs/isr-data-helper.md) | Internally Shared References and reference transport without data duplication. |
| [../msp_bus_data/isr_data_transport_tdd_plan.md](../msp_bus_data/isr_data_transport_tdd_plan.md) | Test-driven plan and protocol contract for ISR data transport. |
| [../msp_bus_data/future_event_plans.md](../msp_bus_data/future_event_plans.md) | Future business-event design and distinction between data changes and domain events. |
| [../msp_bus_data/future_plans.md](../msp_bus_data/future_plans.md) | Future object-history routes and transaction-purpose tracking. |
| [../msp_bus_data/tests/IMPLEMENTATION_SUMMARY.md](../msp_bus_data/tests/IMPLEMENTATION_SUMMARY.md) | Implementation summary for Product, Schema, and View builders. |
| [../msp_bus_data/tests/src/dataLayerTests/integrationtests.md](../msp_bus_data/tests/src/dataLayerTests/integrationtests.md) | Integration-test setup and notes for tests requiring live services. |

### msp_tech_data

| Document | Purpose |
|---|---|
| [../msp_tech_data/README.md](../msp_tech_data/README.md) | Rust `docgraph` service overview, PostgreSQL prerequisite, and project status. |
| [../msp_tech_data/docs/transaction_timestamp_read_semantics.md](../msp_tech_data/docs/transaction_timestamp_read_semantics.md) | Transaction lifecycle, timestamped reads, and commit semantics. |

## Feature modules

### msp_aws

| Document | Purpose |
|---|---|
| [../msp_aws/docs/foundational-entrypoint-slice1-checklist.md](../msp_aws/docs/foundational-entrypoint-slice1-checklist.md) | Checklist for the first AWS tenancy-identity verification slice. |
| [../msp_aws/docs/configuration-wizard-design.md](../msp_aws/docs/configuration-wizard-design.md) | Guided AWS onboarding outcomes, flow, and UX principles. |
| [../msp_aws/docs/configuration-wizard-implementation-slice.md](../msp_aws/docs/configuration-wizard-implementation-slice.md) | Wizard shell, Stepper integration, and durable-state implementation slice. |
| [../msp_aws/docs/aws-wizard-phase2-system-plan.md](../msp_aws/docs/aws-wizard-phase2-system-plan.md) | Phase 2 system plan for Fluxor models and normalized domain shapes. |
| [../msp_aws/docs/steel-thread-status-2026-07-09.md](../msp_aws/docs/steel-thread-status-2026-07-09.md) | Dated status of the AWS discovery-mode steel thread and target outcomes. |
| [../msp_aws/docs/aws-mvp-actor-work-resource-model.md](../msp_aws/docs/aws-mvp-actor-work-resource-model.md) | MVP AWS ActorWork resource model and `listEksClusters` interaction contract. |
| [../msp_aws/docs/day1-terraform-module-breakdown.md](../msp_aws/docs/day1-terraform-module-breakdown.md) | Day-one Terraform modules, responsibilities, and repository layout. |
| [../msp_aws/docs/infrastructure-architecture-and-wizard-design.md](../msp_aws/docs/infrastructure-architecture-and-wizard-design.md) | AWS infrastructure architecture covering EKS, ECR, RDS PostgreSQL, and wizard integration. |
| [../msp_aws/docs/aws-iam-eks-ecr-postgres-readiness-plan.md](../msp_aws/docs/aws-iam-eks-ecr-postgres-readiness-plan.md) | Production readiness plan for IAM, IRSA, MFA, EKS, ECR, and PostgreSQL. |
| [../msp_aws/docs/steel-thread-plan.md](../msp_aws/docs/steel-thread-plan.md) | End-to-end wizard-to-config-to-plan-to-apply implementation checklist. |
| [../msp_aws/docs/next-session-aws-connector-slice.md](../msp_aws/docs/next-session-aws-connector-slice.md) | Handoff plan for AWS connection verification and `VerifyAwsConnectionActivity`. |
| [../msp_aws/docs/aws-actorwork-variant-mapping.md](../msp_aws/docs/aws-actorwork-variant-mapping.md) | Mapping between AWS concepts and ActorWork core variants. |
| [../msp_aws/src/apiElements/README.md](../msp_aws/src/apiElements/README.md) | Placeholder and conventions for API-DSL descriptors. |
| [../msp_aws/test/resources/README.md](../msp_aws/test/resources/README.md) | Test-resource and fixture conventions. |

### msp_security

| Document | Purpose |
|---|---|
| [../msp_security/docs/future_patterns_for_sdk_support.md](../msp_security/docs/future_patterns_for_sdk_support.md) | Future SDK-neutral core, provider-module, and profile patterns. |
| [../msp_security/docs/proxy-execution-envelope.md](../msp_security/docs/proxy-execution-envelope.md) | Provider-neutral proxy request/response contract using credential references. |
| [../msp_security/docs/testing-issuer.md](../msp_security/docs/testing-issuer.md) | Local RS256 JWT test issuer setup and usage. |
| [../msp_security/src/apiElements/README.md](../msp_security/src/apiElements/README.md) | Placeholder and conventions for API-DSL descriptors. |

### msp_pamela

| Document | Purpose |
|---|---|
| [../msp_pamela/docs/pamela.md](../msp_pamela/docs/pamela.md) | PAMELA executive summary and enterprise dependency-engine concept. |
| [../msp_pamela/docs/pamela.prototype.steps.md](../msp_pamela/docs/pamela.prototype.steps.md) | Prototype context, staged steps, and experiment guidance. |
| [../msp_pamela/docs/PamelaCoreTaxonomy.md](../msp_pamela/docs/PamelaCoreTaxonomy.md) | Core Artefact categories, Assertion model, and semantic primitives. |
| [../msp_pamela/src/data/graph/README.md](../msp_pamela/src/data/graph/README.md) | Stage 1 Artefact, Assertion, and Relation graph schema and persistence. |
| [../msp_pamela/src/apiElements/README.md](../msp_pamela/src/apiElements/README.md) | Placeholder and conventions for API-DSL descriptors. |
| [../msp_pamela/test/resources/README.md](../msp_pamela/test/resources/README.md) | Test-resource and fixture conventions. |

### msp_module_template

| Document | Purpose |
|---|---|
| [../msp_module_template/README.md](../msp_module_template/README.md) | How to copy and adapt the standard MSP module template. |
| [../msp_module_template/docs/module_template.md](../msp_module_template/docs/module_template.md) | Concise template structure and module summary. |
| [../msp_module_template/src/data/README.md](../msp_module_template/src/data/README.md) | Template data-layer example based on the PAMELA Stage 1 model. |
| [../msp_module_template/src/apiElements/README.md](../msp_module_template/src/apiElements/README.md) | Placeholder and conventions for API-DSL descriptors. |
| [../msp_module_template/test/resources/README.md](../msp_module_template/test/resources/README.md) | Test-resource and fixture conventions. |

## Maintenance

When adding, moving, or deleting first-party Markdown, update this index in the
same change. Descriptions should state what decisions, contracts, procedures,
or context a reader will find in the document rather than merely restating its
title.