import express, { json, static as staticEx, urlencoded } from 'express';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { fileURLToPath } from 'url';
import fileUpload from 'express-fileupload';
import cors from 'cors';
import fetch from 'node-fetch';

const Ports = {
  core: {
    dfInternal: process.env.CORE_DF_INTERNAL_PORT || '4006',
  },
};

const _dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : join(fileURLToPath(new URL('.', import.meta.url)), '..');

const app = express();

app.use((_req: any, res: any, next: any) => {
  res.socket.setTimeout(0);
  next();
});

app.use(json({ limit: '500mb' }));
app.use(urlencoded({ limit: '500mb', extended: true }));
app.use(cookieParser());
app.use(staticEx(join(_dirname, 'public')));
app.use(
  fileUpload({
    limits: {
      fieldSize: Infinity,
    },
  }),
);

const corsOptions = {
  origin: '*',
  allowedHeaders: '*',
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use('/api/v1', async (req, res, next) => {
  let url;
  try {
    url = new URL(`${req.protocol}://${req.host}${req.url}`);
  } catch (_err) {
    next();
    return;
  }

  try {
    const internalHost = `${url.host.split(':')[0]}:${Ports.core.dfInternal}`;
    let queryParams = Object.entries(req.query ?? {})
      .map(([key, value]: [string, any]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    if (queryParams && queryParams.length > 0) {
      queryParams = '?' + queryParams;
    }

    const urlText = `${url.protocol}//${internalHost}/api/v1${req.url.split('?')[0]}${queryParams}`;
    const newUrl = new URL(urlText);

    const bodyContent = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const controller = new AbortController();

    const simpleHeaders = Object.entries(req.headers || {}).reduce(
      (acc, [key, value]) => {
        if (Array.isArray(value)) {
          acc[key] = value.join(', ');
        } else if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, string>,
    );

    const upstreamRes = await fetch(newUrl, {
      ...req,
      method: req.method,
      body: req.method === 'GET' ? null : bodyContent,
      headers: { ...simpleHeaders, host: newUrl.host },
      signal: controller.signal,
    });

    if (upstreamRes.status === 304) {
      res.status(304);
      const allowed304Headers = ['etag', 'last-modified', 'cache-control', 'expires', 'date', 'vary'];
      for (const header of allowed304Headers) {
        const value = upstreamRes.headers.get(header);
        if (value) {
          res.setHeader(header, value);
        }
      }
      res.end();
      return;
    }

    res.status(upstreamRes.status);
    upstreamRes.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const stream = upstreamRes.body?.pipe(res);
    upstreamRes.body?.on('error', () => {
      controller.abort();
      res.end();
    });

    stream?.on('error', () => {
      res.end();
    });

    req.socket.on('close', () => {
      if (!res.writableEnded) {
        stream?.destroy();
        controller.abort();
      }
    });
    return;
  } catch (_err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.use((_req, _res, next) => {
  next();
});

export default app;
