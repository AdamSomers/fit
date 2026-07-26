import { existsSync } from 'node:fs';
import http from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { app } from './app.js';

// In production (launchd), this one process also serves the built web app.
// In development, Vite serves the frontend on 5177 and proxies /api here.
const webDist = join(dirname(fileURLToPath(import.meta.url)), '../../web/dist');
const serveWeb = existsSync(webDist) && process.env.FIT_SERVE_WEB !== '0';
if (serveWeb) {
  app.use(express.static(webDist));
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(join(webDist, 'index.html'));
  });
}

const API_PORT = 8003;
const WEB_PORT = 5177;

http.createServer(app).listen(API_PORT, '0.0.0.0', () => {
  console.log(`fit api listening on 0.0.0.0:${API_PORT}`);
});

// Keep the user-facing port working when Vite isn't running (production mode).
// If Vite is up (dev), 5177 is taken and we serve the API only.
if (serveWeb) {
  http
    .createServer(app)
    .listen(WEB_PORT, '0.0.0.0', () => {
      console.log(`fit web listening on 0.0.0.0:${WEB_PORT}`);
    })
    .on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`port ${WEB_PORT} in use (vite dev?), serving api only`);
      } else {
        throw err;
      }
    });
}
