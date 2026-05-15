// API key disimpan di server (api/weather.js) — tidak perlu di sini

// ── STATE ────────────────────────────────────────────────────
// Map: cityKey (lowercase) -> { data, cardEl, interval, refreshInterval, lastFetched }
const cityMap = new Map();

// ── DOM REFERENCES ───────────────────────────────────────────
const cityInput   = document.getElementById('cityInput');
const addBtn      = document.getElementById('addBtn');
const grid        = document.getElementById('citiesGrid');
const emptyState  = document.getElementById('emptyState');
const statCount   = document.getElementById('statCount');
const statUpdated = document.getElementById('statUpdated');
const toastEl     = document.getElementById('toast');

// ── LOCALSTORAGE ─────────────────────────────────────────────
const STORAGE_KEY = 'weatherDashboard_cities';

function saveCities() {
  // Simpan daftar nama kota (pakai nama asli dari API, bukan key lowercase)
  const names = [...cityMap.values()].map(e => e.data.location.name);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
}

function loadSavedCities() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

// ── TOAST ────────────────────────────────────────────────────
let toastTimer;

function showToast(msg) {
  toastEl.textContent = '❌ ' + msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3500);
}

// ── ADD CITY ─────────────────────────────────────────────────
async function addCity(cityName) {
  const key = cityName.trim().toLowerCase();
  if (!key || key.length < 2) {
    showToast('Nama kota minimal 2 karakter.');
    return;
  }
  if (cityMap.has(key)) {
    showToast(`"${cityName}" sudah ada di dashboard.`);
    return;
  }

  // Tampilkan skeleton sementara data dimuat
  const skeletonEl = createSkeleton(key);
  emptyState.style.display = 'none';
  grid.appendChild(skeletonEl);

  try {
    const res  = await fetch(`/api/weather?city=${encodeURIComponent(cityName)}`);
    const data = await res.json();

    if (data.error) throw new Error(data.error.message);

    skeletonEl.remove();
    mountCard(key, data);
    saveCities(); // simpan ke localStorage
    updateStats();

  } catch (err) {
    skeletonEl.remove();
    if (cityMap.size === 0) emptyState.style.display = '';
    showToast(
      !navigator.onLine
        ? 'Tidak ada koneksi internet.'
        : err.message || 'Kota tidak ditemukan.'
    );
  }
}

// ── MOUNT CARD ───────────────────────────────────────────────
function mountCard(key, data) {
  const card = buildCardEl(data);
  grid.appendChild(card);

  // Tick setiap detik → update jam lokal kota
  const interval = setInterval(() => tickClock(card), 1000);

  cityMap.set(key, { data, cardEl: card, interval, lastFetched: new Date() });

  // Auto-refresh data cuaca setiap 5 menit
  const refreshInterval = setInterval(() => refreshCity(key), 5 * 60 * 1000);
  cityMap.get(key).refreshInterval = refreshInterval;
}

// ── BUILD CARD ELEMENT ───────────────────────────────────────
function buildCardEl(data) {
  const { location, current } = data;
  const card = document.createElement('div');
  card.className = 'weather-card ' + getConditionClass(current.condition.text);

  const localDt = new Date(location.localtime.replace(' ', 'T'));

  card.innerHTML = `
    <div class="card-top">
      <div class="city-info">
        <div class="city-name">${location.name}</div>
        <div class="country">${location.region ? location.region + ', ' : ''}${location.country}</div>
        <div class="local-time">${formatTime(localDt)}</div>
        <div class="local-date">${formatDate(localDt)}</div>
      </div>
      <div class="card-icon-wrap">
        <img src="https:${current.condition.icon}" alt="${current.condition.text}">
      </div>
    </div>

    <div class="temp-row">
      <span class="temp-main">${Math.round(current.temp_c)}</span>
      <span class="temp-unit">°C</span>
    </div>
    <div class="temp-feels">Terasa seperti ${Math.round(current.feelslike_c)}°C</div>
    <div class="condition-text">${current.condition.text}</div>

    <div class="detail-row">
      <div class="detail-pill">
        <span class="d-label">💧 Kelembaban</span>
        <span class="d-value">${current.humidity}%</span>
      </div>
      <div class="detail-pill">
        <span class="d-label">💨 Angin</span>
        <span class="d-value">${current.wind_kph} km/h</span>
      </div>
      <div class="detail-pill">
        <span class="d-label">👁️ Pandang</span>
        <span class="d-value">${current.vis_km} km</span>
      </div>
    </div>

    <div class="card-footer">

      <button class="btn-delete" title="Hapus kota">✕</button>
    </div>
  `;

  card.querySelector('.btn-delete').addEventListener('click', () => removeCity(card));
  return card;
}

