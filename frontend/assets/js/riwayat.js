// Deteksi mode demo: Aktif jika di localhost dan belum ada token
const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const SHOULD_USE_DEMO = IS_LOCAL && !getToken();

if (!SHOULD_USE_DEMO && !getToken()) {
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
  el.perJenisChips.innerHTML = '';
  entries.forEach(([jenis, jumlah]) => {
    const chip = document.createElement('span');
    chip.textContent = `${jenis} ${jumlah}`;
    chip.classList.add('badge', `badge-${jenis.toLowerCase()}`);
    el.perJenisChips.appendChild(chip);
  });
}

function renderRiwayatRow(r) {
  const item = r.item;
  const template = document.getElementById('tmpl-riwayat-row');
  const clone = template.content.cloneNode(true);

  clone.querySelector('.js-tanggal').textContent = formatTanggalWaktu(r.diterapkan_at);
  clone.querySelector('.js-nama').textContent = item?.nama ?? '(barang dihapus)';

  const badge = clone.querySelector('.js-jenis-badge');
  badge.textContent = r.jenis_saran;
  badge.classList.add('badge', `badge-${r.jenis_saran.toLowerCase()}`);

  clone.querySelector('.js-stok').textContent = item ? item.jumlah_stok : '–';

  const keterangan = clone.querySelector('.js-keterangan');
  keterangan.textContent = r.isi_saran;
  keterangan.title = r.isi_saran;

  return clone;
}

function renderRiwayatCard(r) {
  const item = r.item;
  const template = document.getElementById('tmpl-riwayat-card');
  const clone = template.content.cloneNode(true);

  clone.querySelector('.js-nama').textContent = item?.nama ?? '(barang dihapus)';
  clone.querySelector('.js-tanggal').textContent = formatTanggalWaktu(r.diterapkan_at);

  const badge = clone.querySelector('.js-jenis-badge');
  badge.textContent = r.jenis_saran;
  badge.classList.add('badge', `badge-${r.jenis_saran.toLowerCase()}`);

  clone.querySelector('.js-keterangan').textContent = r.isi_saran;

  if (item) {
    clone.querySelector('.js-stok').textContent = item.jumlah_stok;
  } else {
    clone.querySelector('.js-stok-wrap').remove();
  }

  return clone;
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

  if (SHOULD_USE_DEMO) {
    console.warn("Riwayat berjalan dalam MODE DEMO (Offline).");
    el.userName.textContent = "Admin Demo (Offline)";

    // Data dummy untuk preview riwayat & statistik
    const mockStatistik = {
      jumlah_tindakan: 5,
      jumlah_terselamatkan: 4,
      unit_terselamatkan: 120,
      jumlah_terbuang: 1,
      unit_terbuang: 15,
      per_jenis: { 'Diskon': 2, 'Bundling': 2, 'Pemusnahan': 1 }
    };

    const mockRiwayat = [
      {
        id: 1, diterapkan_at: new Date().toISOString(), jenis_saran: 'Diskon',
        isi_saran: 'Diterapkan diskon 50% untuk Tomat Segar.',
        item: { nama: 'Tomat Segar', jumlah_stok: 45 }
      },
      {
        id: 2, diterapkan_at: new Date().toISOString(), jenis_saran: 'Bundling',
        isi_saran: 'Paket bundling Apel Fuji dengan Jeruk.',
        item: { nama: 'Apel Fuji', jumlah_stok: 20 }
      },
      {
        id: 3, diterapkan_at: new Date().toISOString(), jenis_saran: 'Pemusnahan',
        isi_saran: 'Barang sudah tidak layak konsumsi.',
        item: { nama: 'Sawi Hijau', jumlah_stok: 15 }
      }
    ];

    renderStatistik(mockStatistik);
    renderRiwayat(mockRiwayat);
    el.loading.classList.add('hidden');
  } else {
    // Mode Production
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
}

init();
