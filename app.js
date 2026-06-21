'use strict';

/* ── Palettes ────────────────────────────────────────────── */

const PALETTES = [
  { name: 'Vivid',     colors: ['#6c63ff','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#8b5cf6','#14b8a6','#f97316','#06b6d4','#84cc16','#e879f9'] },
  { name: 'Pastel',    colors: ['#9b87d6','#d97ab8','#c98a45','#5da88b','#6a8ec9','#c47070','#9078c8','#4ea0a8','#c97c40','#4e9bbb','#8ea84b','#c078b8'] },
  { name: 'Neon',      colors: ['#ff2d78','#ff6d00','#c6ff00','#00e676','#2979ff','#d500f9','#ff1744','#00e5ff','#ff9100','#76ff03','#f50057','#00b0ff'] },
  { name: 'Ocean',     colors: ['#0ea5e9','#06b6d4','#22d3ee','#38bdf8','#2563eb','#3b82f6','#60a5fa','#93c5fd','#0891b2','#0284c7','#6366f1','#818cf8'] },
  { name: 'Sunset',    colors: ['#f97316','#ef4444','#ec4899','#f59e0b','#fb923c','#e11d48','#db2777','#fbbf24','#f43f5e','#ff7043','#dc2626','#f472b6'] },
  { name: 'Forest',    colors: ['#16a34a','#15803d','#166534','#22c55e','#4ade80','#65a30d','#84cc16','#4d7c0f','#2d9e5f','#1a7a42','#3f9142','#86efac'] },
  { name: 'Galaxy',    colors: ['#6d28d9','#7c3aed','#8b5cf6','#a78bfa','#4f46e5','#6366f1','#db2777','#9333ea','#c084fc','#e879f9','#38bdf8','#2563eb'] },
  { name: 'Earthy',    colors: ['#b45309','#92400e','#d97706','#ca8a04','#a16207','#854d0e','#78350f','#7c2d12','#9a3412','#b07040','#8d6e4a','#78716c'] },
  { name: 'Candy',     colors: ['#ff6eb4','#ff9ff3','#ffa502','#ff6348','#eccc68','#7bed9f','#70a1ff','#a29bfe','#fd79a8','#fdcb6e','#55efc4','#74b9ff'] },
  { name: 'Mono Blue', colors: ['#1e3a5f','#1d4ed8','#2563eb','#3b82f6','#60a5fa','#93c5fd','#1e40af','#1d4ed8','#2563eb','#3b82f6','#1e3a8a','#172554'] },
];

let activePaletteIdx = 0;
let pidx = 0;

function currentPalette() { return PALETTES[activePaletteIdx].colors; }
const nextColor = () => {
  const c = currentPalette();
  return c[pidx++ % c.length];
};

/* ── Palette UI ─────────────────────────────────────────── */

function buildPaletteMenu() {
  const menu = document.getElementById('palette-menu');
  menu.innerHTML = '';
  PALETTES.forEach((pal, i) => {
    const row = mk('div', 'pal-option');
    if (i === activePaletteIdx) row.classList.add('active');

    const nameEl = mk('span', 'pal-name', pal.name);
    const swatches = mk('div', 'pal-swatches');
    pal.colors.slice(0, 10).forEach(c => {
      const s = mk('span', 'pal-swatch');
      s.style.background = c;
      swatches.appendChild(s);
    });

    row.appendChild(nameEl);
    row.appendChild(swatches);
    row.addEventListener('click', () => selectPalette(i));
    menu.appendChild(row);
  });

  // ── Recolor-all action ──
  menu.appendChild(mk('div', 'pal-divider'));
  const recolorBtn = mk('button', 'pal-action-btn', '🎨 Recolor all courses');
  recolorBtn.title = 'Apply the current palette to every existing course';
  recolorBtn.addEventListener('click', e => { e.stopPropagation(); recolorAllCourses(); });
  menu.appendChild(recolorBtn);

  // ── Background section ──
  menu.appendChild(mk('div', 'pal-divider'));
  menu.appendChild(mk('div', 'pal-section-label', 'Background'));
  const bgRow = mk('div', 'bg-swatches');
  BG_PRESETS.forEach((bg, i) => {
    const sw = mk('div', 'bg-swatch');
    sw.style.background = bg.bg;
    if (bg.bg.toLowerCase() === currentBg.toLowerCase()) sw.classList.add('active');
    sw.title = bg.name;
    sw.addEventListener('click', e => { e.stopPropagation(); setBackground(bg.bg, bg.dot); });
    bgRow.appendChild(sw);
  });
  // Custom color picker
  const custom = mk('input', 'bg-custom');
  custom.type = 'color';
  custom.value = /^#[0-9a-f]{6}$/i.test(currentBg) ? currentBg : '#0d0f1a';
  custom.title = 'Custom background color';
  custom.addEventListener('input', e => setBackground(e.target.value, autoDot(e.target.value)));
  custom.addEventListener('click', e => e.stopPropagation());
  bgRow.appendChild(custom);
  menu.appendChild(bgRow);

  // ── Year-card theme section ──
  menu.appendChild(mk('div', 'pal-divider'));
  menu.appendChild(mk('div', 'pal-section-label', 'Year card theme'));
  const ytRow = mk('div', 'bg-swatches');
  YEAR_THEMES.forEach((t, i) => {
    const sw = mk('div', 'bg-swatch');
    // Two-tone swatch: card colour with a semester-colour inset
    sw.style.background = t.bg;
    sw.style.boxShadow = `inset 0 -9px 0 ${t.sem}`;
    if (i === activeYearThemeIdx) sw.classList.add('active');
    sw.title = t.name;
    sw.addEventListener('click', e => { e.stopPropagation(); setYearTheme(i); });
    ytRow.appendChild(sw);
  });
  menu.appendChild(ytRow);
}

function selectPalette(i) {
  activePaletteIdx = i;
  pidx = 0;
  updatePaletteButton();
  buildPaletteMenu();
  // Menu stays open so you can immediately "Recolor all" or tweak the background.
}

/* Recolor every existing course/bubble using the active palette */
function recolorAllCourses() {
  const pal = currentPalette();
  let i = 0;
  document.querySelectorAll('.course-card, .bubble').forEach(el => {
    const color = pal[i++ % pal.length];
    el.style.background = color;
    el.dataset.color = color;
  });
}

/* ── Background ──────────────────────────────────────────── */

const BG_PRESETS = [
  { name: 'Midnight',  bg: '#0d0f1a', dot: '#252945' },
  { name: 'Charcoal',  bg: '#16181d', dot: '#2e323c' },
  { name: 'Slate',     bg: '#1a2230', dot: '#33415c' },
  { name: 'Deep Plum', bg: '#1a1320', dot: '#3a2b45' },
  { name: 'Forest',    bg: '#0f1a15', dot: '#23402f' },
  { name: 'Navy',      bg: '#0a1530', dot: '#1e3a6b' },
  { name: 'Paper',     bg: '#f4f1ea', dot: '#d2cdbf' },
  { name: 'Mist',      bg: '#e6ecf2', dot: '#c3ccd6' },
];

let currentBg = '#0d0f1a';

function setBackground(bg, dot) {
  currentBg = bg;
  document.documentElement.style.setProperty('--bg',  bg);
  document.documentElement.style.setProperty('--dot', dot || autoDot(bg));
  // Update the active swatch ring without rebuilding the whole menu
  document.querySelectorAll('.bg-swatch').forEach(sw => {
    sw.classList.toggle('active', sw.style.background && rgbToHex(sw.style.background) === bg.toLowerCase());
  });
}

/* Derive a subtle dot color from a background color */
function autoDot(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return '#252945';
  let r = parseInt(m[1].slice(0,2),16), g = parseInt(m[1].slice(2,4),16), b = parseInt(m[1].slice(4,6),16);
  const light = (r*0.299 + g*0.587 + b*0.114) > 140;
  const shift = light ? -38 : 30;            // darken on light bg, lighten on dark bg
  const cl = v => Math.max(0, Math.min(255, v + shift));
  return '#' + [cl(r),cl(g),cl(b)].map(v => v.toString(16).padStart(2,'0')).join('');
}

function rgbToHex(rgb) {
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/i.exec(rgb);
  if (!m) return rgb.toLowerCase();
  return '#' + [m[1],m[2],m[3]].map(v => (+v).toString(16).padStart(2,'0')).join('');
}

/* ── Year-card theme ─────────────────────────────────────────
   Changes the look of the year tables (card bg, border, semester bg). */
const YEAR_THEMES = [
  { name: 'Indigo (default)', bg: '#161929', border: '#2a2f4a', sem: '#1e2235' },
  { name: 'Graphite',         bg: '#1c1d22', border: '#34363f', sem: '#26272e' },
  { name: 'Slate Blue',       bg: '#162032', border: '#2c3a54', sem: '#1d2a40' },
  { name: 'Teal',             bg: '#0f2222', border: '#1f4040', sem: '#16302e' },
  { name: 'Plum',             bg: '#231326', border: '#3e2746', sem: '#2e1a33' },
  { name: 'Crimson',          bg: '#241318', border: '#48232e', sem: '#321a22' },
  { name: 'Olive',            bg: '#1d2113', border: '#3a4023', sem: '#272c18' },
  { name: 'Snow',             bg: '#f5f6fa', border: '#d3d8e4', sem: '#e9ecf4', text: '#1e2230' },
];

let activeYearThemeIdx = 0;

function setYearTheme(i) {
  activeYearThemeIdx = i;
  const t = YEAR_THEMES[i];
  const root = document.documentElement.style;
  root.setProperty('--year-bg',     t.bg);
  root.setProperty('--year-border', t.border);
  root.setProperty('--sem-bg',      t.sem);
  // Light themes need dark text inside the cards
  root.setProperty('--year-text', t.text || '');
  buildPaletteMenu(); // refresh the active-swatch ring
}

function updatePaletteButton() {
  const pal = PALETTES[activePaletteIdx];
  document.getElementById('active-pal-name').textContent = pal.name;
  const dotsEl = document.getElementById('active-pal-dots');
  dotsEl.innerHTML = '';
  pal.colors.slice(0, 5).forEach(c => {
    const d = mk('span', 'pal-dot');
    d.style.background = c;
    dotsEl.appendChild(d);
  });
}

