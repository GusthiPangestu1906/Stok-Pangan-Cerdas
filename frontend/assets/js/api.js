const DEFAULT_API_BASE_URL = 'https://stok-pangan-cerdas-backend.onrender.com/api';
const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://127.0.0.1:8000/api'
  : (window.SPC_CONFIG?.API_BASE_URL || localStorage.getItem('spc_api_base_url') || DEFAULT_API_BASE_URL);

const TOKEN_KEY = 'spc_token';
const CACHE_PREFIX = 'spc_cache_';
const MAX_TIMEOUT_MS = 15000; // Batas timeout 15 detik agar antrean request lokal tidak terputus

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function getCache(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data } = JSON.parse(raw);
    return data;
  } catch (e) {
    return null;
  }
}

function setCache(key, data) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {}
}

function redirectToLogin() {
  clearToken();
  if (!window.location.pathname.endsWith('login.html')) {
    window.location.href = 'login.html';
  }
}

async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const isGet = !options.method || options.method.toUpperCase() === 'GET';
  const cacheKey = path;

  // Batasi waktu maksimal request ke server hanya 3 detik
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), MAX_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers,
      signal: controller.signal,
      ...options,
    });
    clearTimeout(timeoutId);

    if (response.status === 401) {
      redirectToLogin();
      throw new Error('Sesi berakhir, silakan login kembali.');
    }

    if (response.status === 204) return null;

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      const message = body?.message || `Permintaan gagal (HTTP ${response.status})`;
      throw new Error(message);
    }

    const result = body?.data ?? body;
    if (isGet && result) {
      setCache(cacheKey, result);
    }
    return result;
  } catch (err) {
    clearTimeout(timeoutId);

    // Jika terjadi timeout atau offline, otomatis fallback ke cache data sebelumnya
    if (isGet) {
      const cached = getCache(cacheKey);
      if (cached) {
        console.warn(`[API] Memuat cache cepat untuk ${path} karena request memakan waktu.`);
        return cached;
      }
    }

    if (err.name === 'AbortError') {
      throw new Error('Koneksi server terputus / timeout. Silakan periksa koneksi backend.');
    }

    throw err;
  }
}

// ---------- Auth ----------

async function login(email, password) {
  const data = await apiRequest('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data.user;
}

async function logout() {
  try {
    await apiRequest('/logout', { method: 'POST' });
  } finally {
    clearToken();
  }
}

function fetchMe() {
  return apiRequest('/me');
}

// ---------- Ringkasan Publik (halaman login, tanpa token) ----------

function fetchRingkasanPublik() {
  return apiRequest('/ringkasan-publik');
}

// ---------- Items ----------

async function fetchItems(filters = {}) {
  const params = new URLSearchParams();
  if (filters.kategori) params.set('kategori', filters.kategori);
  if (filters.status) params.set('status', filters.status);

  const query = params.toString();
  return apiRequest(`/items${query ? `?${query}` : ''}`);
}

function createItem(payload) {
  return apiRequest('/items', { method: 'POST', body: JSON.stringify(payload) });
}

function updateItem(id, payload) {
  return apiRequest(`/items/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

function deleteItem(id) {
  return apiRequest(`/items/${id}`, { method: 'DELETE' });
}

// ---------- Rekomendasi (AI Insight) ----------

function fetchRekomendasi() {
  return apiRequest('/rekomendasi');
}

function generateRekomendasi(itemId) {
  return apiRequest(`/items/${itemId}/rekomendasi`, { method: 'POST' });
}

function terapkanRekomendasi(rekomendasiId) {
  return apiRequest(`/rekomendasi/${rekomendasiId}/terapkan`, { method: 'PATCH' });
}

// ---------- Riwayat ----------

function fetchRiwayat() {
  return apiRequest('/riwayat');
}

function fetchStatistikRiwayat() {
  return apiRequest('/riwayat/statistik');
}

// ---------- Vouchers ----------

async function fetchVouchers(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  const query = params.toString();
  return apiRequest(`/vouchers${query ? `?${query}` : ''}`);
}

function createVoucher(payload) {
  return apiRequest('/vouchers', { method: 'POST', body: JSON.stringify(payload) });
}

function validasiVoucher(kode, totalBelanja = null) {
  return apiRequest('/vouchers/validasi', {
    method: 'POST',
    body: JSON.stringify({ kode, total_belanja: totalBelanja }),
  });
}

function klaimVoucher(voucherId, totalBelanja = null) {
  return apiRequest(`/vouchers/${voucherId}/klaim`, {
    method: 'POST',
    body: JSON.stringify({ total_belanja: totalBelanja }),
  });
}
