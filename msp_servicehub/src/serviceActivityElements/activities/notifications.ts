import { buildActivitySet } from 'msp_svr_common';
import type { ActivitySet, ServiceActivityResultBuilder } from 'msp_svr_common';

import { getWsHubStats, publishUiNotification } from '../services/wsHub.js';

// Internal publish seam for the /ws/v1 UI notification hub.
// Modules (e.g. an msp_aws resource watcher) call
//   notifications/publishUiNotification/1.0.0 { topic, payload }
// and every connected front-end subscribed to the topic receives the event.

export type PublishUiNotificationPayload = {
  topic: string;
  payload?: unknown;
};

async function publishUiNotificationHandler(
  payload: PublishUiNotificationPayload,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  const topic = payload?.topic?.trim();
  if (!topic) {
    return resultBuilder.successfullyFailed({ delivered: 0 }, 'A topic is required.', { code: 'WS_PUBLISH_NO_TOPIC' });
  }

  const delivered = publishUiNotification(topic, payload?.payload);
  resultBuilder.log(`Published UI notification '${topic}' to ${delivered} client(s).`);
  return resultBuilder.success({ delivered });
}

async function getUiNotificationStatsHandler(
  _payload: unknown,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  return resultBuilder.success(getWsHubStats());
}

const notificationsActivitySet: ActivitySet =
  buildActivitySet()
    .withNamespace('notifications')
    .withVersion('1.0.0')
    .withMatchingVersionRange('*')
    .withContext('*')
    .use({
      activityName: 'publishUiNotification',
      funcs: publishUiNotificationHandler,
    })
    .use({
      activityName: 'getUiNotificationStats',
      funcs: getUiNotificationStatsHandler,
    })
    .build();

export { notificationsActivitySet };
