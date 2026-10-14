/* @vitest-environment happy-dom */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import type { FluxorData } from 'msp_common';
import { LabelFrameComponent } from '../../components/containers/labelframe.js';
import { PresetTextComponent } from '../../components/primatives/presets/PresetText.js';
import { PresetUxOptionCheckComponent } from '../../components/primatives/presets/PresetUxOptionCheck.js';
import { ReEngine } from '../components/ReEngine.js';
import { Re } from '../index.js';
import { TestAppShell } from './testAppShell.js';

type JourneyUiModel = {
  showOptionalPanel: boolean;
};

const journeyUiFluxorData: FluxorData<JourneyUiModel> = {
  showOptionalPanel: {
    dictionaryName: 'JourneyUiModel',
    attributeName: 'showOptionalPanel',
    label: 'Show optional panel',
  },
};

type WizardUiModel = {
  desiredState: JourneyUiModel & {
    pendingRepositoryName: string;
  };
};

const desiredStateFluxorData: FluxorData<WizardUiModel['desiredState']> = {
  ...journeyUiFluxorData,
  pendingRepositoryName: {
    dictionaryName: 'JourneyUiModel',
    attributeName: 'pendingRepositoryName',
    label: 'Repository name',
  },
};

const wizardUiFluxorData: FluxorData<WizardUiModel> = {
  desiredState: {
    isComplex: true,
    children: desiredStateFluxorData,
  },
};

function journeyUiPlan() {
  return Re.makeUiPlan('JourneyUiOptions', '1.0')
    .withElementSet.usingFluxor(journeyUiFluxorData)
      .fromInlineElementSet
        .showingItem.fromComponentElement(PresetUxOptionCheckComponent)
          .withValueBinding((context) => context.localData.showOptionalPanel)
        .endElement
    .endSet
    .BuildUiPlan();
}

function nestedJourneyUiPlan() {
  return Re.makeUiPlan('NestedJourneyUiOptions', '1.0')
    .withElementSet.usingFluxor(wizardUiFluxorData)
      .fromInlineElementSet
        .showingItem.fromComponentElement(LabelFrameComponent)
          .withValueBinding((context) => context.localData.desiredState)
          .containingElementSet()
            .usingFluxor(desiredStateFluxorData)
            .showingItem.fromComponentElement(PresetUxOptionCheckComponent)
              .withLabel('Add new ECR')
              .withValueBinding((context) => context.localData.showOptionalPanel)
            .endElement
            .showingItem.fromComponentElement(PresetTextComponent)
              .withLabel('Repository name')
              .withDisableWhenRule((context) => !context.localData.showOptionalPanel)
              .withValueBinding((context) => context.localData.pendingRepositoryName)
            .endElement
          .end()
        .endElement
      .endSet
    .BuildUiPlan();
}

describe('PresetUxOptionCheck render-engine binding', () => {
  test('updates a journey-only field on the local UI model', () => {
    const uiModel: JourneyUiModel = { showOptionalPanel: false };

    render(
      <TestAppShell>
        <ReEngine UiPlan={journeyUiPlan()} sourceData={uiModel} />
      </TestAppShell>
    );

    fireEvent.click(screen.getByRole('checkbox'));

    expect(uiModel.showOptionalPanel).toBe(true);
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true);
  });

  test('updates a nested journey field and re-evaluates dependent rules', async () => {
    const uiModel: WizardUiModel = {
      desiredState: {
        showOptionalPanel: false,
        pendingRepositoryName: '',
      },
    };

    render(
      <TestAppShell>
        <ReEngine UiPlan={nestedJourneyUiPlan()} sourceData={uiModel} />
      </TestAppShell>
    );

    expect(screen.queryByRole('textbox', { name: 'Repository name' })).toBeNull();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Add new ECR' }));

    expect({
      nested: uiModel.desiredState.showOptionalPanel,
      root: (uiModel as WizardUiModel & { showOptionalPanel?: boolean }).showOptionalPanel,
    }).toEqual({ nested: true, root: undefined });
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Repository name' })).toBeTruthy();
    });
  });
});