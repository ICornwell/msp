import { ReadData, WriteData } from 'msp_svr_common';
import type { View } from 'msp_common';

export function readSecurityData(view: View, id: string) {
  return ReadData(view, id);
}

export function writeSecurityData(view: View, data: any) {
  return WriteData(view, data);
}