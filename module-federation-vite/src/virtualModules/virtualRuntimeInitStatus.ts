import VirtualModule from '../utils/VirtualModule';
export const virtualRuntimeInitStatus = new VirtualModule('runtimeInit');
export function writeRuntimeInitStatus() {
  virtualRuntimeInitStatus.writeSync(`
    export let initResolve, initReject
    export const initPromise = new Promise((re, rj) => {
      initResolve = re
      initReject = rj
    })
    `);
}
