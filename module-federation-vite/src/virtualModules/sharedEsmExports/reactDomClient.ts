export function reactDomClientExportCode(): string {
  return `
    const sharedModule = moduleFactory?.default?.default ?? moduleFactory?.default ?? moduleFactory;
    export default sharedModule;
    export const createRoot = sharedModule.createRoot;
    export const hydrateRoot = sharedModule.hydrateRoot;
    export const version = sharedModule.version;
  `;
}