function togglePaletteMenu(e) {
  e.stopPropagation();
  const menu = document.getElementById('palette-menu');
  menu.classList.toggle('open');
}

document.addEventListener('click', () => {
  document.getElementById('palette-menu').classList.remove('open');
});

/* ── Starter data ────────────────────────────────────────── */

const STARTERS = [
  {
    label: 'Year 1',
    s1: ['MATH 117 – Calculus 1 for Engineering','MATH 115 – Linear Algebra for Engineering','CHEM 120 – General Chemistry 1','PHYS 111 – Physics 1','CS 137 – Programming Principles','ENGL 119 – Communications in Math & CS'],
    s2: ['MATH 119 – Calculus 2 for Engineering','CHEM 123 – General Chemistry 2','PHYS 112 – Physics 2','CS 138 – Data Abstraction & Implementation','ECE 140 – Linear Circuits','SPCOM 100 – Interpersonal Communication'],
  },
  {
    label: 'Year 2',
    s1: ['Linear Algebra','Statistics','Organic Chemistry','Algorithms','Thermodynamics','Philosophy'],
    s2: ['Diff. Equations','Probability','Biochemistry','Operating Systems','Electromagnetism','Psychology'],
  },
  {
    label: 'Year 3',
    s1: ['Numerical Methods','Machine Learning','Cell Biology','Computer Networks','Quantum Mechanics','Ethics'],
    s2: ['Optimization','Deep Learning','Genetics','Distributed Systems','Statistical Mech.','Sociology'],
  },
  {
    label: 'Year 4',
    s1: ['Research Methods','NLP','Neuroscience','Systems Programming','Solid State Physics','Game Theory'],
    s2: ['Capstone Project','Computer Vision','Genomics','Compilers','Fluid Dynamics','Finance'],
  },
];

let yearCount = 0;

/* ── Init ────────────────────────────────────────────────── */

function init() {
  // Keep clicks inside the palette menu from closing it (palette/recolor/bg controls)
  document.getElementById('palette-menu').addEventListener('click', e => e.stopPropagation());
  updatePaletteButton();
  buildPaletteMenu();
  STARTERS.forEach(d => buildYear(d));
}

/* ── Year table ──────────────────────────────────────────── */

function addYear() {
  yearCount++;
  buildYear({ label: 'Year ' + yearCount, s1: [], s2: [] });
}

function buildYear(data) {
  const match = data.label.match(/\d+/);
  if (match) yearCount = Math.max(yearCount, parseInt(match[0]));
  const yn = match ? match[0] : yearCount;

  const table = mk('div', 'year-table');

  // Initial position: 2-column grid layout
  if (data.x != null && data.y != null) {
    table.style.left = data.x + 'px';
    table.style.top  = data.y + 'px';
  } else {
    const col = (yearCount - 1) % 2;
    const row = Math.floor((yearCount - 1) / 2);
    table.style.left = (52 + col * 596) + 'px';
    table.style.top  = (52 + row * 520) + 'px';
  }

  // Restore saved size (width fixed, height as min so content can still auto-grow)
  if (data.w != null) table.style.width = data.w + 'px';
  if (data.h != null) table.style.minHeight = data.h + 'px';

  // Header with grip + editable title + badge
  const head = mk('div', 'table-head');

  const grip = mk('div', 'table-head-grip');
  grip.appendChild(mk('span')); grip.appendChild(mk('span')); grip.appendChild(mk('span'));

  const titleEl = mk('span', 'table-title', data.label);
  titleEl.title = 'Click to rename';
  titleEl.addEventListener('click', e => { e.stopPropagation(); startEdit(titleEl); });

  const badge = mk('span', 'year-badge', 'Y' + yn);

  head.appendChild(grip);
  head.appendChild(titleEl);
  head.appendChild(badge);

  // Drag the whole table from the header
  head.addEventListener('pointerdown', e => {
    if (e.target === titleEl || e.target.closest('.rename-input')) return;
    startTableDrag(e, table);
  });

  table.appendChild(head);

  const semsEl = mk('div', 'semesters');
  semsEl.appendChild(buildSemester(1, data.s1 || []));
  semsEl.appendChild(buildSemester(2, data.s2 || []));
  table.appendChild(semsEl);

  // Resize handle
  const resize = mk('div', 'table-resize');
  resize.addEventListener('pointerdown', e => startTableResize(e, table));
  table.appendChild(resize);

  document.getElementById('canvas').appendChild(table);
}

/* ── Simple inline text editor (for titles) ─────────────── */

function startEdit(el) {
  if (el.querySelector('input')) return;
  const orig = el.textContent;
  const inp  = mk('input', 'rename-input');
  inp.type  = 'text';
  inp.value = orig;
  inp.style.width = Math.max(80, orig.length * 10) + 'px';
  el.textContent = '';
  el.appendChild(inp);
  inp.focus();
  inp.select();

  const done = () => { el.textContent = inp.value.trim() || orig; };
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === 'Escape') { if (e.key === 'Escape') inp.value = orig; done(); }
    e.stopPropagation();
  });
  inp.addEventListener('blur', done);
  inp.addEventListener('pointerdown', e => e.stopPropagation());
}

/* ── Table drag ──────────────────────────────────────────── */

let tableD = null;

function startTableDrag(e, tableEl) {
  if (e.button !== 0) return;
  e.preventDefault();
  e.stopPropagation();

  const rect = tableEl.getBoundingClientRect();
  tableD = {
    tableEl,
    ox: e.clientX - rect.left,
    oy: e.clientY - rect.top,
  };
  tableEl.classList.add('dragging-table');
  document.body.style.cursor = 'grabbing';
}

/* ── Table resize ────────────────────────────────────────── */

let tableR = null;

function startTableResize(e, tableEl) {
  if (e.button !== 0) return;
  e.preventDefault();
  e.stopPropagation();
  const rect = tableEl.getBoundingClientRect();
  tableR = {
    tableEl,
    startX: e.clientX,
    startY: e.clientY,
    startW: rect.width,
    startH: rect.height,
  };
  tableEl.classList.add('resizing-table');
  document.body.style.cursor = 'nwse-resize';
}

/* ── Semester ────────────────────────────────────────────── */

function buildSemester(n, courses) {
  const sem = mk('div', 'semester');

  // Header: title (left) + running credit total (top-right)
  const head = mk('div', 'sem-head');
  head.appendChild(mk('div', 'sem-title', 'Semester ' + n));
  const total = mk('span', 'sem-total', '0 cr');
  head.appendChild(total);
  sem.appendChild(head);

  const list = mk('div', 'course-list');
  courses.forEach(c => {
    const name  = typeof c === 'string' ? c : c.name;
    const color = typeof c === 'string' ? nextColor() : (c.color || nextColor());
    list.appendChild(buildCard(name, color));
  });
  sem.appendChild(list);

  const addRow = mk('div', 'add-row');
  const addBtn = mk('button', 'add-btn', '+ Add Course');
  addBtn.addEventListener('click', () => showAddInput(sem, addBtn));
  addRow.appendChild(addBtn);
  sem.appendChild(addRow);

  // Recompute the total whenever cards are added/removed/moved
  updateSemesterTotal(sem);
  new MutationObserver(() => updateSemesterTotal(sem))
    .observe(list, { childList: true });

  return sem;
}

/* Sum the credits of all course cards in a semester and update its badge */
function updateSemesterTotal(sem) {
  const cards = sem.querySelectorAll('.course-list > .course-card');
  let sum = 0;
  cards.forEach(c => { sum += parseFloat(c.dataset.credits) || 0; });
  const badge = sem.querySelector('.sem-total');
  if (badge) badge.textContent = fmtCredits(sum) + ' cr';
}

/* ── Course card ─────────────────────────────────────────── */

function buildCard(name, color) {
  const card = mk('div', 'course-card');
  card.style.background = color;
  card.dataset.name  = name;
  card.dataset.color = color;
  const credits = courseCredits(name);
  card.dataset.credits = credits;

  const nameEl   = mk('span', 'card-name', name);
  const creditEl = mk('span', 'card-credits', fmtCredits(credits));
  const recolor  = mk('button', 'card-recolor');
  const del      = mk('button', 'card-del', '×');

  del.addEventListener('click', e => { e.stopPropagation(); card.remove(); });
  recolor.addEventListener('click', e => { e.stopPropagation(); cycleColor(card); });
  onDoubleTap(nameEl, () => startRename(nameEl, card, creditEl));
  card.addEventListener('pointerdown', e => { if (e.target !== del && e.target !== recolor) startDrag(e, card, 'card'); });

  card.appendChild(nameEl);
  card.appendChild(creditEl);
  card.appendChild(recolor);
  card.appendChild(del);
  return card;
}

/* ── Floating bubble ─────────────────────────────────────── */

function buildBubble(name, color, x, y) {
  const bub = mk('div', 'bubble');
  bub.style.background = color;
  bub.style.left = x + 'px';
  bub.style.top  = y + 'px';
  bub.dataset.name  = name;
  bub.dataset.color = color;

  const credits = courseCredits(name);
  bub.dataset.credits = credits;

  const nameEl  = mk('span', 'card-name', name);
  const creditEl = mk('span', 'card-credits', fmtCredits(credits));
  const recolor = mk('button', 'card-recolor');
  const del     = mk('button', 'card-del', '×');

  del.addEventListener('click', e => { e.stopPropagation(); bub.remove(); });
  recolor.addEventListener('click', e => { e.stopPropagation(); cycleColor(bub); });
  onDoubleTap(nameEl, () => startRename(nameEl, bub, creditEl));
  bub.addEventListener('pointerdown', e => { if (e.target !== del && e.target !== recolor) startDrag(e, bub, 'bubble'); });

  bub.appendChild(nameEl);
  bub.appendChild(creditEl);
  bub.appendChild(recolor);
  bub.appendChild(del);
  document.getElementById('canvas').appendChild(bub);
  return bub;
}

/* Double-tap / double-click detector that works for mouse, touch and pen */
function onDoubleTap(el, fn) {
  let last = 0;
  el.addEventListener('pointerup', e => {
    if (D) return; // a real drag is in progress — not a tap
    const now = Date.now();
    if (now - last < 320) { e.preventDefault(); e.stopPropagation(); fn(); last = 0; }
    else last = now;
  });
}

/* ── Cycle color ─────────────────────────────────────────── */

