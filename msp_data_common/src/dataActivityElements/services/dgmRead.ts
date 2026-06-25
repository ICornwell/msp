import { View } from 'msp_common';

export async function ReadData(view: View, id: string) {
  const readResponse = await fetch(`http://localhost:5000/v1/doc/query/${id}`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(view),
  });

  if (!readResponse.ok) {
    throw new Error(`ReadData request failed with status ${readResponse.status}`);
  }

  return readResponse.json();
}