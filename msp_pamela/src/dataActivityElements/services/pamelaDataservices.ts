import { ReadData, WriteData, type ActivitySet } from 'msp_svr_common';
import type { ServiceActivityResultBuilder } from 'msp_svr_common';

import {
  ArtefactAssertionsView,
  ArtefactAssertionsViewType,
  SemanticArtefactAssertionsView,
  buildPamelaStage1Fixture,
} from '../../data/graph/index.js';

const stage1Fixture = buildPamelaStage1Fixture();

function toPamelaViewData(name: string, entityType: string, row: Record<string, unknown>) {
  return {
    namespace: 'pamela',
    name,
    version: '1.0.0',
    viewRootEntityType: entityType,
    viewRootBusinessKey: String((row as any).id ?? (row as any).name ?? ''),
    content: { ...row },
  };
}

export async function listPamelaArtefactsHandler(
  _payload: unknown,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  const rows = stage1Fixture.artefacts.map((artefact) =>
    toPamelaViewData('PamelaArtefacts', 'artefact', artefact),
  );

  resultBuilder.log(`Data layer: returning ${rows.length} PAMELA artefact record(s).`);
  return resultBuilder.success({ data: rows });
}

export async function listPamelaAssertionsHandler(
  _payload: unknown,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  const rows = stage1Fixture.assertions.map((assertion) =>
    toPamelaViewData('PamelaAssertions', 'assertion', assertion),
  );

  resultBuilder.log(`Data layer: returning ${rows.length} PAMELA assertion record(s).`);
  return resultBuilder.success({ data: rows });
}

export async function writePamelaAssertionsHandler(
  data: ArtefactAssertionsViewType,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  try {
    const artefactName = data?.name;
    if (typeof artefactName !== 'string' || !artefactName) {
      return resultBuilder.failed('PAMELA assertion write requires a root artefact name.');
    }

    const existing = await ReadData(ArtefactAssertionsView, artefactName, { useBusinessKey: true });
    applyExistingIds(data as ViewNode, existing?.result?.data?.content ?? existing?.result?.data ?? existing?.data?.content ?? existing?.data);
    const writeResult = await WriteData(ArtefactAssertionsView, data);
    if (writeResult === undefined) {
      return resultBuilder.failed('PAMELA assertion write returned no backend result.');
    }

    return resultBuilder.success({ data: writeResult });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return resultBuilder.failed(`PAMELA assertion write failed: ${message}`);
  }
}

export async function writePamelaSemanticAssertionsHandler(
  data: typeof SemanticArtefactAssertionsView.dataType,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  try {
    const writeResult = await WriteData(SemanticArtefactAssertionsView, data);
    if (writeResult === undefined) {
      return resultBuilder.failed('PAMELA semantic assertion write returned no backend result.');
    }
    return resultBuilder.success({ data: writeResult });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return resultBuilder.failed(`PAMELA semantic assertion write failed: ${message}`);
  }
}

type ViewNode = Record<string, unknown>;

function applyExistingIds(incoming: ViewNode, existing: unknown): void {
  if (!existing || typeof existing !== 'object') return;

  const existingByName = new Map<string, ViewNode>();
  collectExistingNodes(existing as ViewNode, existingByName);
  applyIdsToIncomingNode(incoming, existingByName);
}

function collectExistingNodes(node: ViewNode, existingByName: Map<string, ViewNode>): void {
  if (typeof node.name === 'string' && typeof node.id === 'string' && node.id) {
    existingByName.set(node.name, node);
  }

  for (const childPath of ['assertions', 'assertionsAboutAssertion', 'relatedAssertions']) {
    const children = node[childPath];
    if (Array.isArray(children)) {
      children.forEach((child) => {
        if (child && typeof child === 'object') collectExistingNodes(child as ViewNode, existingByName);
      });
    }
  }
}

function applyIdsToIncomingNode(node: ViewNode, existingByName: Map<string, ViewNode>): void {
  const existing = typeof node.name === 'string' ? existingByName.get(node.name) : undefined;
  if (existing) {
    node.id = existing.id;
    if (typeof existing.__entityId === 'string') node.__entityId = existing.__entityId;
  }

  for (const childPath of ['assertions', 'assertionsAboutAssertion', 'relatedAssertions']) {
    const children = node[childPath];
    if (Array.isArray(children)) {
      children.forEach((child) => {
        if (child && typeof child === 'object') applyIdsToIncomingNode(child as ViewNode, existingByName);
      });
    }
  }
}

export type PamelaStage1DataService = ActivitySet;

import { PamelaResourceDataActivities } from '../activities/pamelaDataActivities.js';

export function getDataServiceActivities(): ActivitySet {
  return PamelaResourceDataActivities;
}
