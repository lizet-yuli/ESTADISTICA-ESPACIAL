// Tipos de archivo: etiqueta de la tarjeta, texto del filtro, ícono y color de acento
const TYPES = {
  pdf: { label: 'PDF', filter: 'PDFs', icon: 'fa-regular fa-file-pdf', color: '#ef4444' },
  zip: { label: 'ZIP', filter: 'Proyectos ZIP', icon: 'fa-regular fa-file-zipper', color: '#7c3aed' },
  r: { label: 'R', filter: 'Código R', icon: 'fa-solid fa-code', color: '#0284c7' },
  imagen: { label: 'Imagen', filter: 'Imágenes', icon: 'fa-regular fa-image', color: '#f59e0b' },
  html: { label: 'HTML', filter: 'HTML', icon: 'fa-solid fa-globe', color: '#16a34a' },
  enlace: { label: 'Enlace', filter: 'Enlaces', icon: 'fa-solid fa-arrow-up-right-from-square', color: '#64748b' },
};

const STATES = {
  'completada': { label: 'Completada', icon: 'fa-solid fa-circle-check', css: 'completada' },
  'en progreso': { label: 'En progreso', icon: 'fa-solid fa-hourglass-half', css: 'en-progreso' },
  'pendiente': { label: 'Pendiente', icon: 'fa-regular fa-clock', css: 'pendiente' },
};

const state = { tasks: [], unit: 'todas', type: 'todos', query: '' };

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initAvatar();
  initHeroCanvas();
  initFilters();
  initLightbox();
  initScrollTop();
  loadPortfolio();
});

// Texto seguro para insertar en HTML
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}

// Minúsculas y sin tildes, para que "raster" encuentre "ráster"
function normalize(text) {
  return String(text ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/* ---------- Navegación ---------- */

function initNavbar() {
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const sectionLinks = navLinks.querySelectorAll('a[href^="#"]');

  const sections = [...sectionLinks].map(link => document.querySelector(link.getAttribute('href')));

  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);

    // Resaltar en el menú la sección que se está viendo
    const line = window.scrollY + navbar.offsetHeight + 40;
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    let current = sections.filter(section => section.offsetTop <= line).pop() || sections[0];
    if (atBottom) current = sections[sections.length - 1];
    sectionLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current.id}`);
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Menú en pantallas pequeñas
  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open);
  });
  navLinks.addEventListener('click', event => {
    if (event.target.closest('a')) {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// Si no se encuentra img/avatar.jpg se muestra el emblema
function initAvatar() {
  const avatar = document.getElementById('avatar');
  const photo = document.getElementById('heroPhoto');
  const fallback = document.getElementById('avatarFallback');
  const showFallback = () => {
    photo.hidden = true;
    fallback.hidden = false;
  };

  if (avatar.complete && avatar.naturalWidth === 0) showFallback();
  else avatar.addEventListener('error', showFallback);
}

/* ---------- Fondo animado del hero: patrón de puntos espaciales ---------- */

function initHeroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  const hero = document.getElementById('inicio');
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LINK_DISTANCE = 130;
  const COLORS = ['245, 158, 11', '251, 113, 133', '201, 177, 187'];

  let width = 0;
  let height = 0;
  let points = [];
  let frameId = null;

  function createPoints() {
    // Densidad proporcional al área para que se vea igual en cualquier pantalla
    const count = Math.min(110, Math.round((width * height) / 14000));
    points = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: Math.random() * 1.8 + 0.8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: Math.random() * 0.45 + 0.2,
    }));
  }

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    width = canvas.offsetWidth;
    height = canvas.offsetHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    createPoints();
    if (reduceMotion) draw();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Líneas entre puntos vecinos
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const distance = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
        if (distance < LINK_DISTANCE) {
          ctx.strokeStyle = `rgba(245, 158, 11, ${(1 - distance / LINK_DISTANCE) * 0.13})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(points[j].x, points[j].y);
          ctx.stroke();
        }
      }
    }

    points.forEach(point => {
      ctx.fillStyle = `rgba(${point.color}, ${point.alpha})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function animate() {
    points.forEach(point => {
      point.x = (point.x + point.vx + width) % width;
      point.y = (point.y + point.vy + height) % height;
    });
    draw();
    frameId = requestAnimationFrame(animate);
  }

  resize();
  window.addEventListener('resize', resize);
  if (reduceMotion) return;

  // Pausar la animación cuando el hero no está a la vista
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && frameId === null) {
      animate();
    } else if (!entry.isIntersecting) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
  }).observe(hero);
}

/* ---------- Carga de datos ---------- */

async function loadPortfolio() {
  const loadingGrid = document.getElementById('loadingGrid');

  try {
    const response = await fetch('manifest.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const manifest = await response.json();

    state.tasks = manifest.tareas || [];

    if (manifest.repo) {
      document.querySelectorAll('[data-repo-link]').forEach(link => {
        link.href = `https://github.com/${manifest.repo}`;
      });
    }

    updateStats(manifest);
    buildUnitTabs();
    buildTypeFilters();
    renderCards();
  } catch (err) {
    console.warn('No se pudo cargar manifest.json:', err.message);
    loadingGrid.hidden = true;
    showEmptyState(
      'No se pudo cargar el portafolio',
      'Abre el sitio con "npm run dev" (no con doble clic en index.html) para que se genere manifest.json'
    );
  }
}

