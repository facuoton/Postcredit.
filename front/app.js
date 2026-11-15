const main = document.querySelector('#main');
const header = document.querySelector('#header');
const menu = document.querySelector('#menu');
const menuToggle = document.querySelector('.nav-toggle');
const announcer = document.querySelector('#announcer');
const themeColor = document.querySelector('meta[name="theme-color"]');
let innerPage = false;
let touchStartY = null;
let touchEdgeLocked = false;
let wheelEdgeLocked = false;
let wheelUnlockTimer;
function setEdgeColor(light) {
  const color = light ? '#ffffff' : '#121312';
  if (themeColor.content !== color) themeColor.content = color;
  document.documentElement.style.setProperty('--overscroll-color', color);
}
function updateEdgeColor(direction = 0) {
  if (touchEdgeLocked || wheelEdgeLocked) return;
  if (!innerPage) { setEdgeColor(false); return; }
  const top = window.scrollY <= 1;
  const bottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1;
  if (top && bottom && direction) setEdgeColor(direction < 0);
  else if (top) setEdgeColor(true);
  else if (bottom) setEdgeColor(false);
}
window.addEventListener('scroll', () => updateEdgeColor(), { passive:true });
window.addEventListener('wheel', (event) => {
  if (!wheelEdgeLocked && event.deltaY) {
    updateEdgeColor(Math.sign(event.deltaY));
    const atEdge = window.scrollY <= 1 || window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1;
    if (atEdge) wheelEdgeLocked = true;
  }
  clearTimeout(wheelUnlockTimer);
  wheelUnlockTimer = setTimeout(() => { wheelEdgeLocked = false; updateEdgeColor(); }, 200);
}, { passive:true });
window.addEventListener('touchstart', (event) => { touchStartY = event.touches.length === 1 ? event.touches[0].clientY : null; touchEdgeLocked = false; }, { passive:true });
window.addEventListener('touchmove', (event) => {
  if (touchStartY === null || touchEdgeLocked || event.touches.length !== 1) return;
  const movement = event.touches[0].clientY - touchStartY;
  if (Math.abs(movement) < 4) return;
  const atTop = window.scrollY <= 1;
  const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1;
  if (atTop && movement > 0) { setEdgeColor(innerPage); touchEdgeLocked = true; }
  else if (atBottom && movement < 0) { setEdgeColor(false); touchEdgeLocked = true; }
}, { passive:true });
window.addEventListener('touchend', () => { touchStartY = null; touchEdgeLocked = false; }, { passive:true });
window.addEventListener('touchcancel', () => { touchStartY = null; touchEdgeLocked = false; }, { passive:true });
const state = { token: sessionStorage.getItem('postcredit-token'), user: null, categories: [] };
let cleanupHeroScroll = () => {};
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
const label = (value) => escapeHtml(value);
const arrow = '<span aria-hidden="true">↗</span>';
const categoryById = (id) => state.categories.find((item) => item.id === id);
// Dibujos propios, compartidos por el formulario y las reseñas del archivo.
const iconPaths = {
  claqueta: '<path d="M3 9h18v12H3zM3 9 2 5l17-3 1 4zM7 4l3 3M13 3l3 3"/>',
  libro: '<path d="M4 4.5C7 3 10 3 12 5v15c-2-2-5-2-8-.5zM20 4.5C17 3 14 3 12 5v15c2-2 5-2 8-.5z"/>',
  disco: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M7 9a6 6 0 0 1 4-3M17 15a6 6 0 0 1-4 3"/>',
  control: '<path d="M7 8h10c2 0 3 1 3.5 3l1 5c.5 2-1.5 3-3 1.5l-2-2h-9l-2 2C4 19 2 18 2.5 16l1-5C4 9 5 8 7 8zM7 10v4M5 12h4M16 11h.01M18 13h.01"/>',
  museo: '<path d="M2 9 12 3l10 6H2zM4 21h16M3 18h18M6 9v9M10 9v9M14 9v9M18 9v9"/>',
  plato: '<path d="M4 3v5a3 3 0 0 0 6 0V3M7 3v18M17 21V3c-2.5 1.5-4 5-4 8h4"/>',
  avion: '<path d="M17.5 2.5c1.4-.5 3.5-.5 4 0s.5 2.6 0 4l-5.4 5.4 1.9 6.7-1.8 1.8-4.2-5.1-3.4 3.4.2 2.3-1.4 1.4-2.1-3.5-3.5-2.1 1.4-1.4 2.3.2 3.4-3.4-5.1-4.2 1.8-1.8 6.7 1.9z"/>',
  estrella: '<path d="m12 2 3.1 6.3 7 1-5.1 4.9 1.2 7-6.2-3.3-6.2 3.3 1.2-7-5.1-4.9 7-1z"/>'
};
const categoryIcon = (cat) => `<svg class="category-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[cat?.icono] || iconPaths.estrella}</svg>`;
const score = (record) => { const cat = categoryById(record.categoria); return `<span class="score">${categoryIcon(cat)}<span>${label(record.puntuacion)} / 10 ${label(cat?.unidad || 'puntos')}</span></span>`; };
const options = (selected = '') => state.categories.map((item) => `<option value="${label(item.id)}" ${item.id === selected ? 'selected' : ''}>${label(item.nombre)}</option>`).join('');

async function api(path, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(path, { method, headers: { ...(body ? { 'Content-Type':'application/json' } : {}), ...(state.token ? { Authorization:`Bearer ${state.token}` } : {}) }, ...(body ? { body:JSON.stringify(body) } : {}) });
  } catch { throw new Error('No pudimos conectar con el servidor. Intentá nuevamente.'); }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && state.token && !path.startsWith('/usuarios/login')) { state.token = null; state.user = null; sessionStorage.removeItem('postcredit-token'); updateHeader(); }
    throw new Error(data.mensaje || 'Ocurrió un error. Intentá nuevamente.');
  }
  return data;
}
function updateHeader() {
  document.querySelector('[data-guest]').hidden = Boolean(state.token);
  document.querySelector('[data-logout]').hidden = !state.token;
}
let menuTimer;
function closeMenu() {
  clearTimeout(menuTimer);
  menuToggle.setAttribute('aria-expanded', 'false');
  menu.inert = true;
  menu.classList.remove('is-open');
  if (menu.hidden) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) menu.hidden = true;
  else menuTimer = setTimeout(() => { menu.hidden = true; }, 550);
}
function openMenu() {
  clearTimeout(menuTimer);
  menu.hidden = false;
  menu.inert = false;
  menuToggle.setAttribute('aria-expanded', 'true');
  requestAnimationFrame(() => { if (menuToggle.getAttribute('aria-expanded') === 'true') menu.classList.add('is-open'); });
}
menuToggle.addEventListener('click', () => { if (menuToggle.getAttribute('aria-expanded') === 'true') closeMenu(); else openMenu(); });
menu.addEventListener('click', (event) => { if (event.target.closest('a')) closeMenu(); });
document.querySelector('[data-logout]').addEventListener('click', () => { sessionStorage.removeItem('postcredit-token'); state.token = null; state.user = null; updateHeader(); closeMenu(); location.hash = '#/'; });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !menu.hidden) { closeMenu(); menuToggle.focus(); } });