function cycleColor(el) {
  const pal = currentPalette();
  const cur = el.dataset.color;
  const idx = pal.indexOf(cur);
  const next = pal[(idx + 1) % pal.length];
  el.style.background = next;
  el.dataset.color = next;
}

/* ── Add course (inline) ─────────────────────────────────── */

function showAddInput(semEl, btn) {
  btn.style.display = 'none';
  const inp = mk('input', 'add-input');
  inp.type = 'text';
  inp.placeholder = 'Course name…';
  btn.parentElement.appendChild(inp);
  inp.focus();

  const done = (save) => {
    const v = inp.value.trim();
    if (save && v) semEl.querySelector('.course-list').appendChild(buildCard(v, nextColor()));
    inp.remove();
    btn.style.display = '';
  };
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { done(true);  e.stopPropagation(); }
    if (e.key === 'Escape') { done(false); e.stopPropagation(); }
    else e.stopPropagation();
  });
  inp.addEventListener('blur', () => done(false));
  inp.addEventListener('pointerdown', e => e.stopPropagation());
}

/* ── Rename ──────────────────────────────────────────────── */

function startRename(nameEl, courseEl, creditEl) {
  const orig = nameEl.textContent;
  const inp  = mk('input', 'rename-input');
  inp.type  = 'text';
  inp.value = orig;
  nameEl.textContent = '';
  nameEl.appendChild(inp);
  inp.focus();
  inp.select();

  const done = () => {
    const v = inp.value.trim() || orig;
    nameEl.textContent  = v;
    courseEl.dataset.name = v;
    // Recompute credits from the new name
    const cr = courseCredits(v);
    courseEl.dataset.credits = cr;
    if (creditEl) creditEl.textContent = fmtCredits(cr);
    // Refresh the semester total if this card lives in one
    const sem = courseEl.closest('.semester');
    if (sem) updateSemesterTotal(sem);
  };
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter')  done();
    if (e.key === 'Escape') { inp.value = orig; done(); }
    e.stopPropagation();
  });
  inp.addEventListener('blur', done);
  inp.addEventListener('pointerdown', e => e.stopPropagation());
}

/* ── Drag ────────────────────────────────────────────────── */

let D = null;
let pendingDrag = null; // waits for movement threshold before activating

function startDrag(e, sourceEl, kind) {
  if (e.button !== 0) return;
  e.preventDefault();
  e.stopPropagation();
  const rect = sourceEl.getBoundingClientRect();
  pendingDrag = {
    sourceEl, kind,
    ox: e.clientX - rect.left,
    oy: e.clientY - rect.top,
    startX: e.clientX, startY: e.clientY,
  };
}

function activateDrag(pd, curX, curY) {
  const { sourceEl, kind, ox, oy } = pd;

  const clone = sourceEl.cloneNode(true);
  clone.querySelector?.('.card-del')?.remove();
  clone.querySelector?.('.card-recolor')?.remove();
  if (kind === 'bubble') {
    clone.style.position = 'relative';
    clone.style.left     = 'unset';
    clone.style.top      = 'unset';
    clone.style.zIndex   = 'unset';
  }
  const ghost = document.getElementById('ghost');
  ghost.innerHTML = '';
  ghost.appendChild(clone);
  ghost.style.left = (curX - ox) + 'px';
  ghost.style.top  = (curY - oy) + 'px';

  sourceEl.classList.add('placeholder');
  document.body.style.cursor = 'grabbing';

  D = { sourceEl, kind, name: sourceEl.dataset.name, color: sourceEl.dataset.color, ox, oy, currentSem: null, insertIdx: -1 };
}

/* Activate a drag that originated from the search panel (no source element) */
function activateSearchDrag(pd, curX, curY) {
  const color = nextColor();
  const ghost = document.getElementById('ghost');
  const clone = mk('div', 'bubble');
  clone.style.cssText = `background:${color};position:relative;left:unset;top:unset;`;
  clone.appendChild(mk('span', 'card-name', pd.name));
  ghost.innerHTML = '';
  ghost.appendChild(clone);
  ghost.style.left = (curX - pd.ox) + 'px';
  ghost.style.top  = (curY - pd.oy) + 'px';
  document.body.style.cursor = 'grabbing';
  D = { sourceEl: null, kind: 'search', name: pd.name, color, ox: pd.ox, oy: pd.oy, currentSem: null, insertIdx: -1 };
}

document.addEventListener('pointermove', e => {
  // ── Table resize ──
  if (tableR) {
    const w = Math.max(340, tableR.startW + (e.clientX - tableR.startX));
    const h = Math.max(160, tableR.startH + (e.clientY - tableR.startY));
    tableR.tableEl.style.width     = w + 'px';
    tableR.tableEl.style.minHeight = h + 'px';
    return;
  }

  // ── Table drag ──
  if (tableD) {
    const canvas = document.getElementById('canvas');
    const cr = canvas.getBoundingClientRect();
    tableD.tableEl.style.left = Math.max(0, e.clientX - cr.left - tableD.ox) + 'px';
    tableD.tableEl.style.top  = Math.max(0, e.clientY - cr.top  - tableD.oy) + 'px';
    return;
  }

  // ── Pending drag threshold ──
  if (pendingDrag) {
    if (Math.hypot(e.clientX - pendingDrag.startX, e.clientY - pendingDrag.startY) > 5) {
      if (pendingDrag.kind === 'search') activateSearchDrag(pendingDrag, e.clientX, e.clientY);
      else activateDrag(pendingDrag, e.clientX, e.clientY);
      pendingDrag = null;
      // fall through so D gets its first position update
    } else {
      return;
    }
  }

  if (!D) return;

  const ghost = document.getElementById('ghost');
  ghost.style.left = (e.clientX - D.ox) + 'px';
  ghost.style.top  = (e.clientY - D.oy) + 'px';

  const sem = hitSemester(e.clientX, e.clientY);

  if (D.currentSem && D.currentSem !== sem) {
    D.currentSem.classList.remove('over');
    clearDropLines(D.currentSem);
  }

  D.currentSem = sem;

  if (sem) {
    sem.classList.add('over');
    D.insertIdx = computeInsertIdx(sem, e.clientY);
    showDropLine(sem, D.insertIdx);
  }
});

document.addEventListener('pointerup', e => {
  // ── Table resize ──
  if (tableR) {
    tableR.tableEl.classList.remove('resizing-table');
    document.body.style.cursor = '';
    tableR = null;
    return;
  }

  // ── Table drag ──
  if (tableD) {
    tableD.tableEl.classList.remove('dragging-table');
    document.body.style.cursor = '';
    tableD = null;
    return;
  }

  // ── Cancelled before threshold (just a click) ──
  if (pendingDrag) {
    pendingDrag = null;
    return;
  }

  if (!D) return;

  document.getElementById('ghost').innerHTML = '';
  if (D.sourceEl) D.sourceEl.classList.remove('placeholder');
  document.body.style.cursor = '';

  const sem = D.currentSem;
  if (sem) {
    sem.classList.remove('over');
    clearDropLines(sem);

    const list  = sem.querySelector('.course-list');
    const card  = buildCard(D.name, D.color);
    const cards = visibleCards(list);
    if (D.insertIdx >= 0 && D.insertIdx < cards.length) {
      list.insertBefore(card, cards[D.insertIdx]);
    } else {
      list.appendChild(card);
    }
    if (D.sourceEl) D.sourceEl.remove();

  } else {
    const canvas = document.getElementById('canvas');
    const cr = canvas.getBoundingClientRect();
    const x  = Math.max(0, e.clientX - cr.left - D.ox);
    const y  = Math.max(0, e.clientY - cr.top  - D.oy);

    if (D.kind === 'bubble') {
      D.sourceEl.style.left = x + 'px';
      D.sourceEl.style.top  = y + 'px';
    } else if (D.kind === 'search') {
      buildBubble(D.name, D.color, x, y);
    } else {
      D.sourceEl.remove();
      buildBubble(D.name, D.color, x, y);
    }
  }

  D = null;
});

/* Reset all drag state if a touch gesture is interrupted (e.g. scroll takes over) */
document.addEventListener('pointercancel', () => {
  if (D && D.sourceEl) D.sourceEl.classList.remove('placeholder');
  if (D && D.currentSem) { D.currentSem.classList.remove('over'); clearDropLines(D.currentSem); }
  if (tableD) tableD.tableEl.classList.remove('dragging-table');
  if (tableR) tableR.tableEl.classList.remove('resizing-table');
  document.getElementById('ghost').innerHTML = '';
  document.body.style.cursor = '';
  D = pendingDrag = tableD = tableR = null;
});

/* ── Drop helpers ────────────────────────────────────────── */

function hitSemester(cx, cy) {
  const els = document.elementsFromPoint(cx, cy);
  return els.find(el => el.classList.contains('semester')) || null;
}

function visibleCards(list) {
  return Array.from(list.querySelectorAll('.course-card:not(.placeholder)'));
}

function computeInsertIdx(sem, clientY) {
  const cards = visibleCards(sem.querySelector('.course-list'));
  for (let i = 0; i < cards.length; i++) {
    const r = cards[i].getBoundingClientRect();
    if (clientY < r.top + r.height / 2) return i;
  }
  return cards.length;
}

function showDropLine(sem, idx) {
  clearDropLines(sem);
  const list  = sem.querySelector('.course-list');
  const cards = visibleCards(list);
  const line  = mk('div', 'drop-line');
  line.classList.add('active');
  if (idx < cards.length) list.insertBefore(line, cards[idx]);
  else list.appendChild(line);
}

function clearDropLines(sem) {
  if (!sem) return;
  sem.querySelectorAll('.drop-line').forEach(l => l.remove());
}

/* ── Export ──────────────────────────────────────────────── */

function serializeSchedule() {
  const data = { version: 2, years: [], bubbles: [], yearTheme: activeYearThemeIdx, background: { bg: currentBg, dot: getComputedStyle(document.documentElement).getPropertyValue('--dot').trim() } };

  document.querySelectorAll('.year-table').forEach(table => {
    const rect = table.getBoundingClientRect();
    const year = { label: table.querySelector('.table-title').textContent, x: parseFloat(table.style.left)||0, y: parseFloat(table.style.top)||0, w: Math.round(rect.width), h: Math.round(rect.height), semesters: [] };
    table.querySelectorAll('.semester').forEach((sem, i) => {
      const courses = [];
      sem.querySelectorAll('.course-card').forEach(card => {
        courses.push({ name: card.dataset.name, color: card.dataset.color });
      });
      year.semesters.push({ n: i + 1, courses });
    });
    data.years.push(year);
  });

  document.querySelectorAll('#canvas > .bubble').forEach(bub => {
    data.bubbles.push({
      name:  bub.dataset.name,
      color: bub.dataset.color,
      x:     parseFloat(bub.style.left),
      y:     parseFloat(bub.style.top),
    });
  });

  return data;
}

