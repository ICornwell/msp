import got from 'got';
import { View } from "msp_common";

export async function ReadData(view: View, id: string) {
    const readResponse = await got.put(`http://localhost:5000/v1/doc/query/${id}`, 
      {
        json: view,
        responseType: 'json',
        retry: { limit: 0 }
      }
    )

    return readResponse.body;
}