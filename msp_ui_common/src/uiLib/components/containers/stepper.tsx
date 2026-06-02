import { PropsWithChildren, ReactNode, useEffect, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Step from '@mui/material/Step';
import StepButton from '@mui/material/StepButton';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Typography from '@mui/material/Typography';

import { createExtendedComponent } from '../../renderEngine/components/ReComponentWrapper.js';
import { ReComponentCommonProps, ReComponentSystemProps } from '../../renderEngine/components/ReComponentProps.js';
import { CreateReUiPlanElementSet } from '../../renderEngine/UiPlan/ReUiPlanBuilder.js';
import { ReGroupComponent } from '../../renderEngine/components/ReGroup.js';
import { ReUiPlanElementSet, ReUiPlanElementSetMember } from '../../renderEngine/UiPlan/ReUiPlan.js';
import { CNTX, FluentExtension, FluentSimple, FluentSubBuilder, ReExtensionBuilder, ReUiPlanElementSetBuilder } from '../../renderEngine/UiPlan/ReUiPlanBuilder.js';

export type StepperOrientation = 'horizontal' | 'vertical';
export type StepperButtonRole = 'back' | 'next' | 'finish' | 'cancel' | 'custom';

export type StepperPageButton = {
  id?: string;
  label: string;
  role?: StepperButtonRole;
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  disabled?: boolean;
};

export type StepperPageContent = {
  components: ReUiPlanElementSet;
  sharedProps?: any[];
};

export type StepperPageDefinition = {
  pageId: string;
  title: string;
  description?: string;
  scrollEligible?: boolean;
  activateOnOpen?: boolean;
  buttons?: StepperPageButton[];
  content?: StepperPageContent;
};

export type StepperConfig = {
  orientation?: StepperOrientation;
  initialPageId?: string;
  pages: StepperPageDefinition[];
};

export type StepperProps = {
  stepperConfig?: StepperConfig;
  children?: ReactNode;
} & ReComponentCommonProps & ReComponentSystemProps;

type StepperPageRecord = {
  page: StepperPageDefinition;
  containedBuilders: ReUiPlanElementSetBuilder<any, any>[];
};

export interface StepperPageBuilder<C extends CNTX, RT> {
  withPageId: (pageId: string) => StepperPageBuilder<C, RT>;
  withTitle: (title: string) => StepperPageBuilder<C, RT>;
  withDescription: (description: string) => StepperPageBuilder<C, RT>;
  withButton: (button: StepperPageButton) => StepperPageBuilder<C, RT>;
  withButtons: (buttons: StepperPageButton[]) => StepperPageBuilder<C, RT>;
  withScrollEligible: (scrollEligible?: boolean) => StepperPageBuilder<C, RT>;
  activateOnOpen: (activateOnOpen?: boolean) => StepperPageBuilder<C, RT>;
  containingElementSet: () => FluentSubBuilder<ReUiPlanElementSetBuilder<C, StepperPageBuilder<C, RT>>>;
  endPage: RT;
}

export interface StepperExtension<C extends CNTX = CNTX, RT = any> extends ReExtensionBuilder<C, RT> {
  withOrientation: (orientation: StepperOrientation) => FluentSimple;
  withPage: (pageId: string, title?: string) => FluentSubBuilder<StepperPageBuilder<C, FluentSimple>>;
}

function buildPageContent(pageRecord: StepperPageRecord, buildConfig: any): StepperPageContent | undefined {
  const builtComponents: ReUiPlanElementSet = [];
  const sharedProps: any[] = [];

  for (const containedBuilder of pageRecord.containedBuilders) {
    const built = containedBuilder.build(buildConfig);
    builtComponents.push(...built.components);
    sharedProps.push(...built.sharedProps);
  }

  if (builtComponents.length === 0 && sharedProps.length === 0) {
    return undefined;
  }

  return {
    components: builtComponents,
    sharedProps,
  };
}

function createStepperPageBuilder<C extends CNTX, RT>(
  returnTo: RT,
  pageRecord: StepperPageRecord,
  pageBuilder: any
): StepperPageBuilder<C, RT> {
  pageBuilder.withPageId = (pageId: string) => {
    pageRecord.page.pageId = pageId;
    return pageBuilder;
  };
  pageBuilder.withTitle = (title: string) => {
    pageRecord.page.title = title;
    return pageBuilder;
  };
  pageBuilder.withDescription = (description: string) => {
    pageRecord.page.description = description;
    return pageBuilder;
  };
  pageBuilder.withButton = (button: StepperPageButton) => {
    pageRecord.page.buttons = [...(pageRecord.page.buttons ?? []), button];
    return pageBuilder;
  };
  pageBuilder.withButtons = (buttons: StepperPageButton[]) => {
    pageRecord.page.buttons = [...(pageRecord.page.buttons ?? []), ...buttons];
    return pageBuilder;
  };
  pageBuilder.withScrollEligible = (scrollEligible: boolean = true) => {
    pageRecord.page.scrollEligible = scrollEligible;
    return pageBuilder;
  };
  pageBuilder.activateOnOpen = (activateOnOpen: boolean = true) => {
    pageRecord.page.activateOnOpen = activateOnOpen;
    return pageBuilder;
  };
  pageBuilder.containingElementSet = () => CreateReUiPlanElementSet(pageBuilder, pageRecord.containedBuilders) as unknown as FluentSubBuilder<ReUiPlanElementSetBuilder<C, StepperPageBuilder<C, RT>>>;
  pageBuilder.endPage = returnTo;

  return pageBuilder as StepperPageBuilder<C, RT>;
}

export function extendWithStepper<C extends CNTX, RT, BLD>(
  _returnTo: RT,
  builder: BLD,
  _contextPlaceHolder: C
): StepperExtension<C, RT> {
  const stepperConfig: StepperConfig = {
    orientation: 'horizontal',
    pages: [],
  };
  const pageRecords: StepperPageRecord[] = [];

  const extension: FluentExtension = {
    withOrientation(orientation: StepperOrientation): FluentSimple {
      stepperConfig.orientation = orientation;
      return builder as FluentSimple;
    },

    withPage(pageId: string, title: string = pageId): FluentSubBuilder<StepperPageBuilder<C, FluentSimple>> {
      const pageRecord: StepperPageRecord = {
        page: {
          pageId,
          title,
          buttons: [],
        },
        containedBuilders: [],
      };

      pageRecords.push(pageRecord);
      const pageBuilder: any = {};
      return createStepperPageBuilder<C, FluentSimple>(builder as FluentSimple, pageRecord, pageBuilder) as unknown as FluentSubBuilder<StepperPageBuilder<C, FluentSimple>>;
    },

    _buildExtension: (buildSettings: any, extendedElement: any) => {
      stepperConfig.pages = pageRecords.map((pageRecord) => ({
        ...pageRecord.page,
        content: buildPageContent(pageRecord, buildSettings),
      }));
      extendedElement.componentProps = {
        ...extendedElement.componentProps,
        stepperConfig,
      };
    },
  };

  return extension as StepperExtension<C, RT>;
}

function resolveActiveStep(pages: StepperPageDefinition[], initialPageId?: string) {
  if (!pages.length) {
    return 0;
  }

  if (initialPageId) {
    const foundIndex = pages.findIndex((page) => page.pageId === initialPageId);
    if (foundIndex >= 0) {
      return foundIndex;
    }
  }

  const activatedIndex = pages.findIndex((page) => page.activateOnOpen);
  return activatedIndex >= 0 ? activatedIndex : 0;
}

function buildPageNode<BS>(activePage?: StepperPageDefinition, buildSettings?: BS): ReUiPlanElementSetMember | null {
  if (!activePage?.content) {
    return null;
  }

  const pageElement: ReUiPlanElementSetMember = {
    componentName: ReGroupComponent.displayName,
    options: {
      isReUIPlanElement: true,
      componentName: ReGroupComponent.displayName,
      sharedProps: activePage.content.sharedProps,
      buildSettings: buildSettings,
    },
    containing: activePage.content.components,
  };

  return pageElement;
}

export default function StepperWizard(props: StepperProps & PropsWithChildren) {
  const { stepperConfig, children, reEngineElementFactory, record, value } = props;
  const pages = stepperConfig?.pages ?? [];
  const initialStep = useMemo(() => resolveActiveStep(pages, stepperConfig?.initialPageId), [pages, stepperConfig?.initialPageId]);
  const [activeStep, setActiveStep] = useState(initialStep);

  useEffect(() => {
    setActiveStep(initialStep);
  }, [initialStep]);

  const activePage = pages[activeStep];
  const localData = record ?? value;

  function handleButtonClick(button: StepperPageButton) {
    switch (button.role) {
      case 'back':
        setActiveStep((current: number) => Math.max(0, current - 1));
        break;
      case 'next':
        setActiveStep((current: number) => Math.min(pages.length - 1, current + 1));
        break;
      case 'finish':
        setActiveStep((_current: number) => Math.max(0, pages.length - 1));
        break;
      default:
        break;
    }
  }

  if (!pages.length) {
    return <>{children}</>;
  }

  return (
    <Paper elevation={0} sx={{ p: 2, backgroundColor: 'background.paper' }}>
      <Stepper activeStep={activeStep} orientation={stepperConfig?.orientation ?? 'horizontal'}>
        {pages.map((page, pageIndex) => (
          <Step key={page.pageId} completed={pageIndex < activeStep}>
            <StepButton onClick={() => setActiveStep(pageIndex)}>
              <StepLabel>
                <Stack spacing={0.25} alignItems="flex-start">
                  <Typography variant="subtitle2">{page.title}</Typography>
                  {page.description ? <Typography variant="caption" color="text.secondary">{page.description}</Typography> : null}
                </Stack>
              </StepLabel>
            </StepButton>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ pt: 2 }}>
        {activePage?.content && reEngineElementFactory ? reEngineElementFactory(buildPageNode(activePage) as any, localData) : children}
      </Box>

      {activePage?.buttons?.length ? (
        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ pt: 2 }}>
          {activePage.buttons.map((button, buttonIndex) => (
            <Button
              key={button.id ?? `${activePage.pageId}-button-${buttonIndex}`}
              variant={button.variant ?? (button.role === 'next' ? 'contained' : 'outlined')}
              color={button.color}
              disabled={button.disabled}
              onClick={() => handleButtonClick(button)}
            >
              {button.label}
            </Button>
          ))}
        </Stack>
      ) : null}
    </Paper>
  );
}

type FEC = <C extends CNTX, RT, BLD>(returnTo: RT, builder: BLD, contextPlaceHolder: C) => StepperExtension<C, RT>;

export const StepperComponent = createExtendedComponent<StepperProps, FEC>(
  StepperWizard,
  'Stepper',
  extendWithStepper as FEC
);
