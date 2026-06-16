// Service Activity Registry
// Uses ActivitySet for version matching and name matching

import { View, matchesId } from 'msp_common';
import { DataFeatureManifestSection, ActivityFeatureManifestSection, VersionedNamespaceResourceId } from 'msp_svr_common';


import { Manifest, ServiceManifestSection } from 'msp_svr_common';

import semver from 'semver/preload.js';

export type ViewRegistration = {
  viewIdentifier: VersionedNamespaceResourceId & { view: View };
  owner: VersionedNamespaceResourceId & { isDataFeature: boolean };
  isDirectView: boolean;
  isWriteAllowed?: boolean;
};

const readViews: ViewRegistration[] = [];
const writeViews: ViewRegistration[] = [];

const directViews: ViewRegistration[] = [];

function registrationForFeatureView(feature: ActivityFeatureManifestSection | DataFeatureManifestSection, view: View,
  service: ServiceManifestSection, manifest: Manifest, isDataFeature: boolean): ViewRegistration {
  const viewNamespace = view.namespace || (view as any).domain?.name || manifest.namespace || service.namespace || 'default';
  return {
    viewIdentifier: {
      type: 'view',
      namespace: viewNamespace,
      name: view.name,
      version: view.version || '1.0.0',
      variantName: view.variantName || 'default',
      view
    },
    owner: {
      type: 'feature',
      namespace: feature.namespace || service.namespace || manifest.namespace || 'default',
      name: feature.name || 'unnamed-activity',
      version: feature.version || service.version || manifest.version || '1.0.0',
      variantName: feature.variantName || service.variantName || manifest.variantName || 'default',
      isDataFeature,
    },
    isDirectView: false,
    isWriteAllowed: false
  }
}

function registrationForDirectView(owner: VersionedNamespaceResourceId, view: View,
  feature: ActivityFeatureManifestSection | DataFeatureManifestSection,
  service: ServiceManifestSection, manifest: Manifest, isWriteAllowed: boolean): ViewRegistration {
  const viewNamespace = view.namespace || (view as any).domain?.name || manifest.namespace || service.namespace || 'default';
  return {
    viewIdentifier: {
      type: 'view',
      namespace: viewNamespace,
      name: view.name,
      version: view.version || '1.0.0',
      variantName: view.variantName || 'default',
      view
    },
    owner: {
      type: 'feature',
      namespace: owner.namespace || feature.namespace || service.namespace || manifest.namespace || 'default',
      name: owner.name,
      version: owner.version || feature.version || service.version || manifest.version || '1.0.0',
      variantName: owner.variantName || feature.variantName || service.variantName || manifest.variantName || 'default',
      isDataFeature: false,

    },
    isDirectView: true,
    isWriteAllowed: isWriteAllowed
  }
}

export function registerViews(manifest: Manifest, service: ServiceManifestSection,
  features: (ActivityFeatureManifestSection | DataFeatureManifestSection)[], isDataFeature: boolean) {
  // Store registration for tracking
  for (const feature of features) {

    for (const view of feature.useForViewReads) {
      const registration: ViewRegistration = registrationForFeatureView(feature, view, service, manifest, isDataFeature);
      readViews.push(registration);
    }

    for (const view of feature.useForViewWrites) {
      const registration: ViewRegistration = registrationForFeatureView(feature, view, service, manifest, isDataFeature);
      registration.isWriteAllowed = true;
      writeViews.push(registration);
    }


    for (const viewManifestSection of service.directViews ?? []) {
      const namespace = viewManifestSection.owner.namespace || service.namespace || manifest.namespace || 'default';
      const name = viewManifestSection.owner.name
      const version = viewManifestSection.owner.version || service.version || manifest.version || '1.0.0';
      const variantName = viewManifestSection.owner.variantName || service.variantName || manifest.variantName || 'default';
      if (findViewHandlingActivity(true, namespace, name, version, variantName)
        || findViewHandlingActivity(false, namespace, name, version, variantName)) continue;

      directViews.push(registrationForDirectView(viewManifestSection.owner, viewManifestSection.view,
        feature, service, manifest, viewManifestSection.isWriteAllowed || false));
    }
  }
}

// Use the ActivitySet's handle method which has fancy version matching and name matching
export function findViewHandlingActivity(isWrite: boolean, namespace: string, view: string, version: string,
  variantName: string): ViewRegistration | undefined {

  const registrations = isWrite ? writeViews : readViews;

  const matchingRegistration = registrations.find(r =>
    matchesId(r.viewIdentifier, {
      namespace,
      name: view,
      version,
      variantName,
    }) && semver.satisfies(r.viewIdentifier.version ?? '1.0.0', version)
  );

  return matchingRegistration; // TODO: implement using serviceManager and registeredActivitySet
}

export function findDirectView(namespace: string, view: string, version: string,
  variantName: string): ViewRegistration | undefined {

  const registrations = directViews;

  const matchingRegistration = registrations.find(r =>
    matchesId(r.viewIdentifier, {
      namespace,
      name: view,
      version,
      variantName,
    }) && semver.satisfies(r.viewIdentifier.version ?? '1.0.0', version)
  );

  return matchingRegistration; // TODO: implement using serviceManager and registeredActivitySet
}