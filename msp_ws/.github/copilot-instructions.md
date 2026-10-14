# MSP Workspace Copilot Instructions

This is the main Copilot instruction file for the umbrella `msp_ws` workspace
folder. The VS Code workspace includes multiple sibling repositories; use the
workspace documentation index to find platform-wide and repository-local
guidance before making changes.

## Documentation routing

- Start with [the workspace Markdown index](../WORKSPACE_MARKDOWN_INDEX.md).
- Treat [the platform documentation index](../link_to_ws_docs/README.md) as the
  canonical entry point for shared architecture, domain, security, UX, and
  build documentation.
- Read repository-local documents listed in the workspace index when working
  in that repository or subsystem.
- Prefer canonical files under `link_to_ws_docs` over older or duplicated
  summaries. `link_to_ws_docs` points to the shared `/home/ian/msp/docs`
  directory.
- Do not scan or rely on generated, vendored, dependency, or build-output
  Markdown unless the task specifically concerns it.

## Working conventions

- Preserve boundaries between the shared packages, platform services, host,
  and remote modules described in the architecture documentation.
- For domain work, use the canonical File, Case, Task, Actor, and Participation
  terminology from `link_to_ws_docs/domain`.
- For access-control or identity work, read the security documents before
  changing behavior.
- For UI work, read the UX structure and `msp_ui_common` guidance before
  introducing shell, navigation, dispatch, or behaviour patterns.