/* ---------- Estadísticas ---------- */

function updateStats(manifest) {
  const tasks = state.tasks;
  const completed = tasks.filter(task => task.estado === 'completada').length;
  const files = tasks.reduce(
    (total, task) => total + task.recursos.filter(resource => resource.disponible).length, 0
  );

  // Fecha del trabajo más reciente; si ninguno tiene fecha, la del último build
  const dates = tasks.filter(task => task.fecha).map(task => new Date(`${task.fecha}T00:00:00`));
  const latest = dates.length > 0 ? new Date(Math.max(...dates)) : new Date(manifest.generado);

  animateNumber(document.getElementById('statTotal'), tasks.length);
  animateNumber(document.getElementById('statCompleted'), completed);
  animateNumber(document.getElementById('statFiles'), files);
  document.getElementById('statUpdated').textContent = isNaN(latest)
    ? '—'
    : latest.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

function animateNumber(element, target) {
  const duration = 800;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.round(target * eased);
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ---------- Filtros ---------- */

function initFilters() {
  const unitTabs = document.getElementById('unitTabs');
  const filterButtons = document.getElementById('filterButtons');
  const searchInput = document.getElementById('searchInput');

  unitTabs.addEventListener('click', event => {
    const tab = event.target.closest('.unit-tab');
    if (!tab) return;
    unitTabs.querySelectorAll('.unit-tab').forEach(btn => btn.classList.remove('active'));
    tab.classList.add('active');
    state.unit = tab.dataset.unit;
    renderCards();
  });

  // Filtrado interactivo de proyectos por categoría
  filterButtons.addEventListener('click', event => {
    const button = event.target.closest('.filter-btn');
    if (!button) return;
    filterButtons.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    state.type = button.dataset.filter;
    renderCards();
  });

  let timer;
  searchInput.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      state.query = normalize(searchInput.value.trim());
      renderCards();
    }, 200);
  });

  // Cerrar los menús desplegables al hacer clic fuera
  document.addEventListener('click', event => {
    document.querySelectorAll('.dropdown[open]').forEach(dropdown => {
      if (!dropdown.contains(event.target)) dropdown.removeAttribute('open');
    });
  });
}

function buildUnitTabs() {
  const unitTabs = document.getElementById('unitTabs');
  const units = [...new Set(state.tasks.map(task => task.unidad).filter(Boolean))].sort();

  units.forEach(unit => {
    const tab = document.createElement('button');
    tab.className = 'unit-tab';
    tab.dataset.unit = unit;
    tab.textContent = unit;
    unitTabs.appendChild(tab);
  });
}

// Un botón por cada tipo de archivo que exista en el portafolio
function buildTypeFilters() {
  const filterButtons = document.getElementById('filterButtons');

  Object.keys(TYPES).forEach(type => {
    const count = state.tasks.filter(task => taskTypes(task).includes(type)).length;
    if (count === 0) return;

    const button = document.createElement('button');
    button.className = 'filter-btn';
    button.dataset.filter = type;
    button.innerHTML = `<i class="${TYPES[type].icon}"></i> ${TYPES[type].filter} <span class="filter-count">${count}</span>`;
    filterButtons.appendChild(button);
  });
}

