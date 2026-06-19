import { DataViewIdQueryEnvelope, DataViewIdUpsertEnvelope } from "msp_common";
import { findViewHandlingActivity } from "./viewRegistry.js";
import { routeDataActivity, routeServiceActivity } from "./activityRouter.js";
import { ReadData, WriteData } from "msp_svr_common";

export async function tryViewActivities(isWrite: boolean, request: DataViewIdQueryEnvelope | DataViewIdUpsertEnvelope) {
  const activity = findViewHandlingActivity(isWrite,
    request.payload.viewId.namespace,
    request.payload.viewId.name,
    request.payload.viewId.version,
    request.payload.viewId.variant || 'default'
  );

  if (activity && activity.owner.type === 'feature' && activity.owner.isDataFeature) {
    const result = await routeDataActivity(
      activity.owner.namespace!,
      activity.owner.name,
      activity.owner.version!,
      activity.owner.variantName || 'default',
      request.payload,);

    return result;
  }

  if (activity && activity.owner.type === 'feature' && !activity.owner.isDataFeature) {
    const result = await routeServiceActivity(
      activity.owner.namespace!,
      activity.owner.name,
      activity.owner.version!,
      activity.owner.variantName || 'default',
      request.payload,);

    return result;
  }
  return undefined;
}

export async function tryDirectWriteViews(request:  DataViewIdUpsertEnvelope) {
  const activity = findViewHandlingActivity(true,
    request.payload.viewId.namespace,
    request.payload.viewId.name,
    request.payload.viewId.version,
    request.payload.viewId.variant || 'default'
  );

  if (activity && activity.isWriteAllowed) {
      return await WriteData(activity.viewIdentifier.view, request.payload.data, request.payload.options?.dataRequestOptions);
  }  
  return
}

export async function tryDirectReadViews(request:  DataViewIdQueryEnvelope) {
  const activity = findViewHandlingActivity(false,
    request.payload.viewId.namespace,
    request.payload.viewId.name,
    request.payload.viewId.version,
    request.payload.viewId.variant || 'default'
  );

  if (activity) {
      return await ReadData(activity.viewIdentifier.view, request.payload.id, request.payload.options?.dataRequestOptions);
  }  
  return
}