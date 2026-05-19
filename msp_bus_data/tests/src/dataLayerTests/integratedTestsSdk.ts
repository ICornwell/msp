import { View } from 'msp_common';
import got from 'got'

export async function WriteData(view: View, data: any) {
    const id = data?.__entityId ?? '__noid__'
    const insertResponse = await got.put(`http://localhost:5000/v1/doc/upsert/${id}`, {
      json: {
        view: view,
        data: data
      },
      retry: { limit: 0 }, // Disable retries to get immediate feedback on failures
      responseType: 'json'
    });

    expect(insertResponse.statusCode).toBe(200);

    const result = insertResponse.body
    const ids = result.entity_ids;
    // will only have these where new entities were created
    if (ids) {
      const eid = ids.find((id: { key: string, id: string }) => id.key === data?.[view.rootKey] )?.id;
      
      if (eid) result.entityId = eid; // Attach the resolved entity ID to the result for downstream use
    }
    return result;
}

export async function ReadData(view: View, id: string) {
    const readResponse = await got.put(`http://localhost:5000/v1/doc/query/${id}`, 
      {
        json: view,
        responseType: 'json',
        retry: { limit: 0 }
      }
    )

    expect(readResponse.statusCode).toBe(200);
    return readResponse.body;
}