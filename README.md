# Estadística Espacial — Portafolio académico

Portafolio web del curso de Estadística Espacial de **Lizet Yuliana Coila Yucra**
(Ingeniería Estadística e Informática, UNA Puno). Cada trabajo vive en su propia
carpeta y el sitio se arma solo a partir de ellas.

**Ver portafolio:** https://lizet-yuli.github.io/ESTADISTICA-ESPACIAL/

## Estructura

```
├── site/                    Página web (lo que se ve)
│   ├── index.html
│   ├── css/styles.css
│   ├── js/app.js
│   └── img/                 avatar.png (foto del inicio)
├── tareas/                  Un trabajo por carpeta
│   └── tarea-01-.../
│       ├── metadata.json    Título, descripción y archivos del trabajo
│       └── ...              PDF, HTML, código R, figuras/
├── scripts/
│   ├── build.mjs            Arma el sitio en dist/ y genera manifest.json
│   └── serve.mjs            Servidor local con recarga
├── portafolio.config.json   Repositorio de GitHub al que apuntan los enlaces
└── .github/workflows/deploy.yml   Publicación automática en GitHub Pages
```

## Agregar un trabajo

1. Crea una carpeta en `tareas/` con el formato `tarea-NN-nombre-corto`
   (el número define el orden y el código `T06` de la tarjeta).
2. Copia dentro los archivos del trabajo (PDF, HTML, `.R`, imágenes en `figuras/`).
3. Crea `metadata.json`:

```json
{
  "titulo": "Autocorrelación espacial",
  "descripcion": "Índice de Moran global y local sobre la producción por distrito.",
  "unidad": "Unidad 2",
  "fecha": "2026-10-20",
  "etiquetas": ["Moran", "LISA"],
  "miniatura": "figuras/portada.png",
  "recursos": [
    { "etiqueta": "Ver PDF", "archivo": "informe.pdf" },
    { "etiqueta": "Código R", "archivo": "moran.R" },
    { "etiqueta": "Mapa LISA", "archivo": "mapa-lisa.html", "grupo": "Ver Mapas" },
    { "etiqueta": "Mapa de Moran", "archivo": "mapa-moran.html", "grupo": "Ver Mapas" }
  ]
}
```

4. Sube los cambios:

```bash
git add .
git commit -m "Agregar tarea 06: autocorrelación espacial"
git push
```

GitHub Actions construye y publica el sitio en uno o dos minutos.

### Campos de `metadata.json`

| Campo | Obligatorio | Descripción |
|:--|:--:|:--|
| `titulo` | Sí | Título de la tarjeta |
| `descripcion` | No | Texto de la tarjeta |
| `unidad` | No | Crea la pestaña de filtro (`"Unidad 1"`, `"Unidad 2"`…) |
| `fecha` | No | Formato `AAAA-MM-DD` |
| `etiquetas` | No | Temas; se muestran como `#tema` y sirven para el buscador |
| `miniatura` | No | Imagen de portada, ruta dentro de la carpeta |
| `estado` | No | `completada`, `en progreso` o `pendiente`. Si se omite se deduce: completada cuando todos los archivos declarados están subidos |
| `recursos` | No | Botones de la tarjeta. Si se omite, se crea un botón por cada archivo de la carpeta |

Cada recurso lleva `archivo` (ruta dentro de la carpeta) o `url` (enlace externo),
y opcionalmente `etiqueta` (texto del botón), `grupo` (los recursos con el mismo
grupo se juntan en un botón desplegable) y `tipo` (`pdf`, `r`, `html`, `imagen`,
`zip`, `enlace`; normalmente se deduce de la extensión).

Los archivos de código (`.R`, `.Rmd`, `.qmd`, `.py`) se abren en GitHub; el resto
se abre desde el propio sitio. Un recurso declarado cuyo archivo aún no existe
aparece como botón gris "pendiente" y el build lo lista.

## Ver el sitio en tu computadora

Requiere [Node.js](https://nodejs.org) 18 o superior. No hay que instalar nada más.

```bash
npm run dev      # abre http://localhost:8000 y se actualiza al guardar
npm run build    # solo construye dist/ y lista los archivos pendientes
```

El sitio no funciona abriendo `site/index.html` con doble clic: necesita
`manifest.json`, que se genera al construir.

## Tecnologías

| Componente | Tecnología |
|:--|:--|
| Página | HTML, CSS y JavaScript sin frameworks |
| Construcción | Node.js (sin dependencias) |
| Publicación | GitHub Actions → GitHub Pages |