function doExport() {
  const data = serializeSchedule();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'course-schedule.json';
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Import modal ────────────────────────────────────────── */

let importFileText = null;

function openImportModal() {
  importFileText = null;
  document.getElementById('import-file').value   = '';
  document.getElementById('import-text').value   = '';
  document.getElementById('file-name-label').textContent = '';
  setImportStatus('', '');
  document.getElementById('import-modal').classList.remove('hidden');
}

function closeImportModal() {
  document.getElementById('import-modal').classList.add('hidden');
}

function onFileSelected(e) {
  const file = e.target.files[0];
  if (!file) return;
  document.getElementById('file-name-label').textContent = file.name;
  const reader = new FileReader();
  reader.onload = ev => { importFileText = ev.target.result; };
  reader.readAsText(file);
}

function setImportStatus(type, msg) {
  const el = document.getElementById('import-status');
  el.className = 'modal-status' + (type ? ' ' + type : '');
  el.textContent = msg;
}

function doImport() {
  const raw = (importFileText || document.getElementById('import-text').value).trim();
  if (!raw) { setImportStatus('error', 'Nothing to import.'); return; }

  let data;
  try {
    data = parseImport(raw);
  } catch (err) {
    setImportStatus('error', 'Parse error: ' + err.message);
    return;
  }

  const mode = document.querySelector('input[name="import-mode"]:checked').value;

  if (mode === 'replace') {
    document.querySelectorAll('.year-table').forEach(el => el.remove());
    document.querySelectorAll('#canvas > .bubble').forEach(el => el.remove());
    yearCount = 0;
    pidx = 0;
  }

  // Restore background if present
  if (data.background?.bg) setBackground(data.background.bg, data.background.dot);
  if (data.yearTheme != null && YEAR_THEMES[data.yearTheme]) setYearTheme(data.yearTheme);

  let yCnt = 0, cCnt = 0;
  (data.years || []).forEach(year => {
    const s1 = year.semesters?.[0]?.courses || [];
    const s2 = year.semesters?.[1]?.courses || [];
    buildYear({ label: year.label, s1, s2, x: year.x, y: year.y, w: year.w, h: year.h });
    yCnt++;
    cCnt += s1.length + s2.length;
  });

  (data.bubbles || []).forEach(b => {
    buildBubble(b.name, b.color || nextColor(), b.x || 120, b.y || 120);
    cCnt++;
  });

  setImportStatus('ok', `Imported ${yCnt} year${yCnt !== 1 ? 's' : ''}, ${cCnt} course${cCnt !== 1 ? 's' : ''}.`);
  setTimeout(closeImportModal, 1400);
}

/* Parse both JSON and CSV */
function parseImport(raw) {
  const trimmed = raw.trimStart();

  /* ── JSON ── */
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    const obj = JSON.parse(trimmed);
    // Support bare array of year objects
    if (Array.isArray(obj)) return { years: obj, bubbles: [] };
    return obj;
  }

  /* ── CSV / plain text ──
     Expected: YearLabel, SemesterNumber, Course Name
     Lines starting with # are comments. */
  const yearMap = new Map();
  raw.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const parts = line.split(',');
    if (parts.length < 3) return;
    const yearLabel = parts[0].trim();
    const semNum    = parseInt(parts[1].trim(), 10);
    const name      = parts.slice(2).join(',').trim();
    if (!name || (semNum !== 1 && semNum !== 2)) return;

    if (!yearMap.has(yearLabel)) {
      yearMap.set(yearLabel, { label: yearLabel, semesters: [{ n:1, courses:[] }, { n:2, courses:[] }] });
    }
    yearMap.get(yearLabel).semesters[semNum - 1].courses.push({ name, color: nextColor() });
  });

  if (!yearMap.size) throw new Error('No valid rows found. Expected: Year Label, 1 or 2, Course Name');
  return { years: [...yearMap.values()], bubbles: [] };
}

/* Close modal on backdrop click */
document.getElementById('import-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('import-modal')) closeImportModal();
});

/* Close modal on Escape */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !document.getElementById('import-modal').classList.contains('hidden')) {
    closeImportModal();
  }
});

/* ── UW Course Database ──────────────────────────────────── */

