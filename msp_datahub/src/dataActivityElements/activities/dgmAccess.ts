import { buildActivitySet, ServiceActivityResultBuilder } from 'msp_svr_common'
import type { ActivitySet } from 'msp_svr_common'
import { ReadData, WriteData } from 'msp_data_common';
import { DataObject, View, ViewDataContent } from 'msp_common';

const simpleViewActivitySet: ActivitySet = buildActivitySet()
    .withNamespace('datahub_dgm')
    .withVersion('1.0.0')
    .withMatchingVersionRange('*')
    .withContext('*')
    .use({
        activityName: 'readDataView',
        funcs: async (payload, serviceResult: ServiceActivityResultBuilder) => {
            console.log(`ReadData request received: ${JSON.stringify(payload)}`);
            if (!payload.view || !payload.id) {
                return serviceResult.failed(`Missing view or id in payload`);
            }
            const view: View = payload.view;
            const id: string = payload.id;
            const result = await ReadData(view, id);
            if (!result) {
                return serviceResult.failed(`Data not found for view ${payload.view} and id ${payload.id}`);
            }
            if ((result as any).success === false) {
                serviceResult.log((result as any).error);
                return serviceResult.failed(`Data request failed for view ${payload.view} and id ${payload.id}`);
            }
            const data = result as any as DataObject
            if (!data?.__entityId || !data.__metadata) {
                return serviceResult.success({
                    data: undefined,
                    message: `No data found for view ${view.name} and id ${id}`,
                });
            }
            const resultData: ViewDataContent<typeof view.dataType> = {
                    namespace: view.namespace ?? 'default',
                    version: view.version,
                    name: view.name,
                    variantName: view.variantName,
                    viewRootEntityId: data?.__entityId,
                    viewRootId: id,
                    viewRootEntityType: view.rootElement.domainObject?.name ?? 'unknown',
                    viewRootEntityHistoricTimestamp: data?.__metadata?.__timeStamp ? (new Date(data?.__metadata?.__timeStamp)).toISOString() : undefined,
                    viewRootBusinessKey: data?.__businessKey,
                    content: result
                }
            return serviceResult.success({
                data: resultData,
                message: `Data request successful for view ${payload.view} and id ${payload.id}`
            });
        }
    })
    .use({
        activityName: 'writeDataView',
        funcs: async (payload, serviceResult: ServiceActivityResultBuilder) => {
            console.log(`WriteData request received for view ${payload.view.name}: ${payload.view.variantName} : ${payload.view.version}`);
            return serviceResult.success(await WriteData(payload.view, payload.data));
        }
    })
    .build();

export { simpleViewActivitySet }