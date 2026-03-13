export function reactJsxDevRuntimeExportCode(): string {
  return `
    const sharedModule = moduleFactory?.default?.default ?? moduleFactory?.default ?? moduleFactory;
    export default sharedModule;
    export const Fragment = sharedModule.Fragment;
    export const jsxDEV = sharedModule.jsxDEV;
  `;
}