function taskTypes(task) {
  return [...new Set(task.recursos.map(resource => resource.tipo))];
}

function matchesFilters(task) {
  if (state.unit !== 'todas' && task.unidad !== state.unit) return false;
  if (state.type !== 'todos' && !taskTypes(task).includes(state.type)) return false;
  if (state.query) {
    const text = normalize([task.titulo, task.descripcion, task.unidad, ...task.etiquetas].join(' '));
    if (!text.includes(state.query)) return false;
  }
  return true;
}

/* ---------- Tarjetas ---------- */

function renderCards() {
  const grid = document.getElementById('projectsGrid');
  const emptyState = document.getElementById('emptyState');
  const filtered = state.tasks.filter(matchesFilters);

  document.getElementById('loadingGrid').hidden = true;

  if (state.tasks.length === 0) {
    grid.hidden = true;
    showEmptyState('Aún no hay trabajos publicados', 'Aparecerán aquí al agregar una carpeta en tareas/ y hacer push');
    return;
  }
  if (filtered.length === 0) {
    grid.hidden = true;
    showEmptyState('No se encontraron trabajos', 'Intenta con otro término de búsqueda o filtro');
    return;
  }

  emptyState.hidden = true;
  grid.hidden = false;
  grid.innerHTML = filtered.map(cardHTML).join('');

  // Animación de entrada al aparecer en pantalla
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  grid.querySelectorAll('.card').forEach((card, index) => {
    card.style.transitionDelay = `${Math.min(index, 6) * 70}ms`;
    observer.observe(card);
  });
}

function showEmptyState(title, hint) {
  document.getElementById('emptyTitle').textContent = title;
  document.getElementById('emptyHint').textContent = hint;
  document.getElementById('emptyState').hidden = false;
}

function cardHTML(task) {
  const types = taskTypes(task);
  const accent = types.length > 0 ? TYPES[types[0]].color : '#94a3b8';
  const status = STATES[task.estado] || STATES.pendiente;

  const tags = types
    .map(type => `<span class="tag tag-${type}"><i class="${TYPES[type].icon}"></i> ${TYPES[type].label}</span>`)
    .join('');

  const thumbnail = task.miniatura
    ? `<a class="card-thumbnail" href="${esc(task.miniatura)}" data-gallery="${esc(task.id)}" aria-label="Ampliar imagen de ${esc(task.titulo)}">
         <img src="${esc(task.miniatura)}" alt="" loading="lazy">
         <span class="thumbnail-zoom"><i class="fa-solid fa-magnifying-glass-plus"></i></span>
       </a>`
    : '';

  const topics = task.etiquetas.length > 0
    ? `<div class="card-topics">${task.etiquetas.map(tag => `<span>#${esc(tag)}</span>`).join('')}</div>`
    : '';

  const number = task.numero ? `T${String(task.numero).padStart(2, '0')}` : '';

  const meta = [
    task.unidad ? `<i class="fa-regular fa-bookmark"></i>${esc(task.unidad)}` : '',
    task.fecha ? `<i class="fa-regular fa-calendar"></i>${formatDate(task.fecha)}` : '',
  ].filter(Boolean).join(' &nbsp;·&nbsp; ');

  return `
    <article class="card" style="--card-accent: ${accent}">
      ${thumbnail}
      <div class="card-body">
        <div class="card-top">
          <div class="tags">${tags}</div>
          <span class="card-number">${number}</span>
        </div>
        <h3>${esc(task.titulo)}</h3>
        <p>${esc(task.descripcion)}</p>
        ${topics}
        <div class="card-buttons">${buttonsHTML(task)}</div>
        <div class="card-footer">
          <span class="card-meta">${meta}</span>
          <span class="status-badge ${status.css}"><i class="${status.icon}"></i> ${status.label}</span>
        </div>
      </div>
    </article>`;
}

