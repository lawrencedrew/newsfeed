const state = {
  items: [],
  filtered: [],
  selected: 0,
  filter: '',
  hidden: new Set(),
};

const feed = document.getElementById('feed');
const preview = document.getElementById('preview-content');
const filterInput = document.getElementById('filter');
const clockEl = document.getElementById('clock');
const breakingBar = document.getElementById('breaking-bar');
const breakingText = document.getElementById('breaking-text');

// --- Clock ---
function updateClock() {
  clockEl.textContent = new Date().toUTCString().slice(17, 25) + ' GMT';
}
setInterval(updateClock, 1000);
updateClock();

// --- Breaking bar ---
function isBreaking(item) {
  return item.breaking || (item.title && item.title.toLowerCase().includes('breaking'));
}

let breakingItems = [];
let breakingIdx = 0;
function rotateBreaking() {
  if (!breakingItems.length) { breakingBar.classList.add('hidden'); return; }
  breakingBar.classList.remove('hidden');
  const item = breakingItems[breakingIdx % breakingItems.length];
  breakingText.textContent = `${item.title} · ${item.meta || ''}`;
  breakingIdx++;
}
setInterval(rotateBreaking, 5000);

// --- SSE ---
const es = new EventSource('/stream');
es.onmessage = e => {
  const msg = JSON.parse(e.data);
  if (msg.type === 'snapshot') {
    state.items = msg.items;
    applyFilter();
    renderFeed();
  } else if (msg.type === 'item') {
    state.items.unshift(msg.item);
    if (isBreaking(msg.item)) { breakingItems.unshift(msg.item); rotateBreaking(); }
    applyFilter();
    renderFeed();
  }
};

// --- Filter ---
function applyFilter() {
  const q = state.filter.toLowerCase();
  state.filtered = state.items.filter(item => {
    if (state.hidden.has(item.source)) return false;
    if (!q) return true;
    return item.title.toLowerCase().includes(q) || (item.meta || '').toLowerCase().includes(q);
  });
}

filterInput.addEventListener('input', () => {
  state.filter = filterInput.value;
  state.selected = 0;
  applyFilter();
  renderFeed();
});

// --- Source toggles ---
document.querySelectorAll('.source-toggle').forEach(el => {
  el.addEventListener('click', () => {
    const src = el.dataset.source;
    if (state.hidden.has(src)) { state.hidden.delete(src); el.classList.remove('off'); }
    else { state.hidden.add(src); el.classList.add('off'); }
    state.selected = 0;
    applyFilter();
    renderFeed();
  });
});

// --- Render ---
function formatTime(ts) {
  const d = new Date(ts);
  return d.toUTCString().slice(17, 22);
}

function tagClass(source) {
  return { rss: 'rss', hn: 'hn', reddit: 'reddit', nitter: 'nitter' }[source] || 'rss';
}

function renderFeed() {
  feed.innerHTML = '';
  breakingItems = state.filtered.filter(isBreaking);

  state.filtered.forEach((item, idx) => {
    const el = document.createElement('div');
    el.className = 'feed-item' + (isBreaking(item) ? ' breaking' : '') + (idx === state.selected ? ' selected' : '');
    el.innerHTML = `
      <span class="item-tag ${tagClass(item.source)}">${escHtml(item.tag)}</span>
      <span class="item-title">${escHtml(item.title)}</span>
      <span class="item-meta">${escHtml(item.meta || '')}</span>
      <span class="item-time">${formatTime(item.timestamp)}</span>
    `;
    el.addEventListener('click', () => { state.selected = idx; renderFeed(); showPreview(item); });
    feed.appendChild(el);
  });

  const sel = feed.querySelector('.selected');
  if (sel) sel.scrollIntoView({ block: 'nearest' });
  showPreview(state.filtered[state.selected]);
}

function showPreview(item) {
  if (!item) {
    preview.innerHTML = '<span class="hint">j/k navigate · Enter preview · o open · f filter · r refresh</span>';
    return;
  }
  preview.innerHTML = `
    <h2>${escHtml(item.title)}</h2>
    <div class="preview-meta">${escHtml(item.tag)} · ${formatTime(item.timestamp)} · ${escHtml(item.meta || '')}</div>
    <div class="preview-url">${escHtml(item.url)}</div>
    <div class="open-hint">Press <b>o</b> to open in browser</div>
  `;
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// --- Keyboard nav ---
document.addEventListener('keydown', e => {
  if (e.target === filterInput && e.key !== 'Escape') return;
  const n = state.filtered.length;
  switch (e.key) {
    case 'j': case 'ArrowDown':
      e.preventDefault();
      state.selected = Math.min(state.selected + 1, n - 1);
      renderFeed();
      break;
    case 'k': case 'ArrowUp':
      e.preventDefault();
      state.selected = Math.max(state.selected - 1, 0);
      renderFeed();
      break;
    case 'Enter':
      showPreview(state.filtered[state.selected]);
      break;
    case 'o': {
      const item = state.filtered[state.selected];
      if (item) window.open(item.url, '_blank');
      break;
    }
    case 'f':
      e.preventDefault();
      filterInput.focus();
      break;
    case 'Escape':
      filterInput.blur();
      break;
    case 'r':
      fetch('/refresh').then(() => console.log('refreshed'));
      break;
  }
});
