if (!getToken()) {
  window.location.href = 'login.html';
}

const JENIS_WARNA = {
  Diskon: { fg: '#92400e', bg: '#fffbeb', bd: '#fde68a' },
  Distribusi: { fg: '#166534', bg: '#f0fdf4', bd: '#bbf7d0' },
  Bundling: { fg: '#86198f', bg: '#fdf4ff', bd: '#f5d0fe' },
  Pemusnahan: { fg: '#9f1239', bg: '#fff1f3', bd: '#fecdd3' },
};
const JENIS_WARNA_DEFAULT = { fg: '#5d6f63', bg: '#fafbf9', bd: '#e0e7e0' };

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function jenisBadgeStyle(jenis) {
  const w = JENIS_WARNA[jenis] || JENIS_WARNA_DEFAULT;
  return `display:inline-flex;align-items:center;padding:4px 11px;border-radius:999px;font-size:12px;font-weight:600;color:${w.fg};background:${w.bg};border:1px solid ${w.bd}`;
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
  perJenisWrap: document.getElementById('per-jenis-wrap'),
  perJenisChips: document.getElementById('per-jenis-chips'),
  userName: document.getElementById('user-name'),
  btnLogout: document.getElementById('btn-logout'),
};

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
}

function renderPerJenis(perJenis) {
  const entries = Object.entries(perJenis || {});
  el.perJenisWrap.classList.toggle('hidden', entries.length === 0);
  el.perJenisChips.innerHTML = entries
    .map(([jenis, jumlah]) => `<span style="${jenisBadgeStyle(jenis)}">${esc(jenis)} ${jumlah}</span>`)
    .join('');
}

function renderRiwayatRow(r) {
  const item = r.item;
  const row = document.createElement('div');
  row.className = 'grid grid-cols-[1.1fr_2fr_1.1fr_1fr_1.4fr] gap-3 px-[18px] py-3.5 border-b border-[#f1f4f0] items-center';
  row.innerHTML = `
    <div class="text-[13px] text-[#5d6f63]">${esc(formatTanggalWaktu(r.diterapkan_at))}</div>
    <div class="text-sm font-medium text-[#132018] truncate">${esc(item?.nama ?? '(barang dihapus)')}</div>
    <div><span style="${jenisBadgeStyle(r.jenis_saran)}">${esc(r.jenis_saran)}</span></div>
    <div class="text-[13.5px] font-medium font-heading">${item ? item.jumlah_stok : '–'}</div>
    <div class="text-[13px] text-[#7d8f83] truncate" title="${esc(r.isi_saran)}">${esc(r.isi_saran)}</div>
  `;
  return row;
}

function renderRiwayatCard(r) {
  const item = r.item;
  const card = document.createElement('article');
  card.className = 'bg-white border border-[#eef2ed] rounded-[14px] p-4';
  card.innerHTML = `
    <div class="flex items-start justify-between gap-2.5">
      <div class="min-w-0">
        <div class="text-[15px] font-semibold tracking-tight text-[#132018]">${esc(item?.nama ?? '(barang dihapus)')}</div>
        <div class="text-[12.5px] text-[#93a398] mt-1">${esc(formatTanggalWaktu(r.diterapkan_at))}</div>
      </div>
      <span style="${jenisBadgeStyle(r.jenis_saran)}">${esc(r.jenis_saran)}</span>
    </div>
    <p class="text-[13px] text-[#6b7c71] leading-relaxed mt-3">${esc(r.isi_saran)}</p>
    ${item ? `<div class="text-[12.5px] text-[#93a398] mt-3 pt-3 border-t border-[#eef2ed]">Stok saat ini: <span class="font-medium text-[#3c4d42]">${item.jumlah_stok}</span></div>` : ''}
  `;
  return card;
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

el.btnLogout.addEventListener('click', async () => {
  el.btnLogout.disabled = true;
  await logout();
  window.location.href = 'login.html';
});

async function init() {
  el.loading.classList.remove('hidden');
  el.error.classList.add('hidden');
  el.container.classList.add('hidden');
  el.empty.classList.add('hidden');

  try {
    const [me, riwayat, statistik] = await Promise.all([fetchMe(), fetchRiwayat(), fetchStatistikRiwayat()]);
    el.userName.textContent = me.name;
    renderStatistik(statistik);
    renderRiwayat(riwayat);
  } catch (err) {
    el.error.textContent = err.message || 'Terjadi kesalahan saat memuat riwayat.';
    el.error.classList.remove('hidden');
  } finally {
    el.loading.classList.add('hidden');
  }
}

init();
