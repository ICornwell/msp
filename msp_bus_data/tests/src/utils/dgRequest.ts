import got from 'got';
import { View, ViewWithData, UpsertViewResponse } from '../models/api/view.js';

const BASE_URL = 'http://localhost:5000/v1/doc';

/**
 * Execute a query request using a View definition
 * @param id - The ID for the query endpoint
 * @param view - The View definition to query with
 * @returns The query result (any)
 */
export async function queryView(id: string, view: View): Promise<any> {
  const url = `${BASE_URL}/query/${id}`;
  
  try {
    const response = await got.put(url, {
      json: view,
      responseType: 'json'
    });
    
    return response.body;
  } catch (error) {
    console.error(`Query request failed for ${url}:`, error);
    throw error;
  }
}

/**
 * Execute an upsert request using a ViewWithData
 * @param id - The ID for the upsert endpoint
 * @param viewWithData - The ViewWithData containing view definition and data
 * @returns The upsert response with success status and affected vertices/edges
 */
export async function upsertViewData(id: string, viewWithData: ViewWithData): Promise<UpsertViewResponse> {
  const url = `${BASE_URL}/upsert/${id}`;
  
  try {
    const response = await got.put(url, {
      json: viewWithData,
      responseType: 'json'
    });
    
    return response.body as UpsertViewResponse;
  } catch (error) {
    console.error(`Upsert request failed for ${url}:`, error);
    throw error;
  }
}
