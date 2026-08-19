// Pastikan user sudah login
if (!getToken()) {
  window.location.href = 'login.html';
}

function formatTanggalWaktu(dateString) {
  const d = new Date(dateString);
  const tanggal = `${d.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][d.getMonth()]} ${d.getFullYear()}`;
  const waktu = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${tanggal}, ${waktu}`;
}

const el = {
  loading: document.getElementById('state-loading'),
  error: document.getElementById('state-error'),
  empty: document.getElementById('state-empty'),
  container: document.getElementById('riwayat-container'),
  tableBody: document.getElementById('riwayat-table-body'),
  cards: document.getElementById('riwayat-cards'),
  statTotal: document.getElementById('stat-total'),
  statSelamat: document.getElementById('stat-selamat'),
  statSelamatUnit: document.getElementById('stat-selamat-unit'),
  statBuang: document.getElementById('stat-buang'),
  statBuangUnit: document.getElementById('stat-buang-unit'),
  statPersen: document.getElementById('stat-persen'),
  chartPenyelamatan: document.getElementById('chart-penyelamatan'),
  chartPenyelamatanPct: document.getElementById('chart-penyelamatan-pct'),
  legendSelamat: document.getElementById('legend-selamat'),
  legendBuang: document.getElementById('legend-buang'),
  chartTren: document.getElementById('chart-tren'),
  perJenisChips: document.getElementById('per-jenis-chips'),
  riwayatSearch: document.getElementById('riwayat-search'),
  riwayatFilterTabs: document.getElementById('riwayat-filter-tabs'),
  userName: document.getElementById('user-name'),
  btnLogout: document.getElementById('btn-logout'),
};

let cachedStatistik = null;
let cachedRiwayat = [];
let activeDampakFilter = 'semua';
let searchKeyword = '';

const JENIS_TERSELAMATKAN = ['Diskon', 'Distribusi', 'Bundling', 'Olah Kembali'];

function aggregateTrendData(riwayatList) {
  if (!riwayatList || riwayatList.length === 0) {
    return { labels: [], dataSelamat: [], totalUnitSelamat: 0 };
  }

  // Sort kronologis berdasarkan diterapkan_at
  const sorted = [...riwayatList].sort((a, b) => new Date(a.diterapkan_at) - new Date(b.diterapkan_at));

  const dateMap = {};
  sorted.forEach((r) => {
    const d = new Date(r.diterapkan_at);
    const dateKey = `${d.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][d.getMonth()]}`;

    if (!dateMap[dateKey]) {
      dateMap[dateKey] = { label: dateKey, unitSelamat: 0, count: 0 };
    }

    const stok = Number(r.jumlah_stok_saat_dibuat ?? r.item?.jumlah_stok ?? 0);
    if (JENIS_TERSELAMATKAN.includes(r.jenis_saran)) {
      dateMap[dateKey].unitSelamat += stok;
    }
    dateMap[dateKey].count += 1;
  });

  const labels = Object.keys(dateMap);
  const dataSelamat = labels.map((k) => dateMap[k].unitSelamat);

  return { labels, dataSelamat };
}

function renderCharts(statistik, riwayatList = cachedRiwayat) {
  cachedStatistik = statistik;
  if (riwayatList && riwayatList.length > 0) {
    cachedRiwayat = riwayatList;
  }

  const unitSelamat = Number(statistik.unit_terselamatkan || 0);
  const unitBuang = Number(statistik.unit_terbuang || 0);
  const totalUnit = unitSelamat + unitBuang;
  const persenPenyelamatan = totalUnit > 0
    ? Math.round((unitSelamat / totalUnit) * 100)
    : (statistik.jumlah_tindakan > 0 ? Math.round((statistik.jumlah_terselamatkan / statistik.jumlah_tindakan) * 100) : 0);

  if (el.chartPenyelamatanPct) {
    el.chartPenyelamatanPct.textContent = `${persenPenyelamatan}%`;
  }
  if (el.legendSelamat) {
    el.legendSelamat.textContent = `${unitSelamat} unit`;
  }
  if (el.legendBuang) {
    el.legendBuang.textContent = `${unitBuang} unit`;
  }

  // 1. Doughnut Chart: Rasio Penyelamatan vs Pembuangan
  // 2. Line Chart: Tren Penyelamatan Pangan per Hari
  requestAnimationFrame(() => {
    if (el.chartPenyelamatan) {
      drawDonutChart(el.chartPenyelamatan, unitSelamat, unitBuang);
    }
    if (el.chartTren) {
      const trendData = aggregateTrendData(cachedRiwayat);
      drawLineChart(el.chartTren, trendData);
    }
  });
}

function drawDonutChart(canvas, unitSelamat, unitBuang) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width > 0 ? rect.width : 200;
  const height = rect.height > 0 ? rect.height : 200;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 10;
  const innerRadius = radius * 0.72;
  const total = unitSelamat + unitBuang;

  ctx.clearRect(0, 0, width, height);

  if (total === 0) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.arc(centerX, centerY, innerRadius, 2 * Math.PI, 0, true);
    ctx.fillStyle = '#e2e8f0';
    ctx.fill();
    return;
  }

  const selamatAngle = (unitSelamat / total) * 2 * Math.PI;
  const startAngle = -Math.PI / 2;

  // Selamat arc (Emerald green)
  if (unitSelamat > 0) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + selamatAngle);
    ctx.arc(centerX, centerY, innerRadius, startAngle + selamatAngle, startAngle, true);
    ctx.fillStyle = '#10b981';
    ctx.fill();
  }

  // Buang arc (Rose red)
  if (unitBuang > 0) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle + selamatAngle, startAngle + 2 * Math.PI);
    ctx.arc(centerX, centerY, innerRadius, startAngle + 2 * Math.PI, startAngle + selamatAngle, true);
    ctx.fillStyle = '#f43f5e';
    ctx.fill();
  }
}

function drawLineChart(canvas, trendData) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width > 0 ? rect.width : 340;
  const height = rect.height > 0 ? rect.height : 200;
  const paddingLeft = 38;
  const paddingRight = 32;
  const paddingBottom = 30;
  const paddingTop = 26;
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingBottom - paddingTop;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  const labels = trendData.labels || [];
  const data = trendData.dataSelamat || [];

  if (labels.length === 0) {
    ctx.fillStyle = '#8a9a8f';
    ctx.font = "13px 'DM Sans', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('Belum ada riwayat tindakan diterapkan', width / 2, height / 2);
    return;
  }

  const maxVal = Math.max(...data, 10);

  // 1. Grid lines horizontal (dashed)
  const gridSteps = 3;
  ctx.strokeStyle = '#eef2ed';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);

  for (let i = 0; i <= gridSteps; i++) {
    const yVal = Math.round((maxVal / gridSteps) * i);
    const yPos = height - paddingBottom - (yVal / maxVal) * plotHeight;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, yPos);
    ctx.lineTo(width - paddingRight, yPos);
    ctx.stroke();

    // Y Axis label
    ctx.fillStyle = '#8a9a8f';
    ctx.font = "10.5px 'DM Sans', sans-serif";
    ctx.textAlign = 'right';
    ctx.setLineDash([]);
    ctx.fillText(`${yVal}`, paddingLeft - 8, yPos + 3.5);
    ctx.setLineDash([3, 3]);
  }
  ctx.setLineDash([]);

  // Calculate coordinates
  const points = labels.map((label, idx) => {
    const x = labels.length === 1
      ? paddingLeft + plotWidth / 2
      : paddingLeft + (idx / (labels.length - 1)) * plotWidth;
    const y = height - paddingBottom - (data[idx] / maxVal) * plotHeight;
    return { x, y, val: data[idx], label };
  });

  // 2. Gradient Area Fill
  if (points.length > 1) {
    const gradient = ctx.createLinearGradient(0, paddingTop, 0, height - paddingBottom);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.01)');

    ctx.beginPath();
    ctx.moveTo(points[0].x, height - paddingBottom);
    ctx.lineTo(points[0].x, points[0].y);

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      ctx.bezierCurveTo(cpX, p0.y, cpX, p1.y, p1.x, p1.y);
    }

    ctx.lineTo(points[points.length - 1].x, height - paddingBottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  // 3. Curved Stroke Line
  ctx.beginPath();
  if (points.length === 1) {
    ctx.arc(points[0].x, points[0].y, 4, 0, 2 * Math.PI);
  } else {
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      ctx.bezierCurveTo(cpX, p0.y, cpX, p1.y, p1.x, p1.y);
    }
  }
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2.75;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  // 4. Points & Value Pill Badges
  points.forEach((p) => {
    // Outer White Halo
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Value Pill Badge above point
    ctx.fillStyle = '#065f46';
    ctx.font = "bold 11px 'Space Grotesk', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(`${p.val} unit`, p.x, p.y - 8);

    // Date label below X axis
    ctx.fillStyle = '#5d6f63';
    ctx.font = "500 11px 'DM Sans', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(p.label, p.x, height - paddingBottom + 18);
  });
}

window.addEventListener('resize', () => {
  if (cachedStatistik) {
    renderCharts(cachedStatistik, cachedRiwayat);
  }
});

function renderStatistik(statistik) {
  el.statTotal.textContent = statistik.jumlah_tindakan;
  el.statSelamat.textContent = statistik.jumlah_terselamatkan;
  el.statSelamatUnit.textContent = `${statistik.unit_terselamatkan} unit`;
  el.statBuang.textContent = statistik.jumlah_terbuang;
  el.statBuangUnit.textContent = `${statistik.unit_terbuang} unit`;

  const persen = statistik.jumlah_tindakan > 0
    ? Math.round((statistik.jumlah_terselamatkan / statistik.jumlah_tindakan) * 100)
    : 0;
  el.statPersen.textContent = `${persen}%`;

  renderPerJenis(statistik.per_jenis);
  renderCharts(statistik, cachedRiwayat);
}

function formatJenisSaran(jenis) {
  if (!jenis) return 'Umum';
  if (jenis.toLowerCase() === 'pemusnahan') return 'Dibuang';
  return jenis;
}

function renderPerJenis(perJenis) {
  const entries = Object.entries(perJenis || {});
  if (!el.perJenisChips) return;
  el.perJenisChips.innerHTML = '';
  if (entries.length === 0) {
    el.perJenisChips.innerHTML = '<span class="text-xs text-light">Belum ada strategi dieksekusi</span>';
    return;
  }
  entries.forEach(([rawJenis, jumlah]) => {
    const jenis = formatJenisSaran(rawJenis);
    const chip = document.createElement('span');
    chip.textContent = `${jenis}: ${jumlah}`;
    chip.classList.add('badge', `badge-${jenis.toLowerCase().replace(/\s+/g, '-')}`);
    el.perJenisChips.appendChild(chip);
  });
}

function renderRiwayatRow(r) {
  const item = r.item;
  const template = document.getElementById('tmpl-riwayat-row');
  const clone = template.content.cloneNode(true);

  clone.querySelector('.js-tanggal').textContent = formatTanggalWaktu(r.diterapkan_at);
  clone.querySelector('.js-nama').textContent = item?.nama ?? '(barang dihapus)';

  const katEl = clone.querySelector('.js-kategori');
  if (katEl) {
    if (item?.kategori) {
      katEl.textContent = `Kategori: ${item.kategori}`;
      katEl.classList.remove('hidden');
    } else {
      katEl.classList.add('hidden');
    }
  }

  const badge = clone.querySelector('.js-jenis-badge');
  const jenis = formatJenisSaran(r.jenis_saran);
  badge.textContent = jenis;
  badge.classList.add('badge', `badge-${jenis.toLowerCase().replace(/\s+/g, '-')}`);

  const stok = Number(r.jumlah_stok_saat_dibuat ?? item?.jumlah_stok ?? 0);
  clone.querySelector('.js-stok').textContent = `${stok} unit`;

  return clone;
}

function renderRiwayatCard(r) {
  const item = r.item;
  const template = document.getElementById('tmpl-riwayat-card');
  const clone = template.content.cloneNode(true);

  clone.querySelector('.js-nama').textContent = item?.nama ?? '(barang dihapus)';
  const katEl = clone.querySelector('.js-kategori');
  if (katEl) {
    if (item?.kategori) {
      katEl.textContent = `Kategori: ${item.kategori}`;
      katEl.classList.remove('hidden');
    } else {
      katEl.classList.add('hidden');
    }
  }

  clone.querySelector('.js-tanggal').textContent = formatTanggalWaktu(r.diterapkan_at);

  const badge = clone.querySelector('.js-jenis-badge');
  const jenis = formatJenisSaran(r.jenis_saran);
  badge.textContent = jenis;
  badge.classList.add('badge', `badge-${jenis.toLowerCase().replace(/\s+/g, '-')}`);

  const stok = Number(r.jumlah_stok_saat_dibuat ?? item?.jumlah_stok ?? 0);
  clone.querySelector('.js-stok').textContent = `${stok} unit`;

  return clone;
}

function applyRiwayatFilters() {
  let filtered = [...cachedRiwayat];

  if (searchKeyword.trim()) {
    const q = searchKeyword.trim().toLowerCase();
    filtered = filtered.filter((r) => {
      const nama = (r.item?.nama || '').toLowerCase();
      const kat = (r.item?.kategori || '').toLowerCase();
      const jenis = (r.jenis_saran || '').toLowerCase();
      return nama.includes(q) || kat.includes(q) || jenis.includes(q);
    });
  }

  if (activeDampakFilter === 'selamat') {
    filtered = filtered.filter((r) => JENIS_TERSELAMATKAN.includes(r.jenis_saran));
  } else if (activeDampakFilter === 'buang') {
    filtered = filtered.filter((r) => !JENIS_TERSELAMATKAN.includes(r.jenis_saran));
  }

  renderRiwayat(filtered);
}

function renderRiwayat(daftar) {
  el.tableBody.innerHTML = '';
  el.cards.innerHTML = '';
  el.empty.classList.toggle('hidden', daftar.length > 0);
  el.container.classList.toggle('hidden', daftar.length === 0);

  const tableFragment = document.createDocumentFragment();
  const cardFragment = document.createDocumentFragment();
  daftar.forEach((r) => {
    tableFragment.appendChild(renderRiwayatRow(r));
    cardFragment.appendChild(renderRiwayatCard(r));
  });
  el.tableBody.appendChild(tableFragment);
  el.cards.appendChild(cardFragment);
}

if (el.riwayatSearch) {
  el.riwayatSearch.addEventListener('input', (e) => {
    searchKeyword = e.target.value;
    applyRiwayatFilters();
  });
}

if (el.riwayatFilterTabs) {
  el.riwayatFilterTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-dampak]');
    if (!btn) return;
    activeDampakFilter = btn.dataset.dampak;
    el.riwayatFilterTabs.querySelectorAll('[data-dampak]').forEach((b) => {
      b.classList.toggle('active', b.dataset.dampak === activeDampakFilter);
    });
    applyRiwayatFilters();
  });
}

el.btnLogout.addEventListener('click', async () => {
  el.btnLogout.disabled = true;
  await logout();
  window.location.href = 'login.html';
});

async function init() {
  if (el.loading) el.loading.classList.remove('hidden');
  if (el.error) el.error.classList.add('hidden');
  if (el.container) el.container.classList.add('hidden');
  if (el.empty) el.empty.classList.add('hidden');

  try {
    const [me, riwayat, statistik] = await Promise.all([
      fetchMe().catch(() => ({ name: 'Admin Koperasi' })),
      fetchRiwayat().catch((e) => {
        console.error('fetchRiwayat error:', e);
        return [];
      }),
      fetchStatistikRiwayat().catch((e) => {
        console.error('fetchStatistikRiwayat error:', e);
        return {
          jumlah_tindakan: 0,
          jumlah_terselamatkan: 0,
          jumlah_terbuang: 0,
          unit_terselamatkan: 0,
          unit_terbuang: 0,
          per_jenis: {},
        };
      }),
    ]);

    cachedRiwayat = riwayat || [];
    if (me) {
      if (me.name) currentUserName = me.name;
      if (el.userName) el.userName.textContent = me.name;
    }
    if (statistik) renderStatistik(statistik);
    applyRiwayatFilters();
  } catch (err) {
    console.error('init error:', err);
    if (el.error) {
      el.error.textContent = err.message || 'Terjadi kesalahan saat memuat riwayat.';
      el.error.classList.remove('hidden');
    }
  } finally {
    if (el.loading) el.loading.classList.add('hidden');
  }
}

init();