function observeReveals() {
  const targets = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { targets.forEach((target) => target.classList.add('is-visible')); return; }
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), { threshold:.1 });
  targets.forEach((target) => observer.observe(target));
}
function landing() {
  const categories = state.categories.map((cat) => `<a class="category-link" href="#/archivo?categoria=${encodeURIComponent(cat.id)}"><span>${label(cat.nombre)}</span></a>`).join('');
  main.innerHTML = `<section class="hero-scroll"><div class="hero"><video class="hero-video" muted playsinline preload="auto" aria-hidden="true" tabindex="-1" poster="/assets/cine.jpg"><source src="/assets/cine-scroll.mp4" type="video/mp4"></video><div class="hero-grid"><h1 class="reveal">Hay cosas que<br>se quedan.</h1><p class="hero-copy mono reveal">LAS PELÍCULAS, LOS DISCOS, LOS LUGARES.<br>UN ARCHIVO DE LO QUE VIVISTE<br>Y DE LO QUE TE HIZO SENTIR.</p></div><div class="hero-bottom mono"><span>DESPUÉS DE LOS CRÉDITOS</span><a class="text-link" href="#/archivo">EXPLORAR MI ARCHIVO ${arrow}</a></div></div></section>
    <section class="section manifesto"><p class="eyebrow reveal">NO TODO TERMINA<br>CUANDO TERMINA.</p><h2 class="reveal">Una película que vuelve. Un disco que te acompaña. Un lugar al que querés regresar. Postcredit guarda lo que te pasó con cada uno, para que el tiempo no decida qué te acordás.</h2></section>
    <section class="section categories"><div class="section-top mono reveal"><span>CATEGORÍAS</span><p>CADA EXPERIENCIA, SU PROPIA ESCALA.<br>SIN COMPARAR UNA PELÍCULA CON UN VIAJE.</p></div><div class="categories-grid"><div class="category-list reveal">${categories}</div><div class="category-aside reveal"><div class="category-image"><img src="/assets/cine.jpg" alt="Sala de cine vacía con butacas rojas" loading="lazy"></div><p class="mono">UNA FORMA DE RECORDAR / A TU MANERA</p><p class="aside-copy">Lo que queda cuando se encienden las luces.</p></div></div></section>
    <section class="closing"><p class="mono">EL FINAL ES EL PRINCIPIO DEL RECUERDO.</p><h2>Postcredit.</h2><div class="closing-row mono"><span>TU CRITERIO. TU ARCHIVO.</span><a class="text-link" href="#/registro">EMPEZAR MI ARCHIVO ${arrow}</a></div></section>`;
  // El encabezado acompaña al hero fijo y se retira con él al terminar.
  document.querySelector('.hero').prepend(header);
  setupHeroScroll();
}
// En pantallas táctiles la secuencia evita depender de la carga y el seek del video.
function setupTouchHero(section, video) {
  video.remove();
  const canvas = document.createElement('canvas');
  canvas.className = 'hero-video hero-frames';
  canvas.setAttribute('aria-hidden', 'true');
  const hero = section.querySelector('.hero');
  hero.prepend(canvas);
  const context = canvas.getContext('2d', { alpha:false });
  const sprites = new Map();
  const portrait = window.matchMedia('(orientation: portrait)').matches;
  const frameWidth = portrait ? 360 : 720;
  const frameHeight = portrait ? 640 : 405;
  const columns = 5;
  const perSprite = columns * columns;
  const spriteCount = Math.ceil(100 / perSprite);
  const spriteFolder = portrait ? 'cine-vertical-v2' : 'cine-sprites-hd';
  let desired = 0, rendered = -1, raf = null, stopped = false;
  const schedule = () => { if (!stopped && raf === null) raf = requestAnimationFrame(update); };
  function loadSprite(index) {
    if (sprites.has(index)) return sprites.get(index);
    const image = new Image();
    const entry = { image, ready:false, promise:null };
    sprites.set(index, entry);
    image.src = `/assets/${spriteFolder}/${index}.jpg`;
    entry.promise = image.decode().then(() => {
      if (!stopped) { entry.ready = true; schedule(); }
    }).catch(() => {});
    return entry;
  }
  async function preloadSprites() {
    // Descifrar de a una evita competir por recursos al abrir la página.
    for (let index = 0; index < spriteCount && !stopped; index++) {
      await loadSprite(index).promise;
    }
  }
  function update() {
    raf = null;
    const distance = section.offsetHeight - hero.offsetHeight;
    if (distance <= 0) return;
    const progress = Math.max(0, Math.min(1, -section.getBoundingClientRect().top / distance));
    desired = Math.min(99, Math.round(progress * 99));
    const current = Math.floor(desired / perSprite);
    const entry = loadSprite(current);
    if (!entry.ready || !context) return;
    // El cuadro fuente ya tiene una resolución acotada; escalar el canvas a
    // muchos píxeles de dispositivo no agrega detalle y hace más caro dibujar.
    const ratio = 1;
    const width = Math.max(1, Math.round(hero.clientWidth * ratio));
    const height = Math.max(1, Math.round(hero.clientHeight * ratio));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; rendered = -1; }
    if (desired === rendered) return;
    const frame = desired % perSprite;
    const scale = Math.max(width / frameWidth, height / frameHeight);
    const drawnWidth = frameWidth * scale, drawnHeight = frameHeight * scale;
    context.drawImage(entry.image, (frame % columns) * frameWidth, Math.floor(frame / columns) * frameHeight, frameWidth, frameHeight,
      (width - drawnWidth) / 2, (height - drawnHeight) / 2, drawnWidth, drawnHeight);
    rendered = desired;
    canvas.classList.add('is-ready');
  }
  preloadSprites();
  window.addEventListener('scroll', schedule, { passive:true });
  window.addEventListener('resize', schedule, { passive:true });
  window.visualViewport?.addEventListener('resize', schedule, { passive:true });
  window.addEventListener('pageshow', schedule);
  document.addEventListener('visibilitychange', schedule);
  schedule();
  cleanupHeroScroll = () => {
    stopped = true;
    if (raf !== null) cancelAnimationFrame(raf);
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    window.visualViewport?.removeEventListener('resize', schedule);
    window.removeEventListener('pageshow', schedule);
    document.removeEventListener('visibilitychange', schedule);
    sprites.forEach(entry => entry.image.removeAttribute('src'));
    sprites.clear();
  };
}
function setupHeroScroll() {
  const section = document.querySelector('.hero-scroll');
  const video = section.querySelector('.hero-video');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    video.remove();
    return;
  }
  const touch = window.matchMedia('(pointer: coarse)').matches;
  const videoExperiment = touch && new URLSearchParams(location.search).get('hero') === 'video';
  if (touch && !videoExperiment) { setupTouchHero(section, video); return; }
  if (videoExperiment) {
    video.querySelector('source')?.remove();
    video.preload = 'none';
    video.muted = true;
    video.setAttribute('playsinline', '');
  }
  let mediaReady = !videoExperiment;
  let mediaObjectURL = null;
  const mediaRequest = videoExperiment ? new AbortController() : null;
  let primed = false, priming = false;
  let lastRequested = null;
  let frame = null;
  let target = 0;
  let disposed = false;
  const schedule = () => { if (!disposed && frame === null) frame = requestAnimationFrame(update); };
  function update() {
    frame = null;
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;
    const distance = section.offsetHeight - section.querySelector('.hero').offsetHeight;
    if (distance <= 0) return;
    const progress = Math.max(0, Math.min(1, -section.getBoundingClientRect().top / distance));
    target = progress * Math.max(0, video.duration - 1 / 24);
    if (!video.seeking && Math.abs(video.currentTime - target) > 1 / 48) {
      if (videoExperiment && typeof video.fastSeek === 'function') {
        // Todos los cuadros son keyframes; priorizar respuesta al movimiento.
        lastRequested = target;
        try { video.fastSeek(target); } catch { video.currentTime = target; }
      } else video.currentTime = target;
    }
  }
  const loaded = () => { video.removeAttribute('poster'); video.classList.add('is-ready'); schedule(); };
  const seeked = () => {
    if (videoExperiment && lastRequested !== null) {
      // Evitar búsquedas repetidas cuando fastSeek aproxima el cuadro.
      if (Math.abs(lastRequested - target) > 1 / 48) schedule();
    } else if (Math.abs(video.currentTime - target) > 1 / 48) schedule();
  };
  const failed = () => { video.classList.remove('is-ready'); };
  // Safari puede demorar la carga hasta que el video comience a reproducirse.
  function primeVideo() {
    if (!videoExperiment || !mediaReady || disposed || primed || priming || document.hidden) return;
    priming = true;
    video.play().then(() => {
      video.pause();
      if (!disposed) { primed = true; schedule(); }
    }).catch(() => {}).finally(() => { priming = false; });
  }
  function restoreVideo() {
    if (disposed || document.hidden || !mediaReady) return;
    // Safari puede descartar el decodificador mientras la pestaña está oculta.
    // Recuperar los cuadros sin recargar la página y sincronizar al cargar.
    video.classList.remove('is-ready');
    primed = false;
    lastRequested = null;
    video.load();
    primeVideo();
  }
  video.addEventListener('loadeddata', loaded);
  video.addEventListener('seeked', seeked);
  video.addEventListener('error', failed);
  window.addEventListener('scroll', schedule, { passive:true });
  window.addEventListener('resize', schedule, { passive:true });
  document.addEventListener('visibilitychange', restoreVideo);
  window.addEventListener('pageshow', restoreVideo);
  if (videoExperiment) {
    window.addEventListener('touchstart', primeVideo, { passive:true });
    // Esperar a descargar el video completo evita pausas por buffering durante el scroll.
    fetch('/assets/cine-scroll-vertical.mp4', { signal:mediaRequest.signal })
      .then(response => { if (!response.ok) throw new Error('No se pudo descargar el video'); return response.blob(); })
      .then(blob => {
        if (disposed) return;
        mediaObjectURL = URL.createObjectURL(blob);
        video.src = mediaObjectURL;
        mediaReady = true;
        video.load();
        primeVideo();
      }).catch(error => {
        if (disposed || error.name === 'AbortError') return;
        // Si la descarga anticipada falla, conservar la reproducción directa.
        video.src = '/assets/cine-scroll-vertical.mp4';
        mediaReady = true;
        video.load();
        primeVideo();
      });
  }
  if (video.readyState >= 2) loaded();
  cleanupHeroScroll = () => {
    disposed = true;
    if (frame !== null) cancelAnimationFrame(frame);
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    document.removeEventListener('visibilitychange', restoreVideo);
    window.removeEventListener('pageshow', restoreVideo);
    window.removeEventListener('touchstart', primeVideo);
    video.removeEventListener('loadeddata', loaded);
    video.removeEventListener('seeked', seeked);
    video.removeEventListener('error', failed);
    video.pause();
    mediaRequest?.abort();
    if (mediaObjectURL) URL.revokeObjectURL(mediaObjectURL);
  };
}
function auth(isRegister) {
  main.innerHTML = `<div class="page auth-layout"><div class="intro"><p class="eyebrow">${isRegister ? 'FORMÁ PARTE' : 'BIENVENID@ DE NUEVO'}</p><h1>${isRegister ? 'Tu archivo empieza acá.' : 'Volvé a lo que importa.'}</h1><p>Un lugar propio para guardar las experiencias que querés recordar.</p></div><form class="form" id="auth-form"><p class="eyebrow">${isRegister ? 'CREAR CUENTA' : 'INGRESAR'}</p>${isRegister ? '<label class="field"><span class="field-label">Nombre</span><input name="nombre" autocomplete="name" required maxlength="100" placeholder="Tu nombre"></label>' : ''}<label class="field"><span class="field-label">Correo electrónico</span><input type="email" name="email" autocomplete="email" required placeholder="tu@email.com"></label><label class="field"><span class="field-label">Contraseña</span><input type="password" name="password" autocomplete="${isRegister ? 'new-password' : 'current-password'}" required minlength="8" placeholder="Mínimo 8 caracteres"></label><div id="form-message" aria-live="polite"></div><button class="button" type="submit">${isRegister ? 'CREAR MI CUENTA' : 'INGRESAR'} ${arrow}</button><p class="helper">${isRegister ? '¿Ya tenés cuenta? <a class="plain-button" href="#/ingresar">Ingresá</a>' : '¿Es tu primera vez? <a class="plain-button" href="#/registro">Creá una cuenta</a>'}</p></form></div>`;
  document.querySelector('#auth-form').addEventListener('submit', async (event) => { event.preventDefault(); const form = event.currentTarget; const button = form.querySelector('button'); button.disabled = true; try { const data = await api(isRegister ? '/usuarios/registro' : '/usuarios/login', { method:'POST', body:Object.fromEntries(new FormData(form)) }); state.token = data.token; state.user = data.usuario; sessionStorage.setItem('postcredit-token', data.token); updateHeader(); location.hash = '#/archivo'; } catch (error) { showError(error.message); } finally { button.disabled = false; } });
}
function showError(message) { const node = document.querySelector('#form-message'); if (node) { node.className = 'notice'; node.textContent = message; } }
function empty(title, description, href, action) { return `<div class="empty"><h2>${title}</h2><p>${description}</p><a class="button" href="${href}">${action} ${arrow}</a></div>`; }
function experienceDate(record) {
  if (!record.fechaExperiencia) return '';
  const date = new Date(record.fechaExperiencia);
  if (Number.isNaN(date.getTime())) return '';
  return `<p class="experience-date mono">${new Intl.DateTimeFormat('es-UY', { day:'numeric', month:'long', year:'numeric', timeZone:'UTC' }).format(date)}</p>`;
}
function photoGallery(record) {
  if (!record.fotos?.length) return '';
  return `<div class="photo-gallery">${record.fotos.map((foto, index) => `<button type="button" class="photo-thumbnail" aria-label="Ampliar foto ${index + 1} de ${label(record.titulo)}"><img src="${label(foto)}" alt="Foto ${index + 1} de ${label(record.titulo)}" loading="lazy"></button>`).join('')}</div>`;
}
// Visor compartido por el archivo propio y las reseñas del círculo.
const photoViewer = document.createElement('dialog');
photoViewer.className = 'photo-viewer';
photoViewer.setAttribute('aria-label', 'Visor de fotos');
photoViewer.innerHTML = `<div class="photo-viewer-shell"><div class="photo-viewer-header mono"><span class="photo-viewer-count" aria-live="polite"></span><button type="button" class="photo-viewer-close" aria-label="Cerrar visor">CERRAR <span aria-hidden="true">×</span></button></div><div class="photo-viewer-content"><button type="button" class="photo-viewer-prev" aria-label="Foto anterior">←</button><img class="photo-viewer-image" alt=""><button type="button" class="photo-viewer-next" aria-label="Foto siguiente">→</button></div><p class="photo-viewer-title mono"></p></div>`;
document.body.append(photoViewer);
let viewerPhotos = [], viewerIndex = 0, viewerOpener = null;
function showViewerPhoto() {
  const current = viewerPhotos[viewerIndex];
  const image = photoViewer.querySelector('.photo-viewer-image');
  image.src = current.src;
  image.alt = current.alt;
  photoViewer.querySelector('.photo-viewer-count').textContent = `${String(viewerIndex + 1).padStart(2, '0')} / ${String(viewerPhotos.length).padStart(2, '0')}`;
  photoViewer.querySelector('.photo-viewer-title').textContent = current.alt;
  photoViewer.querySelector('.photo-viewer-prev').hidden = viewerPhotos.length < 2;
  photoViewer.querySelector('.photo-viewer-next').hidden = viewerPhotos.length < 2;
}
function moveViewer(step) { viewerIndex = (viewerIndex + step + viewerPhotos.length) % viewerPhotos.length; showViewerPhoto(); }
document.addEventListener('click', event => {
  const button = event.target.closest('.photo-thumbnail');
  if (!button) return;
  const thumbnails = [...button.closest('.photo-gallery').querySelectorAll('.photo-thumbnail')];
  viewerPhotos = thumbnails.map(item => ({ src:item.querySelector('img').src, alt:item.querySelector('img').alt }));
  viewerIndex = thumbnails.indexOf(button);
  viewerOpener = button;
  showViewerPhoto();
  photoViewer.showModal();
});
photoViewer.querySelector('.photo-viewer-close').addEventListener('click', () => photoViewer.close());
photoViewer.querySelector('.photo-viewer-prev').addEventListener('click', () => moveViewer(-1));
photoViewer.querySelector('.photo-viewer-next').addEventListener('click', () => moveViewer(1));
photoViewer.addEventListener('click', event => { if (event.target === photoViewer) photoViewer.close(); });
photoViewer.addEventListener('keydown', event => {
  if (viewerPhotos.length < 2) return;
  if (event.key === 'ArrowLeft') { event.preventDefault(); moveViewer(-1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); moveViewer(1); }
});
photoViewer.addEventListener('close', () => { if (viewerOpener?.isConnected) viewerOpener.focus(); viewerPhotos = []; photoViewer.querySelector('.photo-viewer-image').removeAttribute('src'); });
async function preparePhoto(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Elegí imágenes JPG, PNG o WebP.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    let quality = .84;
    let result = canvas.toDataURL('image/jpeg', quality);
    while (result.length > 1398100 && quality > .35) { quality -= .1; result = canvas.toDataURL('image/jpeg', quality); }
    if (result.length > 1398100) throw new Error('No pudimos reducir una de las fotos. Probá con otra imagen.');
    return result;
  } finally { URL.revokeObjectURL(url); }
}
function recordMarkup(record) { const cat = categoryById(record.categoria); return `<article class="record"><div><span class="tag muted">${label(cat?.nombre || record.categoria)} / ${record.visibilidad === 'circulo' ? 'COMPARTIDA CON MI CÍRCULO' : 'PRIVADA'}</span><h2>${label(record.titulo)}</h2>${experienceDate(record)}<p>${label(record.texto)}</p>${photoGallery(record)}</div><div class="record-meta"><span class="mono">${score(record)}</span><div class="record-actions"><button class="plain-button" type="button" data-share="${label(record._id)}">${record.visibilidad === 'circulo' ? 'Hacer privada' : 'Compartir con mi círculo'}</button><a class="plain-button" href="#/editar/${encodeURIComponent(record._id)}">Editar</a><button class="plain-button" data-delete="${label(record._id)}" type="button">Eliminar</button></div></div></article>`; }
// Conservar el select como fuente del valor y dibujar su lista con el estilo de la app.
function enhanceSelects(root) {
  root.querySelectorAll('select:not([data-customized])').forEach(select => {
    select.dataset.customized = 'true';
    const required = select.required;
    select.required = false;
    select.tabIndex = -1;
    select.setAttribute('aria-hidden', 'true');
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select';
    select.before(wrapper);
    wrapper.append(select);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'custom-select-trigger';
    button.setAttribute('aria-haspopup', 'listbox');
    button.setAttribute('aria-expanded', 'false');
    const name = select.getAttribute('aria-label') || wrapper.closest('.field')?.querySelector('.field-label')?.textContent || 'Elegir opción';
    button.setAttribute('aria-label', name);
    const list = document.createElement('div');
    list.className = 'custom-select-list';
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', name);
    list.hidden = true;
    wrapper.append(button, list);
    const update = () => {
      const selected = select.selectedOptions[0];
      button.innerHTML = `<span>${label(selected?.textContent || '')}</span><span class="custom-select-arrow" aria-hidden="true">↗</span>`;
      button.classList.toggle('is-placeholder', required && !select.value);
      list.querySelectorAll('[role="option"]').forEach(item => item.setAttribute('aria-selected', String(item.dataset.value === select.value)));
    };
    const close = (focus = false) => { list.hidden = true; button.setAttribute('aria-expanded', 'false'); if (focus && button.isConnected) button.focus(); };
    const open = () => {
      document.querySelectorAll('.custom-select-list:not([hidden])').forEach(other => { other.hidden = true; other.parentElement.querySelector('.custom-select-trigger').setAttribute('aria-expanded', 'false'); });
      list.hidden = false;
      button.setAttribute('aria-expanded', 'true');
      const target = list.querySelector('[aria-selected="true"]') || list.querySelector('[role="option"]');
      target?.focus();
    };
    [...select.options].forEach(option => {
      const item = document.createElement('button');
      item.type = 'button'; item.className = 'custom-select-option'; item.setAttribute('role', 'option');
      item.dataset.value = option.value; item.textContent = option.textContent; item.disabled = option.disabled;
      item.addEventListener('click', () => {
        select.value = option.value; update(); close(true);
        select.dispatchEvent(new Event('change', { bubbles:true }));
      });
      list.append(item);
    });
    button.addEventListener('click', () => list.hidden ? open() : close());
    button.addEventListener('keydown', event => { if (['ArrowDown','ArrowUp'].includes(event.key)) { event.preventDefault(); open(); } });
    list.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); close(true); return; }
      if (event.key === 'Tab') { close(); return; }
      const items = [...list.querySelectorAll('[role="option"]:not(:disabled)')];
      const index = items.indexOf(document.activeElement);
      let next = index;
      if (event.key === 'ArrowDown') next = Math.min(index + 1, items.length - 1);
      else if (event.key === 'ArrowUp') next = Math.max(index - 1, 0);
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = items.length - 1;
      else return;
      event.preventDefault(); items[next]?.focus();
    });
    select.addEventListener('change', update);
    if (required && select.form) select.form.addEventListener('submit', event => {
      if (!select.value) { event.preventDefault(); event.stopImmediatePropagation(); button.setAttribute('aria-invalid', 'true'); button.focus(); showError('Elegí una categoría.'); }
      else button.removeAttribute('aria-invalid');
    }, true);
    update();
  });
}
document.addEventListener('pointerdown', event => {
  document.querySelectorAll('.custom-select').forEach(wrapper => {
    if (!wrapper.contains(event.target)) { wrapper.querySelector('.custom-select-list').hidden = true; wrapper.querySelector('.custom-select-trigger').setAttribute('aria-expanded', 'false'); }
  });
});
async function archive(query) {
  const records = await api('/resenas');
  const selected = new URLSearchParams(query).get('categoria') || '';
  main.innerHTML = `<div class="page"><div class="page-heading"><div><p class="eyebrow">TU CRITERIO, TU ARCHIVO</p><h1>Mi archivo.</h1></div><div class="archive-actions"><a class="text-link mono" href="#/circulo">MI CÍRCULO ${arrow}</a><a class="button" href="#/nueva">NUEVA RESEÑA ${arrow}</a></div></div><div class="circle-intro"><p>Compartí las reseñas que elijas con las personas de tu círculo.</p><a class="text-link mono" href="#/circulo">INVITAR Y VER RESEÑAS ${arrow}</a></div><div class="filter-bar"><label class="field"><span class="field-label">Buscar</span><input id="search" type="search" placeholder="Buscar un recuerdo"></label><div class="field"><span class="field-label">Categoría</span><select id="filter"><option value="">Todas las categorías</option>${options(selected)}</select></div></div><div id="records" class="records"></div></div>`;
  enhanceSelects(main);
  const list = document.querySelector('#records');
  function render() { const text = document.querySelector('#search').value.trim().toLocaleLowerCase('es'); const category = document.querySelector('#filter').value; const filtered = records.filter((record) => (!category || record.categoria === category) && (!text || `${record.titulo} ${record.texto}`.toLocaleLowerCase('es').includes(text))); list.innerHTML = filtered.length ? filtered.map(recordMarkup).join('') : empty(records.length ? 'No encontramos recuerdos.' : 'Todo empieza con un recuerdo.', records.length ? 'Probá con otra búsqueda o categoría.' : 'Guardá tu primera experiencia y volvé a ella cuando quieras.', '#/nueva', 'CREAR RESEÑA'); }
  document.querySelector('#search').addEventListener('input', render); document.querySelector('#filter').addEventListener('change', render);
  list.addEventListener('click', async (event) => {
    const share = event.target.closest('[data-share]');
    const remove = event.target.closest('[data-delete]');
    if (share) {
      const record = records.find(item => item._id === share.dataset.share);
      if (!record) return;
      share.disabled = true;
      try {
        const visibilidad = record.visibilidad === 'circulo' ? 'privada' : 'circulo';
        const updated = await api(`/resenas/${encodeURIComponent(record._id)}`, { method:'PATCH', body:{ visibilidad } });
        Object.assign(record, updated); render();
        announcer.textContent = visibilidad === 'circulo' ? 'Reseña compartida con tu círculo.' : 'Reseña privada.';
      } catch (error) { alert(error.message); share.disabled = false; }
    } else if (remove && confirm('¿Querés eliminar esta reseña? Esta acción no se puede deshacer.')) {
      remove.disabled = true;
      try { await api(`/resenas/${encodeURIComponent(remove.dataset.delete)}`, { method:'DELETE' }); records.splice(records.findIndex(record => record._id === remove.dataset.delete), 1); render(); announcer.textContent = 'Reseña eliminada.'; }
      catch (error) { alert(error.message); remove.disabled = false; }
    }
  });
  render();
}
// Cerrar al tocar fuera, sin depender del foco que cambia al redibujar los meses.
document.addEventListener('pointerdown', (event) => {
  const field = document.querySelector('.date-field');
  if (!field || field.contains(event.target)) return;
  const panel = field.querySelector('.date-calendar');
  panel.hidden = true;
  field.querySelector('.date-trigger').setAttribute('aria-expanded', 'false');
});
function setupDatePicker(form) {
  const field = form.querySelector('.date-field');
  const input = form.elements.fechaExperiencia;
  const trigger = field.querySelector('.date-trigger');
  const value = field.querySelector('#date-value');
  const panel = field.querySelector('.date-calendar');
  const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const initial = input.value ? new Date(`${input.value}T12:00:00`) : new Date();
  let year = initial.getFullYear(), month = initial.getMonth();
  const iso = (y, m, d) => `${String(y).padStart(4, '0')}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const display = () => {
    if (!input.value) { value.textContent = 'Elegí una fecha'; trigger.classList.add('is-empty'); return; }
    const [y, m, d] = input.value.split('-').map(Number);
    value.textContent = `${d} de ${months[m - 1]} de ${y}`;
    trigger.classList.remove('is-empty');
  };
  const render = () => {
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    const days = new Date(year, month + 1, 0).getDate();
    const yearMin = Math.min(1900, year), yearMax = Math.max(new Date().getFullYear() + 10, year);
    const monthOptions = months.map((name, i) => `<option value="${i}" ${i === month ? 'selected' : ''}>${name}</option>`).join('');
    const yearOptions = Array.from({ length:yearMax - yearMin + 1 }, (_, i) => yearMax - i).map(y => `<option value="${y}" ${y === year ? 'selected' : ''}>${y}</option>`).join('');
    const blanks = '<span aria-hidden="true"></span>'.repeat(offset);
    const buttons = Array.from({ length:days }, (_, i) => {
      const date = iso(year, month, i + 1), selected = date === input.value;
      return `<button type="button" class="date-day${selected ? ' is-selected' : ''}" data-date="${date}" aria-label="${i + 1} de ${months[month]} de ${year}${selected ? ', fecha seleccionada' : ''}" ${selected ? 'aria-current="date"' : ''}>${i + 1}</button>`;
    }).join('');
    panel.innerHTML = `<div class="date-calendar-top"><span class="mono">ELEGÍ UN DÍA</span><button class="date-close" type="button" data-date-action="close" aria-label="Cerrar calendario">×</button></div><div class="date-calendar-nav"><button type="button" data-date-action="prev" aria-label="Mes anterior">←</button><div class="date-selects"><select data-date-month aria-label="Mes">${monthOptions}</select><select data-date-year aria-label="Año">${yearOptions}</select></div><button type="button" data-date-action="next" aria-label="Mes siguiente">→</button></div><div class="date-grid date-weekdays" aria-hidden="true"><span>LU</span><span>MA</span><span>MI</span><span>JU</span><span>VI</span><span>SÁ</span><span>DO</span></div><div class="date-grid">${blanks}${buttons}</div><div class="date-calendar-bottom"><button type="button" data-date-action="clear">QUITAR FECHA</button><button type="button" data-date-action="today">HOY</button></div>`;
    enhanceSelects(panel);
  };
  const close = (restoreFocus = false) => { panel.hidden = true; trigger.setAttribute('aria-expanded', 'false'); if (restoreFocus) trigger.focus(); };
  trigger.addEventListener('click', () => {
    if (!panel.hidden) { close(); return; }
    render(); panel.hidden = false; trigger.setAttribute('aria-expanded', 'true');
  });
  panel.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.date) { input.value = button.dataset.date; display(); close(true); return; }
    const action = button.dataset.dateAction;
    if (action === 'close') { close(true); return; }
    if (action === 'clear') { input.value = ''; display(); close(true); return; }
    if (action === 'today') { const today = new Date(); input.value = iso(today.getFullYear(), today.getMonth(), today.getDate()); display(); close(true); return; }
    if (action === 'prev' || action === 'next') { const next = new Date(year, month + (action === 'prev' ? -1 : 1), 1); year = next.getFullYear(); month = next.getMonth(); render(); panel.querySelector(`[data-date-action="${action}"]`).focus(); }
  });
  panel.addEventListener('change', event => {
    if (event.target.matches('[data-date-month]')) month = Number(event.target.value);
    else if (event.target.matches('[data-date-year]')) year = Number(event.target.value);
    else return;
    const selector = event.target.matches('[data-date-month]') ? '[data-date-month]' : '[data-date-year]';
    render(); panel.querySelector(selector)?.parentElement.querySelector('.custom-select-trigger')?.focus();
  });
  field.addEventListener('keydown', event => { if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); close(true); } });
  display();
}
async function reviewForm(id) {
  const record = id ? await api(`/resenas/${encodeURIComponent(id)}`) : null;
  main.innerHTML = `<div class="page form-layout"><div class="intro"><p class="eyebrow">TU ARCHIVO PERSONAL</p><h1>${record ? 'Editar recuerdo.' : 'Dejá constancia.'}</h1><p>Una película, un lugar, una canción. Guardá lo que te hizo sentir.</p><p>Las reseñas nuevas empiezan siendo privadas. Podés compartirlas con tu círculo cuando quieras.</p></div><form class="form" id="review-form"><label class="field"><span class="field-label">Título</span><input name="titulo" required value="${label(record?.titulo || '')}" placeholder="¿Qué querés recordar?"></label><div class="field"><span class="field-label">Categoría</span><select name="categoria" required><option value="">Elegí una categoría</option>${options(record?.categoria)}</select></div><fieldset class="field rating-field"><legend class="field-label">Puntuación / 1 a 10</legend><div class="rating-options">${Array.from({ length:10 }, (_, i) => `<div class="rating-option"><span class="rating-icon" aria-hidden="true"></span><span class="rating-fill" aria-hidden="true"></span>${(i === 0 ? [1] : [i + .5, i + 1]).map((number, part) => `<label class="rating-hit ${i === 0 ? 'is-whole' : part === 0 ? 'is-first-half' : 'is-second-half'}"><input type="radio" name="puntuacion" value="${number}" ${number === 1 ? 'required' : ''} ${record?.puntuacion === number ? 'checked' : ''} aria-label="${number} de 10"><span class="sr-only">${number} de 10</span></label>`).join('')}</div>`).join('')}</div><span class="rating-caption" aria-live="polite"></span></fieldset><div class="field date-field"><span class="field-label" id="date-label">Fecha de la experiencia / opcional</span><input name="fechaExperiencia" type="hidden" value="${label(record?.fechaExperiencia?.slice(0, 10) || '')}"><button class="date-trigger" type="button" aria-labelledby="date-label date-value" aria-expanded="false" aria-controls="date-calendar"><span id="date-value">Elegí una fecha</span><span aria-hidden="true">↗</span></button><div class="date-calendar" id="date-calendar" hidden></div></div><label class="field"><span class="field-label">Tu reseña</span><textarea name="texto" required placeholder="¿Qué te pareció?">${label(record?.texto || '')}</textarea></label><div class="field photos-field"><label class="field-label" for="photos">Fotos / hasta 5</label><p class="helper">Sumá imágenes a este recuerdo. JPG, PNG o WebP.</p><input id="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple><div class="photo-editor" aria-live="polite"></div></div>${record ? `<div class="field"><span class="field-label">Visibilidad</span><select name="visibilidad"><option value="privada" ${record.visibilidad === 'privada' ? 'selected' : ''}>Solo yo</option><option value="circulo" ${record.visibilidad === 'circulo' ? 'selected' : ''}>Mi círculo</option></select></div>` : ''}<div id="form-message" aria-live="polite"></div><div class="form-actions"><button class="button" type="submit">${record ? 'GUARDAR CAMBIOS' : 'GUARDAR RESEÑA'} ${arrow}</button><a class="button secondary" href="#/archivo">CANCELAR</a></div></form></div>`;
  const reviewForm = document.querySelector('#review-form');
  enhanceSelects(reviewForm);
  setupDatePicker(reviewForm);
  let photos = [...(record?.fotos || [])];
  const photoInput = reviewForm.querySelector('#photos');
  const photoEditor = reviewForm.querySelector('.photo-editor');
  const submitButton = reviewForm.querySelector('button[type="submit"]');
  const renderPhotos = () => {
    photoEditor.innerHTML = photos.map((photo, index) => `<div class="photo-item"><img src="${label(photo)}" alt="Foto ${index + 1} seleccionada"><button type="button" data-remove-photo="${index}" aria-label="Quitar foto ${index + 1}">×</button></div>`).join('');
    photoInput.disabled = photos.length >= 5;
  };
  photoEditor.addEventListener('click', event => {
    const button = event.target.closest('[data-remove-photo]');
    if (!button) return;
    photos.splice(Number(button.dataset.removePhoto), 1);
    renderPhotos();
  });
  photoInput.addEventListener('change', async () => {
    const files = [...photoInput.files];
    photoInput.value = '';
    if (photos.length + files.length > 5) { showError('Podés agregar hasta 5 fotos por reseña.'); return; }
    submitButton.disabled = true;
    photoInput.disabled = true;
    try {
      const prepared = await Promise.all(files.map(preparePhoto));
      photos.push(...prepared);
      const message = reviewForm.querySelector('#form-message');
      message.className = '';
      message.textContent = '';
      renderPhotos();
    } catch (error) { showError(error.message || 'No pudimos leer una de las fotos.'); }
    finally { submitButton.disabled = false; photoInput.disabled = photos.length >= 5; }
  });
  renderPhotos();
  const rating = reviewForm.querySelector('.rating-field');
  const ratingOptions = [...rating.querySelectorAll('.rating-option')];
  const ratingCaption = rating.querySelector('.rating-caption');
  const updateRating = (preview = 0) => {
    const category = categoryById(reviewForm.elements.categoria.value);
    const selected = Number(reviewForm.elements.puntuacion.value) || 0;
    const shown = preview || selected;
    ratingOptions.forEach((option, index) => {
      const icon = categoryIcon(category);
      option.querySelector('.rating-icon').innerHTML = icon;
      option.querySelector('.rating-fill').innerHTML = icon;
      const amount = Math.max(0, Math.min(1, shown - index));
      option.querySelector('.rating-fill').style.clipPath = `inset(0 ${100 - amount * 100}% 0 0)`;
      option.querySelectorAll('input').forEach(input => input.setAttribute('aria-label', `${input.value} de 10 ${category?.unidad || 'puntos'}`));
    });
    ratingCaption.textContent = shown ? `${String(shown).replace('.', ',')} / 10 ${category?.unidad || 'puntos'}` : category ? 'Elegí una puntuación; podés usar medios puntos.' : 'Elegí una categoría para ver su ícono.';
  };
  rating.addEventListener('change', () => updateRating());
  rating.querySelectorAll('.rating-hit').forEach(hit => hit.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') updateRating(Number(hit.querySelector('input').value)); }));
  rating.addEventListener('pointerleave', () => updateRating());
  reviewForm.elements.categoria.addEventListener('change', () => updateRating());
  updateRating();
  document.querySelector('#review-form').addEventListener('submit', async (event) => { event.preventDefault(); const form = event.currentTarget; const button = form.querySelector('button[type=submit]'); const data = Object.fromEntries(new FormData(form)); data.puntuacion = Number(data.puntuacion); data.fotos = photos; button.disabled = true; try { await api(record ? `/resenas/${encodeURIComponent(id)}` : '/resenas', { method:record ? 'PATCH' : 'POST', body:data }); announcer.textContent = 'Reseña guardada.'; location.hash = '#/archivo'; } catch (error) { showError(error.message); } finally { button.disabled = false; } });
}
async function circle() {
  const invitations = await api('/invitaciones');
  if (!state.user) state.user = await api('/usuarios/yo');
  const incoming = item => item.destinatario?._id === state.user.id;
  const personFor = item => incoming(item) ? item.remitente : item.destinatario;
  const personRow = item => {
    const person = personFor(item);
    const accepted = item.estado === 'aceptada';
    const description = accepted ? 'Conexión aceptada' : incoming(item) ? 'Te invitó a su círculo' : 'Esperando respuesta';
    return `<div class="person"><div><strong>${label(person?.nombre || 'Cuenta')}</strong><p class="helper">${description}</p></div><div class="record-actions">${accepted ? `<a class="plain-button" href="#/circulo/${encodeURIComponent(person?._id)}">Ver reseñas</a>` : incoming(item) ? `<button class="plain-button" data-accept="${label(item._id)}">Aceptar</button>` : ''}<button class="plain-button" data-remove="${label(item._id)}">${accepted ? 'Quitar' : incoming(item) ? 'Rechazar' : 'Cancelar'}</button></div></div>`;
  };
  const connected = invitations.filter(item => item.estado === 'aceptada');
  const pending = invitations.filter(item => item.estado === 'pendiente');
  main.innerHTML = `<div class="page circle-page"><div class="page-heading"><div><p class="eyebrow">COMPARTIR CON INTENCIÓN</p><h1>Mi círculo.</h1></div><p>Un espacio para compartir con las personas que elegís. Solo tus conexiones aceptadas ven tus reseñas compartidas.</p></div><div class="form-layout"><div class="circle-sections"><section><p class="eyebrow">PERSONAS DE MI CÍRCULO</p><div class="people">${connected.length ? connected.map(personRow).join('') : '<p class="helper circle-empty">Todavía no hay nadie en tu círculo. Invitá a alguien para empezar a compartir.</p>'}</div></section><section><p class="eyebrow">INVITACIONES</p><div class="people">${pending.length ? pending.map(personRow).join('') : '<p class="helper circle-empty">No tenés invitaciones pendientes.</p>'}</div></section></div><form class="form" id="invite-form"><div><p class="eyebrow">INVITAR A ALGUIEN</p><p class="helper circle-invite-copy">Ingresá el correo con el que esa persona creó su cuenta en Postcredit. Cuando acepte, podrán ver sus reseñas compartidas.</p></div><label class="field"><span class="field-label">Correo de su cuenta</span><input type="email" name="email" required placeholder="su@email.com"></label><div id="form-message" aria-live="polite"></div><button type="submit" class="button">ENVIAR INVITACIÓN ${arrow}</button></form></div></div>`;
  document.querySelector('#invite-form').addEventListener('submit', async event => { event.preventDefault(); const button = event.currentTarget.querySelector('button'); button.disabled = true; try { await api('/invitaciones', { method:'POST', body:Object.fromEntries(new FormData(event.currentTarget)) }); await circle(); announcer.textContent = 'Invitación enviada.'; } catch (error) { showError(error.message); button.disabled = false; } });
  document.querySelector('.circle-sections').addEventListener('click', async event => { const accept = event.target.closest('[data-accept]'); const remove = event.target.closest('[data-remove]'); const button = accept || remove; if (!button) return; if (remove && !confirm('¿Querés quitar esta invitación o conexión?')) return; button.disabled = true; try { if (accept) await api(`/invitaciones/${encodeURIComponent(accept.dataset.accept)}/aceptar`, { method:'PATCH' }); else await api(`/invitaciones/${encodeURIComponent(remove.dataset.remove)}`, { method:'DELETE' }); await circle(); announcer.textContent = accept ? 'Invitación aceptada.' : 'Conexión o invitación eliminada.'; } catch (error) { alert(error.message); button.disabled = false; } });
}
async function friendArchive(id) { const records = await api(`/resenas/circulo/${encodeURIComponent(id)}`); main.innerHTML = `<div class="page"><div class="page-heading"><div><p class="eyebrow">MI CÍRCULO / RESEÑAS COMPARTIDAS</p><h1>Otros recuerdos.</h1></div><a class="text-link mono" href="#/circulo">VOLVER AL CÍRCULO ${arrow}</a></div><div class="records">${records.length ? records.map((record) => `<article class="record"><div><span class="tag muted">${label(categoryById(record.categoria)?.nombre || record.categoria)}</span><h2>${label(record.titulo)}</h2>${experienceDate(record)}<p>${label(record.texto)}</p>${photoGallery(record)}</div><div class="record-meta mono">${score(record)}</div></article>`).join('') : '<div class="empty"><h2>Todavía no hay reseñas compartidas.</h2></div>'}</div></div>`; }
async function route() {
  cleanupHeroScroll();
  cleanupHeroScroll = () => {};
  // Recuperar el encabezado antes de reemplazar el contenido de la ruta.
  document.body.insertBefore(header, main);
  closeMenu(); const raw = location.hash.slice(1) || '/'; const [path, query = ''] = raw.split('?'); innerPage = path !== '/'; header.classList.toggle('is-light', innerPage); setEdgeColor(innerPage); updateHeader();
  main.innerHTML = '<div class="page"><p class="eyebrow">CARGANDO / UN MOMENTO</p></div>';
  try {
    if (!state.categories.length) state.categories = await api('/categorias');
    if (path === '/') landing();
    else if (path === '/ingresar' || path === '/registro') auth(path === '/registro');
    else if (!state.token) { main.innerHTML = `<div class="page">${empty('Tu archivo te espera.', 'Ingresá o creá una cuenta para guardar y compartir tus recuerdos.', '#/ingresar', 'INGRESAR')}</div>`; }
    else if (path === '/archivo') await archive(query);
    else if (path === '/nueva') await reviewForm();
    else if (path.startsWith('/editar/')) await reviewForm(path.slice('/editar/'.length));
    else if (path === '/circulo') await circle();
    else if (path.startsWith('/circulo/')) await friendArchive(path.slice('/circulo/'.length));
    else main.innerHTML = `<div class="page">${empty('Esta página no existe.', 'Volvamos al principio.', '#/', 'VOLVER AL INICIO')}</div>`;
    observeReveals(); window.scrollTo(0, 0);
  } catch (error) { main.innerHTML = `<div class="page">${empty('No pudimos cargar esta página.', label(error.message), '#/', 'VOLVER AL INICIO')}</div>`; }
}
window.addEventListener('hashchange', route);
route();
