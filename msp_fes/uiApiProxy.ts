import express, { json, urlencoded, static as staticEx } from 'express';
import asyncify from 'express-asyncify';

import cookieParser from 'cookie-parser';
import { join } from 'path';
import { fileURLToPath } from 'url';

import fileUpload from 'express-fileupload';
import cors from 'cors';
import fetch from 'node-fetch';

import { Ports } from 'msp_common'

const _dirname = typeof __dirname !== 'undefined' ? __dirname : join(fileURLToPath(new URL('.', import.meta.url)), '..');

// Initialize Express application
const app = asyncify(express());

app.use((_req: any, res: any, next: any) => {
  res.socket.setTimeout(0); // 5 minutes
  next();
})

// app.use(logger('tiny', { stream: ConsoleStream() }))
app.use(json({ limit: '500mb' }));
app.use(urlencoded({ limit: '500mb', extended: true }));
app.use(cookieParser());
app.use(staticEx(join(_dirname, 'public')));
app.use(fileUpload({
  limits: {
    // When the frontend calls us with a mix of JSON and file data (encoded as
    // a multipart form), the fields are first parsed by busboy (a dependency
    // of the express-fileupload lib). Busboy limits the size of multipart fie.
    // to a really low value by default, so here we unshackle it. The overall
    // request continues to have an upper limit imposed by NGINX and the ingre:
    // controller.
    fieldSize: Infinity
  }
}));
const corsoptions = {
  origin: '*',
  allowedHeaders: '*',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) chol
};
app.use(cors(corsoptions));
app.use('/api/v1', async (req, res, next) => {
  let url
  try {
    console.log(`received request for url:${req.url}`);
    url = new URL(`${req.protocol}://${req.host}${req.url}`);
    console.log(`host is ${req.host}`);
  } catch (err) {
    console.log(`not a valid url for bff, so back to vite: ${req.protocol}://`);
    next(); // not a valid url so not for us
    return;
  }
  try {
    // Rewrite the request to point to the internal core df service
    // TODO: replace the simple 'internalHost' logic with a obfuscation layer
    // that maps external non-revealing host refs to internal hostnames
    const internalHost = `${url.host.split(':')[0]}:${Ports.core.uiBff}`;
    let queryParams = Object.entries(req.query ?? {}).map(([key, value]: [string, any])  =>
      `${key}=${encodeURIComponent(value)}`).join('&');
    if (queryParams && queryParams.length > 0) {
      queryParams = '?' + queryParams;
    }
    const urlText = `${url.protocol}//${internalHost}/api/v1${req.url.split('?')[0]}${queryParams}`;
    const newUrl = new URL(urlText);
    console.log(`MSP UI request to ${req.originalUrl} redirected to ${newUrl} using method ${req.method}`);
    console.log(`body type is ${typeof req.body}`);
    const bodyContent = (typeof req.body === 'string') ? req.body : JSON.stringify(req.body);
    const controller = new AbortController();
    const simpleHeaders = Object.entries(req.headers || {}).reduce((acc, [key, value]) => {
      if (Array.isArray(value)) {
        acc[key] = value.join(', ');
      } else if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>);
    const upstreamRes = await fetch(newUrl,
      {
        ...req,
        method: req.method,
        body: req.method === 'GET' ? null : bodyContent,
        headers: { ...simpleHeaders, host: newUrl.host },
        signal: controller.signal
      }
    );
    if (upstreamRes.status === 304) {
      res.status(304);
      const allowed304Headers = [
        'etag', 'last-modified', 'cache-control', 'expires', 'date', 'vary'
      ];
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
    upstreamRes.body?.on('error', (err) => {
      console.error('Error in upstream response stream:', err);
      controller.abort();
      res.end();
    });

    stream?.on('error', (err) => {
      console.error('Error piping response stream:', err);
      res.end();
    })

    req.socket.on('close', () => {
      if (!res.writableEnded) {
        console.log('Request socket closed prematurely, aborting upstream request');
        stream?.destroy();
        controller.abort();
      }
    })

    console.log(`Bff request to ${req.originalUrl} completed with status ${upstreamRes.status}`);
    return
  } catch (err) {
    console.error(`Error processing Bff request to ${req.originalUrl}:`, err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.use((req, _res, next) => {
  console.log(`Bff passing through request for url:${req.url} back to vite`);
  next();
});

export default app;
    