const UW_COURSES = [
  // NE — Nanotechnology Engineering
  {c:'NE 100',n:'Introduction to Nanotechnology Engineering'},
  {c:'NE 101',n:'Seminar'},
  {c:'NE 109',n:'Societal and Environmental Impacts of Nanotechnology'},
  {c:'NE 110',n:'Introduction to Nanomaterials Health Risks'},
  {c:'NE 111',n:'Introduction to Programming for Engineers'},
  {c:'NE 112',n:'Linear Algebra for Nanotechnology Engineering'},
  {c:'NE 113',n:'Introduction to Computational Methods'},
  {c:'NE 121',n:'Chemical Principles'},
  {c:'NE 125',n:'Introduction to Materials Science and Engineering'},
  {c:'NE 131',n:'Physics for Nanotechnology Engineering'},
  {c:'NE 140',n:'Linear Circuits'},
  {c:'NE 204',n:'NanoFabrication'},
  {c:'NE 212',n:'Numerical Methods'},
  {c:'NE 219',n:'Introduction to Nano Characterization'},
  {c:'NE 221',n:'Physical Chemistry for Nanotechnology'},
  {c:'NE 224',n:'Signals and Systems'},
  {c:'NE 226',n:'Engineering of Quantum Devices'},
  {c:'NE 232',n:'Electronic Properties of Materials'},
  {c:'NE 241',n:'Introduction to Quantum Mechanics'},
  {c:'NE 252',n:'Introduction to Bionanotechnology'},
  {c:'NE 264',n:'Introduction to MEMS'},
  {c:'NE 333',n:'Biological and Chemical Sensors'},
  {c:'NE 336',n:'Micro and Nano Scale Heat Transfer'},
  {c:'NE 339',n:'Introduction to Functional Materials'},
  {c:'NE 340',n:'Polymer Science and Engineering'},
  {c:'NE 344',n:'Nanoelectronics'},
  {c:'NE 345',n:'Nanostructured Materials'},
  {c:'NE 351',n:'Introduction to Nanomedicine'},
  {c:'NE 353',n:'Nanobiotechnology'},
  {c:'NE 360',n:'Analog Integrated Circuits'},
  {c:'NE 371',n:'Nano-Biomechanics'},
  {c:'NE 380',n:'Micro and Nano Device Fabrication'},
  {c:'NE 390',n:'Engineering Ethics and Professional Practice'},
  {c:'NE 459',n:'NanoDevice Lab'},
  {c:'NE 466',n:'Nanoscale Measurement and Simulation'},
  {c:'NE 471',n:'Bionanotechnology'},
  {c:'NE 480',n:'Nanophotonics'},
  {c:'NE 491',n:'Nanotechnology Engineering Design Project 1'},
  {c:'NE 493',n:'Nanotechnology Engineering Design Project 2'},
  {c:'NE 494',n:'Advanced Topics in Nanotechnology Engineering'},
  // MATH
  {c:'MATH 115',n:'Linear Algebra for Engineering'},
  {c:'MATH 116',n:'Calculus 1 for Engineering'},
  {c:'MATH 117',n:'Calculus 1 for Engineering'},
  {c:'MATH 118',n:'Calculus 2 for Engineering'},
  {c:'MATH 119',n:'Calculus 2 for Engineering'},
  {c:'MATH 127',n:'Calculus 1 for the Sciences'},
  {c:'MATH 128',n:'Calculus 2 for the Sciences'},
  {c:'MATH 135',n:'Algebra for Honours Mathematics'},
  {c:'MATH 137',n:'Calculus 1 for Honours Mathematics'},
  {c:'MATH 138',n:'Calculus 2 for Honours Mathematics'},
  {c:'MATH 211',n:'Advanced Calculus 1 for Electrical and Computer Engineers'},
  {c:'MATH 212',n:'Advanced Calculus 2 for Electrical and Computer Engineers'},
  {c:'MATH 213',n:'Advanced Mathematics for Software Engineers'},
  {c:'MATH 215',n:'Linear Algebra for Engineering'},
  {c:'MATH 217',n:'Calculus 3 for Chemical Engineering'},
  {c:'MATH 218',n:'Differential Equations for Engineers'},
  {c:'MATH 227',n:'Calculus 3 for Honours Physics'},
  {c:'MATH 228',n:'Differential Equations for Physics and Chemistry'},
  {c:'MATH 235',n:'Linear Algebra 2 for Honours Mathematics'},
  {c:'MATH 237',n:'Calculus 3 for Honours Mathematics'},
  {c:'MATH 239',n:'Introduction to Combinatorics'},
  {c:'MATH 245',n:'Linear Algebra 1 (Advanced)'},
  {c:'MATH 247',n:'Calculus 3 (Advanced)'},
  // PHYS
  {c:'PHYS 111',n:'Physics 1'},
  {c:'PHYS 112',n:'Physics 2'},
  {c:'PHYS 121',n:'Mechanics'},
  {c:'PHYS 122',n:'Waves, Electricity and Magnetic Fields'},
  {c:'PHYS 234',n:'Quantum Physics 1'},
  {c:'PHYS 242',n:'Electricity and Magnetism'},
  {c:'PHYS 256',n:'Optics and Modern Physics'},
  {c:'PHYS 263',n:'Classical Mechanics and Special Relativity'},
  {c:'PHYS 358',n:'Thermodynamics'},
  {c:'PHYS 359',n:'Statistical Mechanics'},
  {c:'PHYS 363',n:'Quantum Mechanics'},
  {c:'PHYS 437',n:'Physics of Quantum Devices'},
  {c:'PHYS 454',n:'Quantum Optics and Quantum Information'},
  // CHEM
  {c:'CHEM 120',n:'General Chemistry 1'},
  {c:'CHEM 123',n:'General Chemistry 2'},
  {c:'CHEM 202',n:'Organic Chemistry 1'},
  {c:'CHEM 206',n:'Organic Chemistry for Engineers'},
  {c:'CHEM 209',n:'Introduction to Materials Chemistry'},
  {c:'CHEM 212',n:'Organic Chemistry 2'},
  {c:'CHEM 217',n:'Environmental Chemistry'},
  {c:'CHEM 221',n:'Analytical Chemistry 1'},
  {c:'CHEM 254',n:'Physical Chemistry 1'},
  {c:'CHEM 266',n:'Molecular Structure and Bonding'},
  {c:'CHEM 356',n:'Physical Chemistry 2'},
  // ECE
  {c:'ECE 105',n:'Physics of Electrical Engineering 1'},
  {c:'ECE 106',n:'Physics of Electrical Engineering 2'},
  {c:'ECE 124',n:'Digital Circuits and Systems'},
  {c:'ECE 140',n:'Linear Circuits'},
  {c:'ECE 192',n:'Engineering Economics and Impact on Society'},
  {c:'ECE 200',n:'Circuits and Signals'},
  {c:'ECE 204',n:'Numerical Methods'},
  {c:'ECE 222',n:'Digital Computers'},
  {c:'ECE 240',n:'Electronic Circuits 1'},
  {c:'ECE 318',n:'Fundamentals of Optics'},
  {c:'ECE 342',n:'Electronic Circuits 2'},
  {c:'ECE 380',n:'Analog Control Systems'},
  {c:'ECE 481',n:'Device Physics'},
  {c:'ECE 488',n:'Compound Semiconductors and Devices'},
  // CS
  {c:'CS 115',n:'Introduction to Computer Science 1'},
  {c:'CS 116',n:'Introduction to Computer Science 2'},
  {c:'CS 135',n:'Designing Functional Programs'},
  {c:'CS 136',n:'Elementary Algorithm Design and Data Abstraction'},
  {c:'CS 137',n:'Programming Principles'},
  {c:'CS 138',n:'Introduction to Data Abstraction and Implementation'},
  {c:'CS 241',n:'Foundations of Sequential Programs'},
  {c:'CS 246',n:'Object-Oriented Software Development'},
  {c:'CS 341',n:'Algorithms'},
  {c:'CS 370',n:'Numerical Computation'},
  {c:'CS 456',n:'Computer Networks'},
  {c:'CS 486',n:'Introduction to Artificial Intelligence'},
  // BME
  {c:'BME 123',n:'The Human Machine'},
  {c:'BME 181',n:'Biomedical Applications of Electrical Circuits'},
  {c:'BME 284',n:'Biomechanics'},
  {c:'BME 286',n:'Biomedical Signal Analysis'},
  {c:'BME 356',n:'Biomedical Optics'},
  {c:'BME 452',n:'Biomedical Imaging Systems'},
  // BIOL
  {c:'BIOL 140',n:'Fundamentals of Microbiology'},
  {c:'BIOL 150',n:'Organismal and Evolutionary Biology'},
  {c:'BIOL 240',n:'Genetics'},
  {c:'BIOL 301',n:'Molecular Biology'},
  {c:'BIOL 303',n:'Developmental Biology'},
  // MSCI / Management
  {c:'MSCI 100',n:'Management Engineering Concepts'},
  {c:'MSCI 211',n:'Organizational Behaviour'},
  {c:'MSCI 261',n:'Engineering Economics: Financial Management for Engineers'},
  {c:'MSCI 311',n:'Organizational Design and Technology'},
  {c:'MSCI 331',n:'Introduction to Optimization'},
  // ENVE
  {c:'ENVE 153',n:'Environmental Engineering Concepts'},
  {c:'ENVE 223',n:'Fluid Mechanics'},
  {c:'ENVE 321',n:'Applied Thermodynamics'},
  {c:'ENVE 375',n:'Risk Assessment'},
  // BIOL — Biology (UW Science)
  {c:'BIOL 110',n:'Biodiversity, Biomes, and Evolution'},
  {c:'BIOL 130',n:'Introductory Cell Biology'},
  {c:'BIOL 130L',n:'Cell Biology Laboratory'},
  {c:'BIOL 201',n:'Human Anatomy'},
  {c:'BIOL 211',n:'Introductory Vertebrate Zoology'},
  {c:'BIOL 212',n:'Dinosaurs'},
  {c:'BIOL 220',n:'Introduction to Plant Structure and Function'},
  {c:'BIOL 225',n:'Plants and Civilization'},
  {c:'BIOL 231',n:'Cell Biology'},
  {c:'BIOL 235',n:'Foundations of Molecular Biology'},
  {c:'BIOL 239',n:'Genetics'},
  {c:'BIOL 241',n:'Introduction to Applied Microbiology'},
  {c:'BIOL 251',n:'Fundamentals of Ecology'},
  {c:'BIOL 266',n:'Introduction to Computational Biology'},
  {c:'BIOL 273',n:'Principles of Human Physiology 1'},
  {c:'BIOL 280',n:'Introduction to Biophysics'},
  {c:'BIOL 302',n:'Functional Histology'},
  {c:'BIOL 308',n:'Principles of Molecular Biology'},
  {c:'BIOL 310',n:'Invertebrate Zoology'},
  {c:'BIOL 312',n:'The Natural History of Aquatic Organisms'},
  {c:'BIOL 323',n:'Plant Physiology'},
  {c:'BIOL 325',n:'Flowering Plants'},
  {c:'BIOL 331',n:'Advanced Cell Biology'},
  {c:'BIOL 335L',n:'Molecular Biology Techniques'},
  {c:'BIOL 341',n:'Fundamentals of Immunology'},
  {c:'BIOL 342',n:'Molecular Biotechnology 1'},
  {c:'BIOL 345',n:'Microorganisms in Foods'},
  {c:'BIOL 346',n:'Microbial Ecology and Diversity'},
  {c:'BIOL 348L',n:'Laboratory Methods in Microbiology'},
  {c:'BIOL 349',n:'Synthetic Biology Project Design'},
  {c:'BIOL 350',n:'Ecosystem Ecology'},
  {c:'BIOL 351',n:'Aquatic Ecology'},
  {c:'BIOL 352',n:'Populations and Communities'},
  {c:'BIOL 354',n:'Environmental Toxicology'},
  {c:'BIOL 355',n:'Biology of Human Aging'},
  {c:'BIOL 359',n:'Evolution 1: Mechanisms'},
  {c:'BIOL 360',n:'Evolution 2: Fossil Record'},
  {c:'BIOL 361',n:'Biostatistics and Experimental Design'},
  {c:'BIOL 365',n:'Methods in Bioinformatics'},
  {c:'BIOL 370',n:'Comparative Animal Physiology: Environmental Aspects'},
  {c:'BIOL 371',n:'Comparative Animal Physiology: Evolutionary Themes'},
  {c:'BIOL 373',n:'Principles of Human Physiology 2'},
  {c:'BIOL 376',n:'Cellular Neurophysiology'},
  {c:'BIOL 382',n:'Computational Modelling of Cellular Systems'},
  {c:'BIOL 383',n:'Tropical Ecosystems'},
  {c:'BIOL 403',n:'Developmental Biology and Embryology'},
  {c:'BIOL 414',n:'Parasitology'},
  {c:'BIOL 431',n:'Bacterial Molecular Genetics'},
  {c:'BIOL 432',n:'Molecular Biotechnology 2'},
  {c:'BIOL 433',n:'Plant Biotechnology'},
  {c:'BIOL 434',n:'Human Molecular Genetics'},
  {c:'BIOL 439',n:'Environmental and Natural Products Biochemistry'},
  {c:'BIOL 441',n:'Advances in Immunology'},
  {c:'BIOL 442',n:'Virology'},
  {c:'BIOL 443',n:'Fermentation Biotechnology'},
  {c:'BIOL 444',n:'Bacterial Pathogenesis'},
  {c:'BIOL 447',n:'Environmental Microbiology'},
  {c:'BIOL 448',n:'Microbial Physiology and Biochemistry'},
  {c:'BIOL 449',n:'Public Health Microbiology'},
  {c:'BIOL 450',n:'Marine Biology'},
  {c:'BIOL 451',n:'Advanced Ecology and Evolution'},
  {c:'BIOL 455',n:'Ecological Risk Assessment and Management'},
  {c:'BIOL 456',n:'Population Biology'},
  {c:'BIOL 457',n:'Analysis of Communities'},
  {c:'BIOL 458',n:'Quantitative Ecology'},
  {c:'BIOL 461',n:'Advanced Biostatistics'},
  {c:'BIOL 462',n:'Applied Wetland Science'},
  {c:'BIOL 465',n:'Structural Bioinformatics'},
  {c:'BIOL 469',n:'Genomics'},
  {c:'BIOL 470',n:'Methods of Aquatic Ecology'},
  {c:'BIOL 472',n:'Cell Biology of Human Disease'},
  {c:'BIOL 473',n:'Mammalian Reproduction'},
  {c:'BIOL 475',n:'Current Topics in Microbiology'},
  {c:'BIOL 476',n:'Systems Neuroscience: From Neurons to Behaviour'},
  {c:'BIOL 479',n:'Population Genetics and Evolution'},
  {c:'BIOL 483',n:'Animal Cell Biotechnology'},
  {c:'BIOL 484',n:'Advanced Eukaryotic Genetics'},
  {c:'BIOL 485',n:'Conservation Biology'},
  {c:'BIOL 487',n:'Computational Neuroscience'},
  {c:'BIOL 489',n:'Arctic Ecology'},
  {c:'BIOL 499A',n:'Senior Honours Project'},
  // CHEM — Chemistry (UW Science, expanded)
  {c:'CHEM 120L',n:'General Chemistry Laboratory 1'},
  {c:'CHEM 121',n:'Physical and Chemical Properties of Matter'},
  {c:'CHEM 121L',n:'Chemical Reaction Laboratory 1'},
  {c:'CHEM 123L',n:'General Chemistry Laboratory 2'},
  {c:'CHEM 125',n:'Chemical Reactions, Equilibria and Kinetics'},
  {c:'CHEM 125L',n:'Chemical Reaction Laboratory 2'},
  {c:'CHEM 140',n:'Introduction to Scientific Calculations'},
  {c:'CHEM 200',n:'Introduction to Laboratory Techniques'},
  {c:'CHEM 214',n:'Biological Inorganic Chemistry'},
  {c:'CHEM 220',n:'Intro Analytical Chemistry'},
  {c:'CHEM 220L',n:'Quantitative Chemical Analysis Laboratory'},
  {c:'CHEM 224L',n:'Analytical Instrumentation Laboratory'},
  {c:'CHEM 233',n:'Fundamentals of Biochemistry'},
  {c:'CHEM 233L',n:'Fundamentals of Biochemistry Laboratory'},
  {c:'CHEM 237',n:'Introductory Biochemistry'},
  {c:'CHEM 240',n:'Mathematical Methods for Chemistry'},
  {c:'CHEM 250L',n:'Physical Chemistry Laboratory 1'},
  {c:'CHEM 257',n:'Physical Chemistry for Life Sciences'},
  {c:'CHEM 262',n:'Organic Chemistry for Engineering'},
  {c:'CHEM 264',n:'Organic Chemistry 1'},
  {c:'CHEM 265',n:'Organic Chemistry 2'},
  {c:'CHEM 267',n:'Basic Organic Chemistry 2'},
  {c:'CHEM 310',n:'Transition Element Compounds and Inorganic Materials'},
  {c:'CHEM 313',n:'Main Group and Solid State Chemistry'},
  {c:'CHEM 323',n:'Analytical Instrumentation'},
  {c:'CHEM 331',n:'Fundamentals of Metabolism 1'},
  {c:'CHEM 333',n:'Metabolism 1'},
  {c:'CHEM 335L',n:'Advanced Biochemistry Laboratory'},
  {c:'CHEM 340L',n:'Introductory Computational Chemistry'},
  {c:'CHEM 350',n:'Chemical Kinetics and Statistical Mechanics'},
  {c:'CHEM 350L',n:'Physical Chemistry Laboratory 2'},
  {c:'CHEM 357',n:'Physical Biochemistry'},
  {c:'CHEM 360',n:'Organic Chemistry 3'},
  {c:'CHEM 363',n:'Organic Process Chemistry'},
  {c:'CHEM 370',n:'Introduction to Polymer Science'},
  {c:'CHEM 381',n:'Bioorganic Chemistry'},
  {c:'CHEM 383',n:'Medicinal Chemistry'},
  {c:'CHEM 404',n:'Physicochemical Aspects of Natural Waters'},
  {c:'CHEM 430',n:'Special Topics in Biochemistry'},
  {c:'CHEM 432',n:'Metabolism 2'},
  {c:'CHEM 433',n:'Advanced Biochemistry'},
  {c:'CHEM 464',n:'Spectroscopy in Organic Chemistry'},
  {c:'CHEM 481',n:'Rational Design of Potential Drug Candidates'},
  // EARTH — Earth Sciences
  {c:'EARTH 121',n:'Introductory Earth Sciences'},
  {c:'EARTH 122',n:'Introductory Environmental Sciences'},
  {c:'EARTH 123',n:'Introductory Hydrology'},
  {c:'EARTH 221',n:'Introductory Geochemistry'},
  {c:'EARTH 223',n:'Field Methods in Hydrology'},
  {c:'EARTH 231',n:'Mineralogy'},
  {c:'EARTH 232',n:'Introductory Petrography'},
  {c:'EARTH 235',n:'Stratigraphic Approaches to Understanding Earth\'s History'},
  {c:'EARTH 238',n:'Introductory Structural Geology'},
  {c:'EARTH 260',n:'Introductory Applied Geophysics'},
  {c:'EARTH 270',n:'Disasters and Natural Hazards'},
  {c:'EARTH 281',n:'Geological Impacts on Human Health'},
  {c:'EARTH 305',n:'Physical Science of Climate Change'},
  {c:'EARTH 321',n:'Introduction to Geomicrobiology'},
  {c:'EARTH 322',n:'Ecohydrology'},
  {c:'EARTH 331',n:'Volcanology and Igneous Petrology'},
  {c:'EARTH 332',n:'Metamorphic Petrology'},
  {c:'EARTH 333',n:'Introductory Sedimentology'},
  {c:'EARTH 342',n:'Geomorphology and GIS Applications'},
  {c:'EARTH 343',n:'Coastal Geomorphology'},
  {c:'EARTH 355',n:'Water: Data to Decisions'},
  {c:'EARTH 390',n:'Methods in Geological Mapping'},
  {c:'EARTH 421',n:'Advanced Geochemistry'},
  {c:'EARTH 435',n:'Advanced Structural Geology'},
  {c:'EARTH 437',n:'Rock Mechanics'},
  {c:'EARTH 438',n:'Engineering Geology'},
  {c:'EARTH 439',n:'Flow and Transport Through Fractured Rocks'},
  {c:'EARTH 440',n:'Quaternary Geology'},
  {c:'EARTH 444',n:'Applied Wetland Science'},
  {c:'EARTH 456',n:'Numerical Methods in Hydrogeology'},
  {c:'EARTH 458',n:'Physical Hydrogeology'},
  {c:'EARTH 459',n:'Chemical Hydrogeology'},
  {c:'EARTH 461',n:'Near-Surface Geophysics'},
  {c:'EARTH 471',n:'Mineral Deposits'},
  // MNS — Materials and Nanosciences
  {c:'MNS 101',n:'Materials and Nanosciences in the Modern World'},
  {c:'MNS 102',n:'Techniques for Materials and Nanosciences'},
  {c:'MNS 201L',n:'Materials and Nanosciences Laboratory'},
  {c:'MNS 211',n:'Chemistry and the Solid State'},
  {c:'MNS 221',n:'Physics and the Solid State'},
  {c:'MNS 321',n:'Electrical and Optical Properties of Materials'},
  {c:'MNS 322',n:'Polymer Materials'},
  {c:'MNS 331',n:'Biomaterials'},
  {c:'MNS 410',n:'Special Topics in Solid-State Materials'},
  {c:'MNS 431',n:'Special Topics in Nano-Biomaterials'},
  // PHYS — Physics (UW Science, expanded)
  {c:'PHYS 105',n:'Introduction to Physics for Health Care Professions'},
  {c:'PHYS 115',n:'Mechanics'},
  {c:'PHYS 160L',n:'Introductory Measurement Laboratory'},
  {c:'PHYS 175',n:'Introduction to the Universe'},
  {c:'PHYS 223',n:'Waves'},
  {c:'PHYS 225',n:'Modelling Biological Physics'},
  {c:'PHYS 249',n:'Linear Algebra for Physics and Astronomy'},
  {c:'PHYS 267',n:'Probability, Statistics, and Data Analysis for Physics'},
  {c:'PHYS 275',n:'Planets'},
  {c:'PHYS 280',n:'Introduction to Biophysics'},
  {c:'PHYS 334',n:'Quantum Physics 2'},
  {c:'PHYS 342',n:'Electricity and Magnetism 2'},
  {c:'PHYS 349',n:'Advanced Computational Physics'},
  {c:'PHYS 356',n:'Optics 1'},
  {c:'PHYS 357',n:'Statistical Mechanics and Thermodynamics'},
  {c:'PHYS 364',n:'Mathematical Physics 1'},
  {c:'PHYS 365',n:'Mathematical Physics 2'},
  {c:'PHYS 375',n:'Stars'},
  {c:'PHYS 376',n:'Relativistic Physics'},
  {c:'PHYS 380',n:'Molecular and Cellular Biophysics'},
  {c:'PHYS 383',n:'Medical Physics'},
  {c:'PHYS 391',n:'Electronics'},
  {c:'PHYS 393',n:'Physical Optics'},
  {c:'PHYS 394',n:'Light-Matter Interactions'},
  {c:'PHYS 395',n:'Biophysics of Therapeutic Methods'},
  {c:'PHYS 396',n:'Biophysics of Imaging'},
  {c:'PHYS 434',n:'Quantum Physics 3'},
  {c:'PHYS 436',n:'Condensed Matter'},
  {c:'PHYS 442',n:'Electricity and Magnetism 3'},
  {c:'PHYS 444',n:'Introduction to Particle Physics'},
  {c:'PHYS 449',n:'Machine Learning in Physics'},
  {c:'PHYS 456',n:'Optics 2'},
  {c:'PHYS 457',n:'Advanced Statistical Mechanics'},
  {c:'PHYS 464',n:'Group Theory for Physicists'},
  {c:'PHYS 468',n:'Introduction to the Implementation of Quantum Information Processing'},
  {c:'PHYS 474',n:'Galaxies'},
  {c:'PHYS 475',n:'Cosmology'},
  {c:'PHYS 476',n:'Introduction to General Relativity'},
  {c:'PHYS 480',n:'Advanced Topics in Biophysics'},
  {c:'PHYS 483',n:'Advanced Therapeutic Concepts in Oncology and Medical Physics'},
  {c:'PHYS 490',n:'Special Topics in Physics'},
  // SCBUS — Science and Business
  {c:'SCBUS 122',n:'Management of Business Organizations'},
  {c:'SCBUS 123',n:'Workshop 1: Science and Business'},
  {c:'SCBUS 223',n:'Workshop 2: Strategies Behind Technological Innovation'},
  {c:'SCBUS 225',n:'Organizational Behaviour in Scientific and Technical Workplaces'},
  {c:'SCBUS 323',n:'Workshop 3: Technology Development'},
  {c:'SCBUS 423',n:'Workshop 4: Strategic Management of Science and Business'},
  {c:'SCBUS 424',n:'Workshop 5: Special Topics in Science and Business'},
  // SCI — General Science
  {c:'SCI 200',n:'Energy: Its Development, Use, and Issues'},
  {c:'SCI 205',n:'Climate Change Fundamentals'},
  {c:'SCI 206',n:'The Physics of How Things Work'},
  {c:'SCI 207',n:'Physics, the Universe, and Everything'},
  {c:'SCI 227',n:'Chemistry in Society: Yesterday, Today, and Tomorrow'},
  {c:'SCI 238',n:'Introductory Astronomy'},
  {c:'SCI 250',n:'Environmental Geology'},
  {c:'SCI 252',n:'Quantum Mechanics for Everyone'},
  {c:'SCI 266',n:'Ancient Science'},
  {c:'SCI 267',n:'Introduction to the Philosophy of Science'},
  // STAT — Statistics
  {c:'STAT 202',n:'Introductory Statistics for Scientists'},
  {c:'STAT 206',n:'Statistics for Software Engineering'},
  {c:'STAT 211',n:'Introductory Statistics and Sampling for Accounting'},
  {c:'STAT 220',n:'Probability (Non-Specialist Level)'},
  {c:'STAT 221',n:'Statistics (Non-Specialist Level)'},
  {c:'STAT 230',n:'Probability'},
  {c:'STAT 231',n:'Statistics'},
  {c:'STAT 240',n:'Probability (Advanced Level)'},
  {c:'STAT 241',n:'Statistics (Advanced Level)'},
  {c:'STAT 316',n:'Introduction to Statistical Problem Solving'},
  {c:'STAT 321',n:'Regression and Forecasting (Non-Specialist Level)'},
  {c:'STAT 322',n:'Sampling and Experimental Design (Non-Specialist Level)'},
  {c:'STAT 330',n:'Mathematical Statistics'},
  {c:'STAT 331',n:'Applied Linear Models'},
  {c:'STAT 332',n:'Sampling and Experimental Design'},
  {c:'STAT 333',n:'Stochastic Processes 1'},
  {c:'STAT 334',n:'Probability Models for Business and Accounting'},
  {c:'STAT 337',n:'Introduction to Biostatistics'},
  {c:'STAT 340',n:'Stochastic Simulation Methods'},
  {c:'STAT 341',n:'Computational Statistics and Data Analysis'},
  {c:'STAT 371',n:'Applied Linear Models and Process Improvement for Business'},
  {c:'STAT 372',n:'Survey Sampling and Experimental Design Techniques for Business'},
  {c:'STAT 373',n:'Regression and Forecasting Methods in Finance'},
  {c:'STAT 374',n:'Quantitative Foundations for Finance'},
  {c:'STAT 430',n:'Experimental Design'},
  {c:'STAT 431',n:'Generalized Linear Models and their Applications'},
  {c:'STAT 433',n:'Stochastic Processes 2'},
  {c:'STAT 435',n:'Statistical Methods for Process Improvements'},
  {c:'STAT 436',n:'Introduction to the Analysis of Spatial Data in Health Research'},
  {c:'STAT 437',n:'Statistical Methods for Life History Analysis'},
  {c:'STAT 438',n:'Advanced Methods in Biostatistics'},
  {c:'STAT 440',n:'Computational Inference'},
  {c:'STAT 441',n:'Statistical Learning - Classification'},
  {c:'STAT 442',n:'Data Visualization'},
  {c:'STAT 443',n:'Forecasting'},
  {c:'STAT 444',n:'Statistical Learning - Advanced Regression'},
  {c:'STAT 450',n:'Estimation and Hypothesis Testing'},
  {c:'STAT 454',n:'Sampling Theory and Practice'},
  {c:'STAT 464',n:'Topics in Probability Theory'},
  {c:'STAT 466',n:'Topics in Statistics 1'},
  {c:'STAT 467',n:'Topics in Statistics 2'},
  {c:'STAT 468',n:'Readings in Statistics 1'},
  {c:'STAT 469',n:'Readings in Statistics 2'},
  // ENGL — English Language and Literature
  {c:'ENGL 100A',n:'Fiction'},
  {c:'ENGL 100B',n:'Poetry'},
  {c:'ENGL 100C',n:'Drama'},
  {c:'ENGL 101A',n:'Introduction to Literary Studies'},
  {c:'ENGL 101B',n:'Introduction to Rhetorical Studies'},
  {c:'ENGL 101C',n:'Introduction to Literature and Rhetoric'},
  {c:'ENGL 103',n:'Combating Racisms'},
  {c:'ENGL 104',n:'Rhetoric in Popular Culture'},
  {c:'ENGL 107',n:'Writing With Your own English(es)'},
  {c:'ENGL 108A',n:'The Superhero'},
  {c:'ENGL 108B',n:'Global English Literatures'},
  {c:'ENGL 108D',n:'Digital Lives'},
  {c:'ENGL 108E',n:'Gender and Representation'},
  {c:'ENGL 108F',n:'The Rebel'},
  {c:'ENGL 108G',n:'Horror'},
  {c:'ENGL 108P',n:'Popular Potter'},
  {c:'ENGL 108T',n:'Tolkien: From Book to Film'},
  {c:'ENGL 108X',n:'Literature and Medicine'},
  {c:'ENGL 109',n:'Introduction to Academic Writing'},
  {c:'ENGL 119',n:'Communications in Mathematics & Computer Science'},
  {c:'ENGL 129R',n:'Written Academic English'},
  {c:'ENGL 140R',n:'The Use of English'},
  {c:'ENGL 190',n:'Shakespeare'},
  {c:'ENGL 191',n:'Communication in the Engineering Profession'},
  {c:'ENGL 192',n:'Communication in the Engineering Profession'},
  {c:'ENGL 193',n:'Communication in the Sciences'},
  {c:'ENGL 200A',n:'English Literatures 1'},
  {c:'ENGL 200B',n:'English Literatures 2'},
  {c:'ENGL 200C',n:'English Literatures 3'},
  {c:'ENGL 201',n:'The Short Story'},
  {c:'ENGL 202A',n:'The Bible and Literature 1'},
  {c:'ENGL 203',n:'Designing Digital Media'},
  {c:'ENGL 204',n:'Designing Digital Video'},
  {c:'ENGL 205R',n:'The Canadian Short Story'},
  {c:'ENGL 206',n:'Writing Lives'},
  {c:'ENGL 208A',n:'Forms of Fantasy'},
  {c:'ENGL 208B',n:'Science Fiction'},
  {c:'ENGL 208C',n:"Studies in Children's Literature"},
  {c:'ENGL 208E',n:"Women's Writing"},
  {c:'ENGL 208G',n:'Gothic Monsters'},
  {c:'ENGL 208K',n:'Detective Fiction'},
  {c:'ENGL 208M',n:'Travel Literature'},
  {c:'ENGL 209',n:'Advanced Academic Writing'},
  {c:'ENGL 210C',n:'Genres of Creative Writing'},
  {c:'ENGL 210E',n:'Genres of Technical Communication'},
  {c:'ENGL 210F',n:'Genres of Business Communication'},
  {c:'ENGL 210G',n:'Genres of Fundraising Communication'},
  {c:'ENGL 210H',n:'Arts Writing'},
  {c:'ENGL 210I',n:'Legal Writing'},
  {c:'ENGL 210J',n:'Technical Editing'},
  {c:'ENGL 211',n:'First Nations, Metis, and Inuit Literatures'},
  {c:'ENGL 213',n:'Literature and the Law'},
  {c:'ENGL 217',n:"Canadian Children's Literature"},
  {c:'ENGL 221',n:'Monstrous Hunger'},
  {c:'ENGL 222',n:'Health, Illness, and Narrative'},
  {c:'ENGL 225',n:'Introduction to Anti-Racist Communication'},
  {c:'ENGL 230',n:'The Pleasure of Poetry'},
  {c:'ENGL 232',n:'Graphic Narrative'},
  {c:'ENGL 233',n:'Sexual Health and Well-Being in Comics'},
  {c:'ENGL 234',n:'Young Adult Literature'},
  {c:'ENGL 239',n:'Introduction to Modern Arab and Muslim Drama'},
  {c:'ENGL 240R',n:'Migration, Diaspora, and Exile in Muslim Narratives'},
  {c:'ENGL 241R',n:'Sacred Spaces and Human Geographies in Muslim Literary Expressions'},
  {c:'ENGL 242',n:'Literature, Rhetoric, and the Visual Arts'},
  {c:'ENGL 243',n:'Literature, Rhetoric, and Music'},
  {c:'ENGL 248',n:'Literature for an Ailing Planet'},
  {c:'ENGL 251',n:'Literary Theory and Criticism'},
  {c:'ENGL 262',n:'Manga'},
  {c:'ENGL 275',n:'Fiction and Film'},
  {c:'ENGL 280',n:'Literatures of Migration'},
  {c:'ENGL 291',n:'Global Literatures'},
  {c:'ENGL 292',n:'Rhetorical Theory and Criticism'},
  {c:'ENGL 293',n:'Introduction to Digital Media Studies'},
  {c:'ENGL 294',n:'Introduction to Critical Game Studies'},
  {c:'ENGL 295',n:'Social Media'},
  {c:'ENGL 303',n:'Special Topics in Digital Design'},
  {c:'ENGL 304',n:'Designing with Digital Sound'},
  {c:'ENGL 305A',n:'Old English Language and Literature'},
  {c:'ENGL 305B',n:'The Age of Beowulf'},
  {c:'ENGL 306A',n:'Introduction to Linguistics'},
  {c:'ENGL 306B',n:'How English Grammar Works'},
  {c:'ENGL 306D',n:'The History of the English Language'},
  {c:'ENGL 306F',n:'Introduction to Semiotics'},
  {c:'ENGL 306G',n:'Critical Discourse Analysis'},
  {c:'ENGL 307',n:'Linguistic Imperialism and Resistance'},
  {c:'ENGL 308',n:'Race and Resistance'},
  {c:'ENGL 309A',n:'Rhetoric, Classical to Enlightenment'},
  {c:'ENGL 309C',n:'Contemporary Rhetoric'},
  {c:'ENGL 309E',n:'Speech Writing'},
  {c:'ENGL 309G',n:'The Discourse of Dissent'},
  {c:'ENGL 310A',n:'Middle English Literature'},
  {c:'ENGL 310B',n:'Chaucer'},
  {c:'ENGL 311',n:'Eighteenth-Century Literature: Sex, Satire, and Sentiment'},
  {c:'ENGL 313',n:'Early Canadian Literatures'},
  {c:'ENGL 315',n:'Modern Canadian Literature'},
  {c:'ENGL 316',n:'Canadian Drama'},
  {c:'ENGL 318',n:'Contemporary Canadian Literature'},
  {c:'ENGL 319',n:'History and Theory of Writing and Print Media'},
  {c:'ENGL 320',n:'History and Theory of Pre-Internet Media'},
  {c:'ENGL 322',n:'Postcolonial Literature of the Americas'},
  {c:'ENGL 324',n:'Modern and Contemporary American Drama'},
  {c:'ENGL 325',n:'Austen'},
  {c:'ENGL 326',n:'Language, Life, and Literature in the Caribbean'},
  {c:'ENGL 327',n:'Black Diasporic Lives: 1740-1900'},
  {c:'ENGL 328',n:'Introduction to Black Canadian Writing'},
  {c:'ENGL 330',n:'Sonnets, Songs, and Satires: Poetry in the Age of Shakespeare'},
  {c:'ENGL 335',n:'Creative Writing 1'},
  {c:'ENGL 336',n:'Creative Writing 2'},
  {c:'ENGL 340',n:'Contemporary African Literature and Film'},
  {c:'ENGL 342',n:'American Literature to 1860'},
  {c:'ENGL 343',n:'American Literature 1860-1910'},
  {c:'ENGL 344',n:'Modern American Literature'},
  {c:'ENGL 345',n:'American Literature in a Global Context'},
  {c:'ENGL 346',n:'American Fiction'},
  {c:'ENGL 346R',n:'Global Asian Diasporas'},
  {c:'ENGL 347',n:'American Literature Since 1945'},
  {c:'ENGL 348',n:'American Poetry Since 1850'},
  {c:'ENGL 350A',n:'Seventeenth-Century Literature 1'},
  {c:'ENGL 350B',n:'Seventeenth-Century Literature 2'},
  {c:'ENGL 361',n:'Early Modern Worlds on Stage'},
  {c:'ENGL 362',n:'Shakespeare 1'},
  {c:'ENGL 363',n:'Shakespeare 2'},
  {c:'ENGL 364',n:'Shakespeare in Performance at The Stratford Festival'},
  {c:'ENGL 365',n:'Selected Studies'},
  {c:'ENGL 366',n:'Selected Studies'},
  {c:'ENGL 367',n:'Voice and Text at the Stratford Festival'},
  {c:'ENGL 371',n:'Editing Literary Works'},
  {c:'ENGL 372',n:'Women and Medicine in Literature'},
  {c:'ENGL 373',n:'Writing Anti-Racism'},
  {c:'ENGL 375',n:'Topics in Black Language and Linguistics'},
  {c:'ENGL 378',n:'Professional Communications in Statistics and Actuarial Science'},
  {c:'ENGL 381',n:'Early Modern Bodies'},
  {c:'ENGL 383',n:'Phonetics'},
  {c:'ENGL 392A',n:'Information Design'},
  {c:'ENGL 392B',n:'Visual Rhetoric'},
  {c:'ENGL 403',n:'Digital Design Research Project'},
  {c:'ENGL 405',n:'African American Rhetoric'},
  {c:'ENGL 406',n:'Advanced Rhetorical Study'},
  {c:'ENGL 407',n:'Language and Politics'},
  {c:'ENGL 408A',n:'Writing for the Media'},
  {c:'ENGL 408B',n:'The Discourse of Advertising'},
  {c:'ENGL 408C',n:'The Rhetoric of Digital Design: Theory and Practice'},
  {c:'ENGL 409A',n:'Rhetoric of Argumentation'},
  {c:'ENGL 410',n:'Eighteenth-Century Women Writers'},
  {c:'ENGL 412',n:'Eighteenth-Century Literature and Media'},
  {c:'ENGL 425',n:'Transnational Feminisms and Contemporary Narratives'},
  {c:'ENGL 430A',n:'Literature of the Romantic Period 1'},
  {c:'ENGL 430B',n:'Literature of the Romantic Period 2'},
  {c:'ENGL 432',n:'Topics in Creative Writing'},
  {c:'ENGL 451A',n:'Literature of the Victorian Age 1'},
  {c:'ENGL 451B',n:'Literature of the Victorian Age 2'},
  {c:'ENGL 460A',n:'Early Literature of the Modernist Period in the UK and Ireland'},
  {c:'ENGL 460B',n:'Literature of the Modernist Period in the UK and Ireland'},
  {c:'ENGL 460C',n:'Literature of the Postwar Period in the UK and Ireland'},
  {c:'ENGL 460D',n:'Contemporary Literature of the UK and Ireland'},
  {c:'ENGL 461',n:'Irish Literature'},
  {c:'ENGL 463',n:'Postcolonial Literatures'},
  {c:'ENGL 470A',n:'Contemporary Critical Theory'},
  {c:'ENGL 470B',n:'History of Literary Criticism'},
  {c:'ENGL 470C',n:'Literary Studies in Digital Forms'},
  {c:'ENGL 471',n:'Adapting Literary Works'},
  {c:'ENGL 472',n:'Research Methods in Technical Communication'},
  {c:'ENGL 481',n:'Topics in the History and Theory of Language'},
  {c:'ENGL 484',n:'Topics in Literatures Medieval to Romantic'},
  {c:'ENGL 485',n:'Topics in Literatures Romantic to Modern'},
  {c:'ENGL 486',n:'Topics in Literatures Modern to Contemporary'},
  {c:'ENGL 491',n:'Topics in Literature and Rhetoric'},
  {c:'ENGL 492',n:'Topics in the History and Theory of Rhetoric'},
  {c:'ENGL 493',n:'Topics in Professional Writing and Communication Design'},
  {c:'ENGL 494',n:'Topics in Forms of Media and Critical Analysis'},
  {c:'ENGL 495A',n:'Supervision of Honours Essay'},
  {c:'ENGL 495B',n:'Supervision of Honours Essay'},
  // Communication
  {c:'SPCOM 100',n:'Interpersonal Communication'},
  {c:'SPCOM 193',n:'Public Speaking'},
  {c:'WKRPT 200',n:'Work-term Report 2'},
  {c:'WKRPT 300',n:'Work-term Report 3'},
  {c:'WKRPT 400',n:'Work-term Report 4'},
  // ── Course labs (0.25 credits) paired with base courses already listed above ──
  {c:'PHYS 111L',n:'Physics 1 Laboratory'},
  {c:'PHYS 112L',n:'Physics 2 Laboratory'},
  {c:'PHYS 121L',n:'Mechanics Laboratory'},
  {c:'PHYS 122L',n:'Waves, Electricity and Magnetism Laboratory'},
  {c:'PHYS 175L',n:'Introduction to the Universe Laboratory'},
  {c:'PHYS 391L',n:'Electronics Laboratory'},
  {c:'BIOL 240L',n:'Microbiology Laboratory'},
  {c:'BIOL 373L',n:'Human Physiology Laboratory'},
  {c:'CHEM 237L',n:'Introductory Biochemistry Laboratory'},
  {c:'CHEM 262L',n:'Organic Chemistry Laboratory for Engineering Students'},
  {c:'CHEM 266L',n:'Organic Chemistry Laboratory'},
  {c:'CHEM 267L',n:'Organic Chemistry Laboratory'},
  {c:'CHEM 310L',n:'Inorganic Chemistry Laboratory 2'},
  {c:'CHEM 313L',n:'Inorganic Chemistry Laboratory 1'},
  {c:'CHEM 360L',n:'Senior Organic Chemistry Laboratory'},
  {c:'EARTH 121L',n:'Introductory Earth Sciences Laboratory'},
  {c:'EARTH 122L',n:'Introductory Environmental Sciences Laboratory'},
  {c:'EARTH 458L',n:'Field Methods in Hydrogeology'},
];

