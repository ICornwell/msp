# Extension Type Generation Pattern

## Why this exists

`msp_ui_common` uses fluent extensions on `ComponentWrapper`s in the ReUiPlan builder.

At component declaration time, extension interfaces are authored with placeholder generics (`CNTX`, `RT`).
At usage time, those placeholders must be substituted with concrete builder types so chaining works correctly.

For several extensions (especially those returning `FluentSubBuilder<...>`), TypeScript inference alone becomes circular (the chicken/egg issue) and loses the concrete return types.

To break that cycle, we generate the `ExtensionOf` mapping type.

## Source of truth

1. Extension interfaces are defined next to their components (for example `TableExtension`, `ElementSetContainerExtension`, `StepperExtension`).
2. `scripts/extension-types.config.json` declares which files contain extension interfaces.
3. `scripts/generate-extension-types.ts` scans those interfaces and emits:
- `src/uiLib/renderEngine/UiPlan/ReUiPlanBuilder.extensions.generated.ts`

## Build integration

`package.json` has:

- `generate:extension-types`
- `prebuild`: runs the generator before `tsc -b`

So normal build flow regenerates types automatically.

## Adding a new extension (checklist)

1. Add the extension interface in the component source file.
2. Add that file path to `scripts/extension-types.config.json` under `extensionFiles`.
3. Run:
- `npm run generate:extension-types`
4. Confirm generated output includes a new `ExtensionOf` branch for your extension.
5. Commit both:
- component/interface source change
- generated file update

## Stepper example

`StepperExtension` is declared in:

- `src/uiLib/components/containers/stepper.tsx`

To include it in fluent typing, that file must be listed in `scripts/extension-types.config.json`.

## Important rules

1. Do not manually edit `ReUiPlanBuilder.extensions.generated.ts`.
2. Keep extension file paths in config aligned with the real project structure (`src/uiLib/...`).
3. If fluent chaining suddenly loses types, first regenerate extension types and verify config coverage.

## Troubleshooting

If an extension is not recognized:

1. Ensure interface name ends with `Extension`.
2. Ensure interface extends `ReExtensionBuilder<...>`.
3. Ensure the file is listed in `extension-types.config.json`.
4. Regenerate and check console output from `generate-extension-types.ts` for discovered interfaces.

If generated imports look wrong:

1. Check that `outputFile` path in config points to `src/uiLib/renderEngine/UiPlan/ReUiPlanBuilder.extensions.generated.ts`.
2. Check each `extensionFiles` path is relative to package root and points to existing files.
