import { getUltimateRequesterId, ServiceActivityResultBuilder } from "msp_svr_common";
import { getFeatureAliasForProduct, getRegisteredFeatures } from "../uiFeatureRegistry.js";
import { UiRemoteIdentity } from "msp_common";

export async function discoverOpenUiFeatures(payload: any, serviceResult: ServiceActivityResultBuilder) {
  console.log(`Discovery request received: ${JSON.stringify(payload)}`);
  const product = payload?.product || {
    domain: '*',
    name: '*',
    version: '*',
    variantName: '*',
  };
  console.log(`SVR: Discovering features for product: ${JSON.stringify(product)}`);
  const userIdClaim = getUltimateRequesterId();

  const allFeatures = getRegisteredFeatures();
  console.log(`Currently registered features: ${allFeatures.length}`);
  const matchingFeatures = allFeatures
    .filter(feature => feature.allowedContexts.includes('*')
      || (feature.allowedContexts.includes('AUTH') && userIdClaim))
    .map(feature => getFeatureAliasForProduct(
      feature.namespace || '*',
      feature.name || '*',
      product.domain || '*',
      product.name || '*',
      product.version || '*',
      product.variantName || '*'
    ))
    .map(feature => {
      const uiFeatureIdentity = { ...feature };
      // remoteEntry has a real, internal Url for the services
      // we do not expose this to browser clients
      // the proxy keeps it for routing purposes
      delete uiFeatureIdentity.remoteEntry; // remoteEntry is not part of the identity, it's just routing info
      return uiFeatureIdentity as UiRemoteIdentity // Only return features that have a valid remoteEntry for routing
    }).filter(match => match) as unknown as UiRemoteIdentity[];


  if (matchingFeatures.length == 0) return serviceResult.failed('No matching feature found');

  return serviceResult.success({ features: matchingFeatures })
}