import { Game, cardAttrs, findTrios } from './logic.js';

const $ = (id) => document.getElementById(id);
const boardEl = $('board');
const HINT_PENALTY = 15_000;
const BEST_KEY = 'trio-best-ms';

const COLOR_NAMES = [['rød', 'røde'], ['grønn', 'grønne'], ['blå', 'blå']];
const SHAPE_NAMES = [['sirkel', 'sirkler'], ['trekant', 'trekanter'], ['firkant', 'firkanter']];
const FILL_NAMES = [['fylt', 'fylte'], ['stripet', 'stripete'], ['tom', 'tomme']];

let game, selected, hintLevel, busy;
let elapsed = 0, startedAt = null, penalty = 0, hintsUsed = 0;

// ---------- Kort-tegning ----------

function shapeSvg(shape, cx, cy, s, paint, stroke) {
  const h = s / 2;
  const common = `fill="${paint}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"`;
  if (shape === 0) return `<circle cx="${cx}" cy="${cy}" r="${h - 1}" ${common}/>`;
  if (shape === 1) {
    const top = cy - h + 1, bot = cy + h - 3;
    return `<path d="M${cx} ${top} L${cx + h} ${bot} L${cx - h} ${bot} Z" ${common}/>`;
  }
  const q = h - 3;
  return `<rect x="${cx - q}" y="${cy - q}" width="${2 * q}" height="${2 * q}" rx="3" ${common}/>`;
}

function cardSvg(id) {
  const a = cardAttrs(id);
  const color = `var(--c${a.color})`;
  const paint = a.fill === 0 ? color : a.fill === 1 ? `url(#stripes-${a.color})` : 'none';
  const n = a.count + 1, s = 38, gap = 8;
  const total = n * s + (n - 1) * gap;
  let x = 75 - total / 2 + s / 2;
  let out = '';
  for (let i = 0; i < n; i++, x += s + gap) out += shapeSvg(a.shape, x, 50, s, paint, color);
  return `<svg viewBox="-6 14 162 72" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${out}</svg>`;
}

function cardLabel(id) {
  const a = cardAttrs(id);
  const n = a.count + 1;
  const p = n > 1 ? 1 : 0;
  return `${n} ${FILL_NAMES[a.fill][p]} ${COLOR_NAMES[a.color][p]} ${SHAPE_NAMES[a.shape][p]}`;
}

function makeCard(id, i) {
  const el = document.createElement('button');
  el.className = 'card';
  el.dataset.index = i;
  el.innerHTML = cardSvg(id);
  el.setAttribute('aria-label', cardLabel(id));
  return el;
}

// ---------- Layout ----------

function layout() {
  const n = game.board.length;
  const style = getComputedStyle(boardEl);
  const W = boardEl.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  const H = boardEl.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
  const gap = 8;
  let best = null;
  for (let cols = 2; cols <= 7; cols++) {
    const rows = Math.ceil(n / cols);
    let w = (W - gap * (cols - 1)) / cols;
    let h = (H - gap * (rows - 1)) / rows;
    if (w / h > 1.7) w = h * 1.7;
    if (w / h < 1.05) h = w / 1.05;
    const score = w * h - (n % cols ? 1 : 0); // foretrekk fulle rader ved likt
    if (!best || score > best.score + 1) best = { cols, w, h, score };
  }
  boardEl.style.gridTemplateColumns = `repeat(${best.cols}, ${Math.floor(best.w)}px)`;
  boardEl.style.gridAutoRows = `${Math.floor(best.h)}px`;
  document.documentElement.style.setProperty('--radius', `${Math.max(8, Math.min(16, best.h * 0.12))}px`);
}

// ---------- Rendering ----------

function render() {
  boardEl.replaceChildren(...game.board.map(makeCard));
  layout();
  updateStats();
}

function updateStats() {
  $('found').textContent = game.found;
  $('deck').textContent = game.deck.length;
}

function cardEl(i) { return boardEl.children[i]; }

function toast(msg, ms = 1800) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), ms);
}

const buzz = (p) => { try { navigator.vibrate?.(p); } catch {} };

// ---------- Tid ----------

function now() { return elapsed + penalty + (startedAt ? performance.now() - startedAt : 0); }
function fmt(ms) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
function pause() { if (startedAt) { elapsed += performance.now() - startedAt; startedAt = null; } }
function resume() { if (!startedAt && game && !game.over && !anyDialogOpen()) startedAt = performance.now(); }
function anyDialogOpen() { return $('rules').open || $('done').open; }
setInterval(() => { $('time').textContent = fmt(now()); }, 250);

