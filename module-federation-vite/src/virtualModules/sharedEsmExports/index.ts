import { defaultExportCode } from './defaultExport';
import { emotionReactExportCode } from './emotionReact';
import { emotionStyledExportCode } from './emotionStyled';
import { msalBrowserExportCode } from './msalBrowser';
import { msalCommonExportCode } from './msalCommon';
import { msalReactExportCode } from './msalReact';
import { mspUiCommonBehavioursExportCode } from './mspUiCommonBehaviours';
import { mspUiCommonCommsExportCode } from './mspUiCommonComms';
import { mspUiCommonComponentsExportCode } from './mspUiCommonComponents';
import { mspUiCommonContextsExportCode } from './mspUiCommonContexts';
import { mspUiCommonExportCode } from './mspUiCommon';
import { mspUiCommonHooksExportCode } from './mspUiCommonHooks';
import { mspUiCommonRenderEngineExportCode } from './mspUiCommonRenderEngine';
import { muiIconsMaterialExportCode } from './muiIconsMaterial';
import { muiMaterialExportCode } from './muiMaterial';
import { muiSystemExportCode } from './muiSystem';
import { reactDomClientExportCode } from './reactDomClient';
import { reactDomExportCode } from './reactDom';
import { reactExportCode } from './react';
import { reactJsxDevRuntimeExportCode } from './reactJsxDevRuntime';
import { reactJsxRuntimeExportCode } from './reactJsxRuntime';

type ExportCodeFactory = () => string;

const exportCodeByPackage: Record<string, ExportCodeFactory> = {
  'react': reactExportCode,
  'react-dom': reactDomExportCode,
  'react-dom/client': reactDomClientExportCode,
  'react/jsx-runtime': reactJsxRuntimeExportCode,
  'react/jsx-dev-runtime': reactJsxDevRuntimeExportCode,
  '@mui/material': muiMaterialExportCode,
  '@mui/system': muiSystemExportCode,
  '@mui/icons-material': muiIconsMaterialExportCode,
  '@emotion/react': emotionReactExportCode,
  '@emotion/styled': emotionStyledExportCode,
  '@azure/msal-browser': msalBrowserExportCode,
  '@azure/msal-react': msalReactExportCode,
  '@azure/msal-common': msalCommonExportCode,
  'msp_ui_common': mspUiCommonExportCode,
  'msp_ui_common/uiLib': mspUiCommonExportCode,
  'msp_ui_common/uiLib/components': mspUiCommonComponentsExportCode,
  'msp_ui_common/uiLib/comms': mspUiCommonCommsExportCode,
  'msp_ui_common/uiLib/behaviours': mspUiCommonBehavioursExportCode,
  'msp_ui_common/uiLib/contexts': mspUiCommonContextsExportCode,
  'msp_ui_common/uiLib/hooks': mspUiCommonHooksExportCode,
  'msp_ui_common/uiLib/renderEngine': mspUiCommonRenderEngineExportCode,
};

export function getSharedEsmExportCode(pkg: string): string {
  const exportFactory = exportCodeByPackage[pkg] || defaultExportCode;
  return exportFactory();
}