/* ── Credits ─────────────────────────────────────────────────
   Default course = 0.5 credits. Lab (code ends in 'L') = 0.25. */
function courseCredits(text) {
  const m = /^\s*[A-Za-z]{2,6}\s*\d{1,3}([A-Za-z]?)/.exec(text || '');
  return (m && m[1].toUpperCase() === 'L') ? 0.25 : 0.5;
}
function fmtCredits(c) { return String(+c.toFixed(2)); } // 0.5, 0.25, 3, 2.75 …

/* ── Search panel ────────────────────────────────────────── */

function toggleSearch() {
  const panel = document.getElementById('search-panel');
  const isOpen = panel.classList.toggle('open');
  if (isOpen) {
    document.getElementById('search-q').focus();
    runSearch(document.getElementById('search-q').value);
  }
}

function runSearch(q) {
  const out = document.getElementById('sp-results');
  q = q.trim().toLowerCase();

  if (!q) {
    out.innerHTML = '<p class="sp-hint">Search for any UW course.<br>Click to add as a bubble, or drag straight onto a semester.</p>';
    return;
  }

  const hits = UW_COURSES.filter(r =>
    r.c.toLowerCase().includes(q) || r.n.toLowerCase().includes(q)
  );

  if (!hits.length) {
    out.innerHTML = '<p class="sp-hint">No courses found.</p>';
    return;
  }

  out.innerHTML = `<p class="sp-count">${hits.length} result${hits.length !== 1 ? 's' : ''}</p>`;
  hits.forEach(r => {
    const fullName = r.c + ' – ' + r.n;
    const item = mk('div', 'sp-item');
    const codeRow = mk('div', 'sp-item-coderow');
    codeRow.appendChild(mk('span', 'sp-item-code', r.c));
    codeRow.appendChild(mk('span', 'sp-item-credits', fmtCredits(courseCredits(r.c)) + ' cr'));
    item.appendChild(codeRow);
    item.appendChild(mk('div', 'sp-item-name', r.n));

    // Click → drop as bubble near centre of view
    item.addEventListener('click', () => {
      const ws = document.getElementById('workspace');
      const canvas = document.getElementById('canvas');
      const cr = canvas.getBoundingClientRect();
      const x = -cr.left + ws.clientWidth  / 2 - 80 + (Math.random() - .5) * 120;
      const y = -cr.top  + ws.clientHeight / 2 - 20 + (Math.random() - .5) * 80;
      buildBubble(fullName, nextColor(), Math.max(0, x), Math.max(0, y));
    });

    // Press-and-drag onto a semester; a plain tap/click adds it centred (see above).
    // Uses the movement threshold so a tap still fires the click handler (no double-add).
    item.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      pendingDrag = { kind: 'search', name: fullName, ox: 20, oy: 16, startX: e.clientX, startY: e.clientY };
    });

    out.appendChild(item);
  });
}

/* ── Reset ───────────────────────────────────────────────── */

function resetAll() {
  if (!confirm('Remove all course cards and floating bubbles?')) return;
  document.querySelectorAll('.course-card, .bubble').forEach(el => el.remove());
}

/* ── Util ────────────────────────────────────────────────── */

function mk(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls)  el.className   = cls;
  if (text !== undefined) el.textContent = text;
  return el;
}

/* ── Boot ────────────────────────────────────────────────── */

init();