function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Los recursos con el mismo "grupo" se juntan en un botón desplegable
function buttonsHTML(task) {
  const resources = task.recursos;
  if (resources.length === 0) {
    return '<span class="btn btn-disabled"><i class="fa-regular fa-clock"></i> Archivos pendientes</span>';
  }

  const rendered = new Set();
  return resources.map(resource => {
    if (!resource.grupo) return resourceLink(resource, task, 'btn btn-outline', 'btn btn-disabled');
    if (rendered.has(resource.grupo)) return '';
    rendered.add(resource.grupo);

    const items = resources.filter(item => item.grupo === resource.grupo);
    if (items.length === 1) return resourceLink(resource, task, 'btn btn-outline', 'btn btn-disabled');

    return `
      <details class="dropdown">
        <summary class="btn btn-outline">
          <i class="${TYPES[resource.tipo].icon}"></i> ${esc(resource.grupo)} <i class="fa-solid fa-caret-down"></i>
        </summary>
        <div class="dropdown-menu">
          ${items.map(item => resourceLink(item, task, 'dropdown-item', 'dropdown-item disabled')).join('')}
        </div>
      </details>`;
  }).join('');
}

function resourceLink(resource, task, linkClass, disabledClass) {
  // El código fuente se abre en GitHub, por eso lleva su ícono
  const icon = resource.tipo === 'r' ? 'fa-brands fa-github' : TYPES[resource.tipo].icon;
  const content = `<i class="${icon}"></i> ${esc(resource.etiqueta)}`;

  if (!resource.disponible) {
    return `<span class="${disabledClass}" title="Archivo pendiente de subir" aria-disabled="true">${content}</span>`;
  }

  // Las imágenes se abren en el visor; el enlace queda como respaldo
  const extra = resource.tipo === 'zip' ? ' download'
    : resource.tipo === 'imagen' ? ` data-gallery="${esc(task.id)}"`
      : '';
  return `<a href="${esc(resource.url)}" class="${linkClass}" target="_blank" rel="noopener"${extra}>${content}</a>`;
}

/* ---------- Visor de imágenes ---------- */

function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const image = document.getElementById('lightboxImg');
  const caption = document.getElementById('lightboxCaption');
  const prevBtn = document.getElementById('lightboxPrev');
  const nextBtn = document.getElementById('lightboxNext');
  const closeBtn = document.getElementById('lightboxClose');

  let items = [];
  let index = 0;
  let lastFocus = null;

  function show(position) {
    index = (position + items.length) % items.length;
    image.src = items[index].url;
    image.alt = items[index].caption;
    caption.textContent = items.length > 1
      ? `${items[index].caption}  ·  ${index + 1} / ${items.length}`
      : items[index].caption;
  }

  function open(list, start) {
    items = list;
    lastFocus = document.activeElement;
    prevBtn.hidden = nextBtn.hidden = items.length < 2;
    show(start);
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function close() {
    lightbox.hidden = true;
    image.removeAttribute('src');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  // Galería: todas las imágenes publicadas del trabajo, empezando por la elegida
  document.getElementById('projectsGrid').addEventListener('click', event => {
    const link = event.target.closest('[data-gallery]');
    if (!link) return;
    const task = state.tasks.find(item => item.id === link.dataset.gallery);
    if (!task) return;
    event.preventDefault();

    const list = task.recursos
      .filter(resource => resource.tipo === 'imagen' && resource.disponible)
      .map(resource => ({ url: resource.url, caption: `${task.titulo} — ${resource.etiqueta.replace(/^ver\s+/i, '')}` }));
    let start = list.findIndex(item => item.url === link.getAttribute('href'));
    if (start === -1) {
      list.unshift({ url: link.getAttribute('href'), caption: task.titulo });
      start = 0;
    }

    link.closest('.dropdown')?.removeAttribute('open');
    open(list, start);
  });

  prevBtn.addEventListener('click', () => show(index - 1));
  nextBtn.addEventListener('click', () => show(index + 1));
  closeBtn.addEventListener('click', close);
  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) close();
  });

  document.addEventListener('keydown', event => {
    if (lightbox.hidden) return;
    if (event.key === 'Escape') close();
    if (event.key === 'ArrowLeft' && items.length > 1) show(index - 1);
    if (event.key === 'ArrowRight' && items.length > 1) show(index + 1);
  });
}

/* ---------- Botón para desplazar suavemente hacia arriba ---------- */

function initScrollTop() {
  const scrollTopBtn = document.getElementById('scrollTopBtn');

  window.addEventListener('scroll', () => {
    scrollTopBtn.classList.toggle('show', window.scrollY > 500);
  }, { passive: true });

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
