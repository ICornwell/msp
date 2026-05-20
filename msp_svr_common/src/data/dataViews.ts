import { View, ViewElement } from 'msp_common';

export function visitDataObjects(view: View, data: any,
   valueVisitor: (obj: any) => void, entityVisitor: (obj: any) => void) {
  if (data === null || data === undefined) {
    return;
  }
  if (typeof data === 'object') {
    recurseVisitElements(view.rootElement, data, valueVisitor, entityVisitor);
  }
}

function recurseVisitElements(element: ViewElement, data: any,
   valueVisitor: (obj: any) => void, entityVisitor: (obj: any) => void) {
  if (data === null || data === undefined) {
    return;
  }
  if (typeof data === 'object') {
    if (element.domainObject?.isEntity) {
      entityVisitor(data);
    } else {
      valueVisitor(data);
    }
    for (const subElement of element.subElements ?? []) {
      const childData = data[subElement.domainObject?.defaultDocPathName ?? subElement.domainObject?.name];
      if (childData !== null && childData !== undefined) {
        recurseVisitElements(subElement, childData, valueVisitor, entityVisitor);
      }
    }
  }
}