// ── TICK CLOCK ───────────────────────────────────────────────
function tickClock(card) {
  const timeEl = card.querySelector('.local-time');
  const dateEl = card.querySelector('.local-date');
  if (!timeEl) return;

  // Cari entry di cityMap berdasarkan referensi card
  const entry = [...cityMap.values()].find(e => e.cardEl === card);
  if (!entry) return;

  // Hitung waktu lokal: waktu API saat fetch + selisih waktu nyata
  const elapsed      = Date.now() - entry.lastFetched.getTime();
  const apiLocalTime = new Date(entry.data.location.localtime.replace(' ', 'T'));
  const nowLocal     = new Date(apiLocalTime.getTime() + elapsed);

  timeEl.textContent = formatTime(nowLocal);
  dateEl.textContent = formatDate(nowLocal);
}

// ── REFRESH WEATHER DATA ─────────────────────────────────────
async function refreshCity(key) {
  const entry = cityMap.get(key);
  if (!entry) return;

  try {
    const cityName = entry.data.location.name;
    const res  = await fetch(`/api/weather?city=${encodeURIComponent(cityName)}`);
    const data = await res.json();
    if (data.error) return;

    // Perbarui state
    entry.data        = data;
    entry.lastFetched = new Date();

    // Perbarui elemen cuaca di kartu (jam sudah dihandle tickClock)
    const card = entry.cardEl;
    card.querySelector('.temp-main').textContent      = Math.round(data.current.temp_c);
    card.querySelector('.temp-feels').textContent     = `Terasa seperti ${Math.round(data.current.feelslike_c)}°C`;
    card.querySelector('.condition-text').textContent = data.current.condition.text;
    card.querySelector('.card-icon-wrap img').src     = 'https:' + data.current.condition.icon;

    const pills = card.querySelectorAll('.d-value');
    pills[0].textContent = data.current.humidity + '%';
    pills[1].textContent = data.current.wind_kph + ' km/h';
    pills[2].textContent = data.current.vis_km + ' km';

    card.className = 'weather-card ' + getConditionClass(data.current.condition.text);
    updateStats();

  } catch (_) { /* Gagal refresh: abaikan, coba lagi 5 menit kemudian */ }
}

// ── REMOVE CITY ──────────────────────────────────────────────
function removeCity(card) {
  let foundKey;
  for (const [k, v] of cityMap) {
    if (v.cardEl === card) { foundKey = k; break; }
  }
  if (!foundKey) return;

  const entry = cityMap.get(foundKey);
  clearInterval(entry.interval);
  clearInterval(entry.refreshInterval);
  cityMap.delete(foundKey);
  saveCities(); // perbarui localStorage setelah hapus

  card.classList.add('removing');
  card.addEventListener('animationend', () => {
    card.remove();
    if (cityMap.size === 0) emptyState.style.display = '';
    updateStats();
  }, { once: true });
}

// ── SKELETON ─────────────────────────────────────────────────
function createSkeleton(key) {
  const el = document.createElement('div');
  el.className = 'skeleton-card';
  el.dataset.skeletonKey = key;
  el.innerHTML = `
    <div class="skel skel-title"></div>
    <div class="skel skel-sub"></div>
    <div class="skel skel-temp"></div>
    <div class="skel skel-cond"></div>
    <div class="skel-grid">
      <div class="skel skel-pill"></div>
      <div class="skel skel-pill"></div>
      <div class="skel skel-pill"></div>
    </div>
  `;
  return el;
}

// ── HELPER FUNCTIONS ─────────────────────────────────────────
function formatTime(d) {
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', hour12: false
  });
}

function formatDate(d) {
  return d.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

function getConditionClass(text) {
  const t = text.toLowerCase();
  if (t.includes('sunny') || t.includes('cerah')) return 'is-sunny';
  if (t.includes('rain') || t.includes('hujan') || t.includes('drizzle')) return 'is-rain';
  return '';
}

function updateStats() {
  statCount.textContent = cityMap.size;
  const now = new Date();
  statUpdated.textContent = now.toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

// ── EVENT LISTENERS ──────────────────────────────────────────
addBtn.addEventListener('click', () => {
  const val = cityInput.value.trim();
  if (val) { addCity(val); cityInput.value = ''; }
  else cityInput.focus();
});

cityInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') addBtn.click();
});

// ── BOOT ─────────────────────────────────────────────────────
// Jika ada data tersimpan di localStorage → muat itu
// Jika belum pernah buka → gunakan default (Jakarta saja)
(async () => {
  const saved = loadSavedCities();
  const citiesToLoad = (saved && saved.length > 0) ? saved : ['Jakarta'];
  for (const city of citiesToLoad) {
    await addCity(city);
  }
})();