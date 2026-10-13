// Servidor local: construye el sitio, lo sirve en http://localhost:8000
// y lo reconstruye cuando cambia algo en site/ o tareas/.
// Uso: node scripts/serve.mjs

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './build.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'dist');
const PORT = Number(process.env.PORT) || 8000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.zip': 'application/zip',
};

build();

http.createServer((req, res) => {
  let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (pathname.endsWith('/')) pathname += 'index.html';

  const file = path.join(OUT_DIR, pathname);
  if (!file.startsWith(OUT_DIR) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 - No encontrado');
    return;
  }

  res.writeHead(200, {
    'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => {
  console.log(`\nPortafolio en http://localhost:${PORT}  (Ctrl+C para detener)`);
});

// Reconstruir al guardar cambios. Si se mueven o borran archivos a mitad
// de la copia, se avisa y se reintenta en el siguiente cambio.
function rebuild() {
  try {
    build();
  } catch (err) {
    console.error(`No se pudo reconstruir (${err.code || err.message}); se reintentará al próximo cambio`);
  }
}

let timer;
['site', 'tareas'].forEach(dir => {
  fs.watch(path.join(ROOT, dir), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(rebuild, 300);
  });
});