// ---------- Spillflyt ----------

function newGame() {
  game = new Game();
  selected = new Set();
  hintLevel = 0; busy = false;
  elapsed = 0; penalty = 0; hintsUsed = 0; startedAt = null;
  render();
  resume();
}

function clearHints() {
  hintLevel = 0;
  boardEl.querySelectorAll('.hint').forEach((e) => e.classList.remove('hint'));
}

function onTap(i) {
  if (busy) return;
  const el = cardEl(i);
  if (selected.has(i)) { selected.delete(i); el.classList.remove('selected'); return; }
  selected.add(i);
  el.classList.add('selected');
  buzz(8);
  if (selected.size === 3) check();
}

function check() {
  const idx = [...selected];
  const els = idx.map(cardEl);
  busy = true;
  els.forEach((e) => e.classList.remove('selected'));
  const before = game.board.length;
  const { ok, added } = game.take(idx);
  if (!ok) {
    els.forEach((e) => e.classList.add('bad'));
    buzz([30, 40, 30]);
    toast('Ikke en trio');
    setTimeout(() => { els.forEach((e) => e.classList.remove('bad')); selected.clear(); busy = false; }, 380);
    return;
  }
  els.forEach((e) => e.classList.add('good'));
  buzz(20);
  setTimeout(() => {
    selected.clear(); busy = false; clearHints();
    if (game.board.length === before && !added) {
      // Erstatt bare de tre kortene, så resten av bordet står stille
      for (const i of idx) cardEl(i).replaceWith(makeCard(game.board[i], i));
      updateStats();
    } else {
      render();
    }
    if (added) toast(`Ingen trio – ${added} nye kort lagt ut`);
    else toast(['Bra!', 'Trio!', 'Flott!', 'Riktig!'][game.found % 4], 900);
    if (game.over) finish();
  }, 360);
}

function hint() {
  if (busy || game.over) return;
  const trios = findTrios(game.board);
  if (!trios.length) return;
  // Bruk trioen som inneholder flest av de allerede hintede kortene
  const shown = [...boardEl.querySelectorAll('.hint')].map((e) => +e.dataset.index);
  const trio = trios.find((t) => shown.every((s) => t.includes(s))) ?? trios[0];
  if (hintLevel >= 2) { toast('Finn det tredje kortet selv 😉'); return; }
  if (shown.length === 0) hintLevel = 0;
  const pick = trio.filter((t) => !shown.includes(t))[0];
  cardEl(pick).classList.add('hint');
  hintLevel++;
  hintsUsed++;
  penalty += HINT_PENALTY;
  toast('+15 sekunder');
}

function finish() {
  pause();
  const ms = now();
  let best = null;
  try { best = Number(localStorage.getItem(BEST_KEY)) || null; } catch {}
  const isBest = !best || ms < best;
  if (isBest) { try { localStorage.setItem(BEST_KEY, String(ms)); } catch {} }
  $('doneText').textContent = `Du fant ${game.found} trioer på ${fmt(ms)}` +
    (hintsUsed ? ` (inkludert ${hintsUsed} hint).` : ' – uten hint!');
  $('bestText').textContent = isBest ? 'Ny personlig rekord på denne enheten 🎉' : `Rekord: ${fmt(best)}`;
  setTimeout(() => $('done').showModal(), 450);
}

// ---------- Hendelser ----------

boardEl.addEventListener('click', (e) => {
  const card = e.target.closest('.card');
  if (card) onTap(+card.dataset.index);
});
$('hintBtn').addEventListener('click', hint);
$('newBtn').addEventListener('click', () => {
  if (game.found > 0 && !game.over && !confirm('Starte et nytt spill?')) return;
  newGame();
});
$('helpBtn').addEventListener('click', () => { pause(); $('rules').showModal(); });
$('rules').addEventListener('close', resume);
$('done').addEventListener('close', newGame);
document.addEventListener('visibilitychange', () => (document.hidden ? pause() : resume()));
window.addEventListener('resize', () => game && layout());

// Eksempler i reglene
for (const [el, ids] of [['exOk', [0, 31, 62]], ['exBad', [9, 13, 44]]]) {
  $(el).replaceChildren(...ids.map((id) => {
    const d = document.createElement('div');
    d.className = 'card';
    d.innerHTML = cardSvg(id);
    return d;
  }));
}

newGame();
let seen = false;
try { seen = localStorage.getItem('trio-seen-rules') === '1'; localStorage.setItem('trio-seen-rules', '1'); } catch {}
if (!seen) { pause(); $('rules').showModal(); }

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
