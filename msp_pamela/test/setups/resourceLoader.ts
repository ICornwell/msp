import path from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const resourcesDir = path.resolve(__dirname, '../resources');
const docsDir = path.resolve(__dirname, '../../docs');

export async function loadResourceJson<T>(fileName: string): Promise<T> {
  const resourcePath = path.resolve(resourcesDir, fileName);
  const docsPath = path.resolve(docsDir, fileName);
  const filePath = await readFile(resourcePath, 'utf8')
    .then(() => resourcePath)
    .catch(() => docsPath);
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
}
