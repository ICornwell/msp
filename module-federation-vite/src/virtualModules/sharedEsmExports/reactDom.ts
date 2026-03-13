export function reactDomExportCode(): string {
  return `
    const sharedModule = moduleFactory?.default?.default ?? moduleFactory?.default ?? moduleFactory;
    export default sharedModule;
    export const createPortal = sharedModule.createPortal;
    export const flushSync = sharedModule.flushSync;
    export const unstable_batchedUpdates = sharedModule.unstable_batchedUpdates;
    export const version = sharedModule.version;
  `;
}
