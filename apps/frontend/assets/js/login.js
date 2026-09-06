/**
 * Login Controller
 * Part of Clean Architecture refactor for Stok Pangan Cerdas
 */

const el = {
  form: document.getElementById('form-login'),
  email: document.getElementById('input-email'),
  password: document.getElementById('input-password'),
  error: document.getElementById('login-error'),
  submit: document.getElementById('btn-login'),
  statusGudang: document.getElementById('status-gudang'),
  statusTotalBarang: document.getElementById('status-total-barang'),
  statusBarisContainer: document.getElementById('status-baris-container'),
};

const STATUS_LABEL = { kritis: 'Kritis', berisiko: 'Berisiko', aman: 'Aman' };
const STATUS_BAR_PCT = { kritis: 92, berisiko: 64, aman: 28 };

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function formatSisaHari(sisaHari) {
  if (sisaHari < 0) return `lewat ${Math.abs(sisaHari)} hari`;
  if (sisaHari === 0) return 'hari ini';
  return `sisa ${sisaHari} hari`;
}

function renderBarisStatus(item) {
  const statusKey = STATUS_LABEL[item.status] ? item.status : 'aman';
  const pct = STATUS_BAR_PCT[statusKey];
  return `
    <div class="baris">
      <div>
        <div class="nama-brg">${esc(item.nama)}</div>
        <div class="ket">${esc(item.kategori)} · ${esc(item.jumlah_stok)} · ${formatSisaHari(item.sisa_hari)}</div>
      </div>
      <span class="pil ${statusKey}"><i></i>${STATUS_LABEL[statusKey]}</span>
      <div class="bar"><span style="width:${pct}%;background:var(--${statusKey === 'berisiko' ? 'risiko' : statusKey})"></span></div>
    </div>
  `;
}

/**
 * Kartu "Pantauan Gudang" tidak boleh mengganggu login sama sekali --
 * kalau backend mati atau permintaan gagal, kartu disembunyikan (keadaan
 * tenang, bukan pesan error merah) dan form login tetap berfungsi penuh.
 */
async function loadRingkasanPublik() {
  if (!el.statusGudang) return;

  try {
    const ringkasan = await fetchRingkasanPublik();
    const sorotan = ringkasan?.sorotan || [];

    if (sorotan.length === 0) {
      el.statusGudang.classList.add('hidden');
      return;
    }

    if (el.statusTotalBarang) {
      el.statusTotalBarang.textContent = `${ringkasan.total_barang} BARANG`;
    }
    if (el.statusBarisContainer) {
      el.statusBarisContainer.innerHTML = sorotan.map(renderBarisStatus).join('');
    }
  } catch (err) {
    el.statusGudang.classList.add('hidden');
  }
}

/**
 * Redirects to dashboard if a valid session exists.
 */
async function checkAuth() {
  const token = getToken();
  if (!token) return;

  try {
    // Verify token with backend
    await fetchMe();
    window.location.href = 'index.html';
  } catch (err) {
    // Token expired or invalid
    console.warn("Session invalid, clearing token.");
    clearToken();
  }
}

/**
 * Handles the login form submission.
 */
async function handleLogin(e) {
  e.preventDefault();

  const email = el.email.value.trim();
  const password = el.password.value;

  if (!email || !password) return;

  el.error.classList.add('hidden');
  el.submit.disabled = true;
  el.submit.textContent = 'Memproses...';

  try {
    await login(email, password);
    window.location.href = 'index.html';
  } catch (err) {
    el.error.textContent = err.message || 'Gagal masuk. Periksa email dan kata sandi.';
    el.error.classList.remove('hidden');
    el.submit.disabled = false;
    el.submit.textContent = 'Masuk';
  }
}

/**
 * Initialize Login Page
 */
function init() {
  checkAuth();
  loadRingkasanPublik();

  if (el.form) {
    el.form.addEventListener('submit', handleLogin);
  }
}

// Start the app
init();
