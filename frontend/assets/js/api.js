const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:8000/api'
  : 'https://stok-pangan-cerdas-production.up.railway.app/api';

const TOKEN_KEY = 'spc_token';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
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

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    ...options,
  });

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

  return body?.data ?? body;
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

function fetchVouchers(filters = {}) {
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
