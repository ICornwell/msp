export function defaultExportCode(): string {
  return `
    const sharedModule = moduleFactory?.default?.default ?? moduleFactory?.default ?? moduleFactory;
    export default sharedModule;
  `;
}
