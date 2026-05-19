# MSP Platform — Documentation Index

_April 2026_

This is the single entry point for all MSP platform documentation.

---

## Domain

| Document | What it covers |
|---|---|
| [domain/WORK_MODEL.md](domain/WORK_MODEL.md) | File, Case, Task hierarchy; Actor types; Participations |
| [domain/PERMISSIONS.md](domain/PERMISSIONS.md) | CBAC/ABAC/ReBAC permission model; how Participations carry rights |

## UX

| Document | What it covers |
|---|---|
| [ux/UX_STRUCTURE.md](ux/UX_STRUCTURE.md) | Shell layout, NavTree, Tabs/Pages, Blade, Info Panels, unsaved state |

## Platform Architecture

| Document | What it covers |
|---|---|
| [platform/ARCHITECTURE.md](platform/ARCHITECTURE.md) | Module federation topology, service mesh, BFF pattern, network boundaries |
| [platform/MODULE_AUTHORING.md](platform/MODULE_AUTHORING.md) | How to build a conformant remote module (UI + Service + Data) |

## Security

| Document | What it covers |
|---|---|
| [security/RGAM.md](security/RGAM.md) | Reasonably Good Access Management — design paper |
| [security/copilotContext.md](security/copilotContext.md) | Security architecture working context (for AI-assisted development) |

## Developer Reference

| Document | What it covers |
|---|---|
| [dev/BUILD_AND_RUN.md](dev/BUILD_AND_RUN.md) | Workspace build order, dev start commands, common tasks |
| [dev/msp_ui_common.md](dev/msp_ui_common.md) | Behaviour system, dispatch contexts, render engine, component library |
| [dev/msp_fes.md](dev/msp_fes.md) | Shell host, Module Federation host config, BFF, theme |
| [dev/msp_servicehub.md](dev/msp_servicehub.md) | Manifest registration, routing, admission, inter-service calls |
| [dev/msp_datahub.md](dev/msp_datahub.md) | Data connector pattern, minimisation, DataHub API |

---

## Key concepts at a glance

**Module Federation** — The UI is a host (`msp_fes`) + remote modules (`msp_actorwork`, etc.).
Shared deps (React, MUI, etc.) are owned by the host. Remotes never bundle their own copies.
See [platform/ARCHITECTURE.md](platform/ARCHITECTURE.md).

**Behaviours** — The unit of feature logic in the UI. A Behaviour registers
menus, nav items, and tab/page content on load. It cleans up on unload via
`clearContextOwner`. See [dev/msp_ui_common.md](dev/msp_ui_common.md).

**Participations** — The primary permission carrier. Rights derive from an
Actor's relationship to Work, not from their role.
See [domain/PERMISSIONS.md](domain/PERMISSIONS.md).

**Work** — File → Case → Task hierarchy. The atomic context for all data
access and activity execution. See [domain/WORK_MODEL.md](domain/WORK_MODEL.md).
