import path from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const resourcesDir = path.resolve(__dirname, '../resources');

export async function loadResourceJson<T>(fileName: string): Promise<T> {
  const filePath = path.resolve(resourcesDir, fileName);
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
}
