// Construye el sitio en dist/: copia site/, copia cada carpeta de tareas/
// y genera manifest.json a partir de los metadata.json.
// Uso: node scripts/build.mjs   (sin dependencias, Node 18+)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE_DIR = path.join(ROOT, 'site');
const TASKS_DIR = path.join(ROOT, 'tareas');
const OUT_DIR = path.join(ROOT, 'dist');

const EXTENSIONS = {
  pdf: ['.pdf'],
  zip: ['.zip', '.rar', '.7z'],
  r: ['.r', '.rmd', '.qmd', '.py'],
  html: ['.html', '.htm'],
  imagen: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
};
const DEFAULT_LABELS = {
  pdf: 'Ver PDF',
  zip: 'Descargar ZIP',
  r: 'Código R',
  html: 'Ver HTML',
  imagen: 'Ver imagen',
  enlace: 'Abrir enlace',
};
const STATES = ['completada', 'en progreso', 'pendiente'];
const IGNORED_FILES = ['metadata.json', 'readme.md'];

const errors = [];
const warnings = [];

function typeFromFile(file) {
  const ext = path.extname(file).toLowerCase();
  return Object.keys(EXTENSIONS).find(type => EXTENSIONS[type].includes(ext)) || null;
}

// Ruta relativa con "/" y cada segmento codificado (espacios, tildes, etc.)
function toUrl(...segments) {
  return segments.join('/').split(/[\\/]+/).map(encodeURIComponent).join('/');
}

function readConfig() {
  const file = path.join(ROOT, 'portafolio.config.json');
  const config = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  // En GitHub Actions el repositorio y la rama se toman del entorno
  return {
    repo: process.env.GITHUB_REPOSITORY || config.repo || '',
    rama: process.env.GITHUB_REF_NAME || config.rama || 'main',
  };
}

// Si metadata.json no declara "recursos", se detectan los archivos de la carpeta
function detectResources(dir) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isFile() && !IGNORED_FILES.includes(entry.name.toLowerCase()))
    .filter(entry => typeFromFile(entry.name))
    .map(entry => ({ archivo: entry.name }));
}

function buildResource(raw, folder, dir, config) {
  const where = `tareas/${folder}/metadata.json`;

  if (raw.url) {
    return {
      tipo: raw.tipo || 'enlace',
      etiqueta: raw.etiqueta || DEFAULT_LABELS.enlace,
      grupo: raw.grupo || null,
      url: raw.url,
      disponible: true,
    };
  }

  if (!raw.archivo) {
    errors.push(`${where}: cada recurso necesita "archivo" o "url"`);
    return null;
  }
  if (raw.archivo.split(/[\\/]/).includes('..')) {
    errors.push(`${where}: "${raw.archivo}" debe estar dentro de la carpeta de la tarea`);
    return null;
  }

  const tipo = raw.tipo || typeFromFile(raw.archivo);
  if (!tipo || !DEFAULT_LABELS[tipo]) {
    errors.push(`${where}: tipo desconocido para "${raw.archivo}" (usa: ${Object.keys(DEFAULT_LABELS).join(', ')})`);
    return null;
  }

  const disponible = fs.existsSync(path.join(dir, raw.archivo));
  if (!disponible) warnings.push(`tareas/${folder}: falta subir "${raw.archivo}"`);

  // El código fuente se lee en GitHub; el resto se abre desde el propio sitio
  const url = tipo === 'r' && config.repo
    ? `https://github.com/${config.repo}/blob/${config.rama}/${toUrl('tareas', folder, raw.archivo)}`
    : toUrl('tareas', folder, raw.archivo);

  return {
    tipo,
    etiqueta: raw.etiqueta || DEFAULT_LABELS[tipo],
    grupo: raw.grupo || null,
    url,
    disponible,
  };
}

function buildTask(folder, config) {
  const dir = path.join(TASKS_DIR, folder);
  const metaFile = path.join(dir, 'metadata.json');
  const where = `tareas/${folder}/metadata.json`;

  if (!fs.existsSync(metaFile)) {
    warnings.push(`tareas/${folder}: no tiene metadata.json, se omite`);
    return null;
  }

  let meta;
  try {
    meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
  } catch (err) {
    errors.push(`${where}: JSON inválido (${err.message})`);
    return null;
  }

  if (!meta.titulo) errors.push(`${where}: falta "titulo"`);
  if (meta.fecha && !/^\d{4}-\d{2}-\d{2}$/.test(meta.fecha)) {
    errors.push(`${where}: "fecha" debe tener el formato AAAA-MM-DD`);
  }
  if (meta.estado && !STATES.includes(meta.estado)) {
    errors.push(`${where}: "estado" debe ser uno de: ${STATES.join(', ')}`);
  }

  const recursos = (meta.recursos || detectResources(dir))
    .map(raw => buildResource(raw, folder, dir, config))
    .filter(Boolean);

  // Sin "estado" declarado, se deduce de los archivos que ya están subidos
  const disponibles = recursos.filter(r => r.disponible).length;
  const estado = meta.estado
    || (recursos.length > 0 && disponibles === recursos.length ? 'completada'
      : disponibles > 0 ? 'en progreso'
        : 'pendiente');

  let miniatura = null;
  if (meta.miniatura) {
    if (fs.existsSync(path.join(dir, meta.miniatura))) {
      miniatura = toUrl('tareas', folder, meta.miniatura);
    } else {
      warnings.push(`tareas/${folder}: falta la miniatura "${meta.miniatura}"`);
    }
  }

  const numero = Number((folder.match(/^tarea-(\d+)/) || [])[1]) || null;

  return {
    id: folder,
    numero,
    titulo: meta.titulo || folder,
    descripcion: meta.descripcion || '',
    unidad: meta.unidad || null,
    fecha: meta.fecha || null,
    estado,
    etiquetas: meta.etiquetas || [],
    miniatura,
    recursos,
  };
}

function build() {
  errors.length = 0;
  warnings.length = 0;
  const config = readConfig();

  const folders = fs.existsSync(TASKS_DIR)
    ? fs.readdirSync(TASKS_DIR, { withFileTypes: true })
      .filter(entry => entry.isDirectory() && !/^[._]/.test(entry.name))
      .map(entry => entry.name)
      .sort()
    : [];

  const tareas = folders.map(folder => buildTask(folder, config)).filter(Boolean);

  if (errors.length > 0) {
    console.error('\nNo se pudo construir el sitio:');
    errors.forEach(msg => console.error(`  x ${msg}`));
    return false;
  }

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.cpSync(SITE_DIR, OUT_DIR, { recursive: true });

  tareas.forEach(task => {
    fs.cpSync(path.join(TASKS_DIR, task.id), path.join(OUT_DIR, 'tareas', task.id), {
      recursive: true,
      filter: src => path.basename(src).toLowerCase() !== 'metadata.json',
    });
  });

  const manifest = { ...config, generado: new Date().toISOString(), tareas };
  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`Sitio construido en dist/ (${tareas.length} tareas)`);
  if (warnings.length > 0) {
    console.log('\nPendientes:');
    warnings.forEach(msg => console.log(`  - ${msg}`));
  }
  return true;
}

export { build };

// Ejecutado directamente (no importado desde serve.mjs)
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!build()) process.exit(1);
}
