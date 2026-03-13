export function reactJsxRuntimeExportCode(): string {
  return `
    const sharedModule = moduleFactory?.default?.default ?? moduleFactory?.default ?? moduleFactory;
    export default sharedModule;
    export const Fragment = sharedModule.Fragment;
    export const jsx = sharedModule.jsx;
    export const jsxs = sharedModule.jsxs;
  `;
}
