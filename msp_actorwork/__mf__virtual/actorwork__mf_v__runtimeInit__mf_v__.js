
    let initResolve, initReject
    const initPromise = new Promise((re, rj) => {
      initResolve = re
      initReject = rj
    })
    export {
      initPromise,
      initResolve,
      initReject
    }
    