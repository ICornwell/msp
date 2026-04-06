import express from 'express';
import cors from 'cors';
import { createSemaphoreRouter } from './routes/semaphores.js';
import { InMemorySemaphoreProvider } from '../providers/inMemory/InMemorySemaphoreProvider.js';
import {Ports} from 'msp_svr_common'
const app = express();

app.use(express.json({ limit: '5mb' }));
app.use(cors({ origin: '*', allowedHeaders: '*' }));

const provider = new InMemorySemaphoreProvider({
  defaultTtlMs: Number(process.env['MSP_SEMAPHORE_DEFAULT_TTL_MS'] ?? 5000),
  warnLongTtlMs: Number(process.env['MSP_SEMAPHORE_WARN_TTL_MS'] ?? 30000),
  maxTtlMs: Number(process.env['MSP_SEMAPHORE_MAX_TTL_MS'] ?? 300000),
});

app.use('/api/v1/semaphores', createSemaphoreRouter(provider));

const port = Number(process.env['MSP_SEMAPHORE_PORT'] ?? Ports.core.semaphores);
app.listen(port, () => {
  console.log(`[msp_semaphores] listening on :${port} epoch=${provider.getIssuerEpoch()}`);
});
