import got from 'got';
import { View } from "msp_common";

export async function WriteData(view: View, data: any) {
  try {
    const id = data?.__entityId ?? '__noid__'
    const insertResponse = await got.put(`http://localhost:5000/v1/doc/upsert/${id}`, {
      json: {
        view: view,
        data: data
      },
      retry: { limit: 0 }, // Disable retries to get immediate feedback on failures
      responseType: 'json'
    });

  
    const result: any = insertResponse.body
    const ids = result.entity_ids;
    // will only have these where new entities were created
    if (ids) {
      const eid = ids.find((id: { key: string, id: string }) => id.key === data?.[view.rootKey] )?.id;
      
      if (eid) result.entityId = eid; // Attach the resolved entity ID to the result for downstream use
    }
    return result;
  } catch (error) {
    console.error('Error writing data:', error);
    throw error; // Re-throw the error after logging it
  }
}