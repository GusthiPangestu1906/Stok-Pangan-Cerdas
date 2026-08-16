// Deteksi mode demo: Aktif jika di localhost dan belum ada token
const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const SHOULD_USE_DEMO = IS_LOCAL && !getToken();

if (!SHOULD_USE_DEMO && !getToken()) {
  window.location.href = 'login.html';
}

const BULAN_PANJANG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

let allItems = [];
let allRekomendasi = [];
let activeKategori = 'Semua';
let activeStatus = 'Semua';
let editingItemId = null;
let deletingItemId = null;
let generatingItemId = null;

const el = {
  tanggalHariIni: document.getElementById('tanggal-hari-ini'),
  jumlahTampil: document.getElementById('jumlah-tampil'),
  chipKategori: document.getElementById('chip-kategori'),
  chipStatus: document.getElementById('chip-status'),
  cari: document.getElementById('filter-cari'),
  resetFilter: document.getElementById('reset-filter'),
  loading: document.getElementById('state-loading'),
  error: document.getElementById('state-error'),
  empty: document.getElementById('state-empty'),
  itemsContainer: document.getElementById('items-container'),
  tableBody: document.getElementById('items-table-body'),
  cards: document.getElementById('items-cards'),
  summaryTotal: document.getElementById('summary-total'),
  summaryTotalStok: document.getElementById('summary-total-stok'),
  summaryAman: document.getElementById('summary-aman'),
  summaryBerisiko: document.getElementById('summary-berisiko'),
  summaryKritis: document.getElementById('summary-kritis'),
  btnTambah: document.getElementById('btn-tambah'),
  modalForm: document.getElementById('modal-form'),
  modalFormTitle: document.getElementById('modal-form-title'),
  modalFormClose: document.getElementById('modal-form-close'),
  formItem: document.getElementById('form-item'),
  formError: document.getElementById('form-error'),
  formSubmit: document.getElementById('form-submit'),
  formCancel: document.getElementById('form-cancel'),
  inputNama: document.getElementById('input-nama'),
  inputKategori: document.getElementById('input-kategori'),
  inputMasuk: document.getElementById('input-masuk'),
  inputUmur: document.getElementById('input-umur'),
  inputStok: document.getElementById('input-stok'),
  daftarKategori: document.getElementById('daftar-kategori'),
  modalHapus: document.getElementById('modal-hapus'),
  modalHapusText: document.getElementById('modal-hapus-text'),
  modalHapusConfirm: document.getElementById('modal-hapus-confirm'),
  modalHapusCancel: document.getElementById('modal-hapus-cancel'),
  toast: document.getElementById('toast'),
  aiLoading: document.getElementById('ai-loading'),
  aiError: document.getElementById('ai-error'),
  aiEmpty: document.getElementById('ai-empty'),
  aiContainer: document.getElementById('ai-container'),
  aiList: document.getElementById('ai-list'),
  userName: document.getElementById('user-name'),
  btnLogout: document.getElementById('btn-logout'),
};

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function formatTanggal(dateString) {
  const d = new Date(dateString);
  return `${d.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][d.getMonth()]} ${d.getFullYear()}`;
}

function sisaHariText(sisaHari) {
  if (sisaHari < 0) return `Lewat ${Math.abs(sisaHari)} hari`;
  if (sisaHari === 0) return 'Hari ini';
  return `${sisaHari} hari lagi`;
}

function progressPercent(item) {
  const terpakai = item.estimasi_umur_simpan_hari - item.sisa_hari;
  const pct = (terpakai / item.estimasi_umur_simpan_hari) * 100;
  return Math.min(100, Math.max(0, Math.round(pct)));
}

function showToast(message) {
  el.toast.textContent = message;
  el.toast.classList.remove('hidden');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => el.toast.classList.add('hidden'), 3000);
}

function renderTanggalHariIni() {
  const now = new Date();
  el.tanggalHariIni.textContent = `${HARI[now.getDay()]}, ${now.getDate()} ${BULAN_PANJANG[now.getMonth()]} ${now.getFullYear()}`;
}

function renderSummary(filteredItems) {
  el.summaryTotal.textContent = allItems.length;
  const totalStok = allItems.reduce((sum, item) => sum + item.jumlah_stok, 0);
  el.summaryTotalStok.textContent = `${totalStok} unit di gudang`;
  el.summaryAman.textContent = allItems.filter((item) => item.status === 'aman').length;
  el.summaryBerisiko.textContent = allItems.filter((item) => item.status === 'berisiko').length;
  el.summaryKritis.textContent = allItems.filter((item) => item.status === 'kritis').length;
  el.jumlahTampil.textContent = `· ${filteredItems.length}`;
}

function hasRekomendasiAktif(itemId) {
  return allRekomendasi.some((r) => r.item_id === itemId && !r.diterapkan);
}

function renderActionButtons(item) {
  const template = document.getElementById('tmpl-action-buttons');
  const clone = template.content.cloneNode(true);

  const btnAi = clone.querySelector('[data-action="ai"]');
  const btnEdit = clone.querySelector('[data-action="edit"]');
  const btnHapus = clone.querySelector('[data-action="hapus"]');

  const bisaAi = item.status !== 'aman';
  const sudahAdaRekomendasi = bisaAi && hasRekomendasiAktif(item.id);

  if (bisaAi) {
    btnAi.classList.remove('hidden');
    btnAi.dataset.id = item.id;
    if (sudahAdaRekomendasi) {
      btnAi.disabled = true;
      btnAi.className = 'btn btn-outline btn-icon border-subtle text-light cursor-not-allowed';
      btnAi.title = 'Sudah ada rekomendasi aktif untuk barang ini';
    } else {
      btnAi.className = 'btn btn-outline btn-icon border-ai-subtle text-ai hover:bg-ai cursor-pointer';
      btnAi.title = 'Minta Saran AI';
    }
  }

  btnEdit.dataset.id = item.id;
  btnHapus.dataset.id = item.id;

  return clone;
}

function renderTableRow(item) {
  const pct = progressPercent(item);
  const template = document.getElementById('tmpl-table-row');
  const clone = template.content.cloneNode(true);

  clone.querySelector('.js-dot').classList.add(`dot-${item.status}`);
  clone.querySelector('.js-nama').textContent = item.nama;
  clone.querySelector('.js-kategori').textContent = item.kategori;
  clone.querySelector('.js-stok').textContent = item.jumlah_stok;
  clone.querySelector('.js-kadaluarsa').textContent = formatTanggal(item.tanggal_kadaluarsa);
  clone.querySelector('.js-sisa-text').textContent = sisaHariText(item.sisa_hari);

  const progressBar = clone.querySelector('.js-progress-bar');
  progressBar.style.width = `${pct}%`;
  progressBar.classList.add(`progress-${item.status}`);

  const badge = clone.querySelector('.js-status-badge');
  badge.textContent = item.status.charAt(0).toUpperCase() + item.status.slice(1);
  badge.classList.add(`badge-${item.status}`);

  clone.querySelector('.js-actions').appendChild(renderActionButtons(item));

  return clone;
}

function renderCard(item) {
  const pct = progressPercent(item);
  const template = document.getElementById('tmpl-card');
  const clone = template.content.cloneNode(true);

  clone.querySelector('.js-nama').textContent = item.nama;
  clone.querySelector('.js-kategori').textContent = item.kategori;
  clone.querySelector('.js-stok').textContent = item.jumlah_stok;
  clone.querySelector('.js-sisa-text').textContent = sisaHariText(item.sisa_hari);
  clone.querySelector('.js-kadaluarsa').textContent = formatTanggal(item.tanggal_kadaluarsa);

  const progressBar = clone.querySelector('.js-progress-bar');
  progressBar.style.width = `${pct}%`;
  progressBar.classList.add(`progress-${item.status}`);

  const badge = clone.querySelector('.js-status-badge');
  badge.textContent = item.status.charAt(0).toUpperCase() + item.status.slice(1);
  badge.classList.add(`badge-${item.status}`);

  clone.querySelector('.js-actions').appendChild(renderActionButtons(item));

  return clone;
}

function renderItems(items) {
  el.tableBody.innerHTML = '';
  el.cards.innerHTML = '';

  el.empty.classList.toggle('hidden', items.length > 0);
  el.itemsContainer.classList.toggle('hidden', items.length === 0);

  const tableFragment = document.createDocumentFragment();
  const cardFragment = document.createDocumentFragment();
  items.forEach((item) => {
    tableFragment.appendChild(renderTableRow(item));
    cardFragment.appendChild(renderCard(item));
  });
  el.tableBody.appendChild(tableFragment);
  el.cards.appendChild(cardFragment);
}

function renderChipKategori() {
  const kategoriList = ['Semua', ...new Set(allItems.map((item) => item.kategori))];
  el.chipKategori.innerHTML = '';
  kategoriList.forEach((kategori) => {
    const chip = document.createElement('div');
    chip.textContent = kategori;
    chip.className = 'chip';
    if (activeKategori === kategori) chip.classList.add('chip-active');
    chip.addEventListener('click', () => {
      activeKategori = kategori;
      renderChipKategori();
      applyFilters();
    });
    el.chipKategori.appendChild(chip);
  });

  el.daftarKategori.innerHTML = '';
  kategoriList.filter(k => k !== 'Semua').forEach(k => {
    const opt = document.createElement('option');
    opt.value = k;
    el.daftarKategori.appendChild(opt);
  });
}

function renderChipStatus() {
  const statusList = [
    { key: 'Semua', label: 'Semua' },
    { key: 'aman', label: 'Aman' },
    { key: 'berisiko', label: 'Berisiko' },
    { key: 'kritis', label: 'Kritis' },
  ];
  el.chipStatus.innerHTML = '';
  statusList.forEach(({ key, label }) => {
    const chip = document.createElement('div');
    chip.textContent = label;
    chip.className = 'chip';
    if (activeStatus === key) chip.classList.add('chip-active');
    chip.addEventListener('click', () => {
      activeStatus = key;
      renderChipStatus();
      applyFilters();
    });
    el.chipStatus.appendChild(chip);
  });
}

function applyFilters() {
  const keyword = el.cari.value.trim().toLowerCase();

  const filtered = allItems.filter((item) => {
    if (activeKategori !== 'Semua' && item.kategori !== activeKategori) return false;
    if (activeStatus !== 'Semua' && item.status !== activeStatus) return false;
    if (keyword && !item.nama.toLowerCase().includes(keyword)) return false;
    return true;
  });

  renderSummary(filtered);
  renderItems(filtered);
}

async function loadItems() {
  el.loading.classList.remove('hidden');
  el.error.classList.add('hidden');
  el.itemsContainer.classList.add('hidden');

  try {
    allItems = await fetchItems();
    renderChipKategori();
    renderChipStatus();
    applyFilters();
  } catch (err) {
    el.error.textContent = err.message || 'Terjadi kesalahan saat memuat data.';
    el.error.classList.remove('hidden');
  } finally {
    el.loading.classList.add('hidden');
  }
}

// ---------- Modal Tambah/Edit ----------

function openFormModal(item = null) {
  editingItemId = item ? item.id : null;
  el.modalFormTitle.textContent = item ? 'Edit Barang' : 'Tambah Barang';
  el.formSubmit.textContent = item ? 'Simpan Perubahan' : 'Simpan Barang';
  el.formError.classList.add('hidden');
  el.formItem.reset();

  if (item) {
    el.inputNama.value = item.nama;
    el.inputKategori.value = item.kategori;
    el.inputMasuk.value = item.tanggal_masuk.slice(0, 10);
    el.inputUmur.value = item.estimasi_umur_simpan_hari;
    el.inputStok.value = item.jumlah_stok;
  }

  el.modalForm.classList.remove('hidden');
  el.inputNama.focus();
}

function closeFormModal() {
  el.modalForm.classList.add('hidden');
  editingItemId = null;
}

el.btnTambah.addEventListener('click', () => openFormModal());
el.modalFormClose.addEventListener('click', closeFormModal);
el.formCancel.addEventListener('click', closeFormModal);
el.modalForm.addEventListener('click', (e) => {
  if (e.target === el.modalForm) closeFormModal();
});

el.formItem.addEventListener('submit', async (e) => {
  e.preventDefault();
  el.formError.classList.add('hidden');
  el.formSubmit.disabled = true;

  const payload = {
    nama: el.inputNama.value.trim(),
    kategori: el.inputKategori.value.trim(),
    tanggal_masuk: el.inputMasuk.value,
    estimasi_umur_simpan_hari: Number(el.inputUmur.value),
    jumlah_stok: Number(el.inputStok.value),
  };

  try {
    if (editingItemId) {
      await updateItem(editingItemId, payload);
      showToast('Barang berhasil diperbarui.');
    } else {
      await createItem(payload);
      showToast('Barang berhasil ditambahkan.');
    }
    closeFormModal();
    await loadRekomendasi();
    await loadItems();
  } catch (err) {
    el.formError.textContent = err.message || 'Gagal menyimpan barang.';
    el.formError.classList.remove('hidden');
  } finally {
    el.formSubmit.disabled = false;
  }
});

// ---------- Modal Hapus ----------

function openDeleteModal(item) {
  deletingItemId = item.id;
  el.modalHapusText.textContent = `"${item.nama}" akan dihapus permanen dari daftar stok.`;
  el.modalHapus.classList.remove('hidden');
}

function closeDeleteModal() {
  el.modalHapus.classList.add('hidden');
  deletingItemId = null;
}

el.modalHapusCancel.addEventListener('click', closeDeleteModal);
el.modalHapus.addEventListener('click', (e) => {
  if (e.target === el.modalHapus) closeDeleteModal();
});

el.modalHapusConfirm.addEventListener('click', async () => {
  if (!deletingItemId) return;
  el.modalHapusConfirm.disabled = true;
  try {
    await deleteItem(deletingItemId);
    showToast('Barang berhasil dihapus.');
    closeDeleteModal();
    await loadRekomendasi();
    await loadItems();
  } catch (err) {
    showToast(err.message || 'Gagal menghapus barang.');
  } finally {
    el.modalHapusConfirm.disabled = false;
  }
});

// ---------- Aksi tabel/kartu (delegasi event) ----------

function handleActionClick(e) {
  const button = e.target.closest('[data-action]');
  if (!button) return;

  const id = Number(button.dataset.id);
  const item = allItems.find((i) => i.id === id);
  if (!item) return;

  if (button.dataset.action === 'edit') openFormModal(item);
  if (button.dataset.action === 'hapus') openDeleteModal(item);
  if (button.dataset.action === 'ai') requestRekomendasi(item, button);
}

el.tableBody.addEventListener('click', handleActionClick);
el.cards.addEventListener('click', handleActionClick);

// ---------- AI Insight Panel ----------

function renderAiCard(rekomendasi) {
  const item = rekomendasi.item;
  const template = document.getElementById('tmpl-ai-card');
  const clone = template.content.cloneNode(true);

  const container = clone.querySelector('.js-container');
  if (rekomendasi.diterapkan) {
    container.classList.remove('bg-white');
    container.classList.add('bg-hover', 'opacity-70');
  }

  clone.querySelector('.js-dot').classList.add(`dot-${item.status}`);
  clone.querySelector('.js-nama').textContent = item.nama;

  const statusBadge = clone.querySelector('.js-status-badge');
  statusBadge.textContent = item.status.charAt(0).toUpperCase() + item.status.slice(1);
  statusBadge.classList.add(`badge-${item.status}`);

  const jenisBadge = clone.querySelector('.js-jenis-badge');
  jenisBadge.textContent = rekomendasi.jenis_saran;
  jenisBadge.classList.add(`badge-${rekomendasi.jenis_saran.toLowerCase()}`);

  clone.querySelector('.js-saran').textContent = rekomendasi.isi_saran;

  const actions = clone.querySelector('.js-actions');
  if (rekomendasi.diterapkan) {
    const span = document.createElement('span');
    span.className = 'inline-flex items-center gap-1.5 text-[13px] font-medium text-success';
    span.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg> Sudah diterapkan`;
    actions.appendChild(span);
  } else {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.terapkan = rekomendasi.id;
    btn.className = 'btn btn-primary h-9 px-3.5 text-[13px]';
    btn.textContent = 'Tandai Diterapkan';
    actions.appendChild(btn);
  }

  return clone;
}

function renderAiGroup(judul, daftarRekomendasi) {
  if (daftarRekomendasi.length === 0) return null;

  const group = document.createElement('div');
  group.className = 'flex flex-col gap-2.5';

  const header = document.createElement('div');
  header.className = 'text-xs font-semibold text-caption tracking-wide px-1';
  header.textContent = `${judul} · ${daftarRekomendasi.length}`;
  group.appendChild(header);

  daftarRekomendasi.forEach((r) => group.appendChild(renderAiCard(r)));
  return group;
}

function renderRekomendasi() {
  el.aiList.innerHTML = '';
  el.aiEmpty.classList.toggle('hidden', allRekomendasi.length > 0);
  el.aiContainer.classList.toggle('hidden', allRekomendasi.length === 0);

  const perluDitindak = allRekomendasi.filter((r) => !r.diterapkan);
  const sudahDitindak = allRekomendasi.filter((r) => r.diterapkan);

  const fragment = document.createDocumentFragment();
  const groupPerlu = renderAiGroup('Perlu Ditindak', perluDitindak);
  const groupSudah = renderAiGroup('Sudah Ditindak', sudahDitindak);
  if (groupPerlu) fragment.appendChild(groupPerlu);
  if (groupSudah) fragment.appendChild(groupSudah);
  el.aiList.appendChild(fragment);
}

async function loadRekomendasi() {
  el.aiError.classList.add('hidden');
  el.aiLoading.classList.remove('hidden');
  try {
    allRekomendasi = await fetchRekomendasi();
    renderRekomendasi();
  } catch (err) {
    el.aiError.textContent = err.message || 'Gagal memuat rekomendasi AI.';
    el.aiError.classList.remove('hidden');
  } finally {
    el.aiLoading.classList.add('hidden');
  }
}

async function requestRekomendasi(item, button) {
  if (generatingItemId || hasRekomendasiAktif(item.id)) return;
  generatingItemId = item.id;
  button.disabled = true;
  button.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" class="animate-spin" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>';

  try {
    const rekomendasi = await generateRekomendasi(item.id);
    el.aiError.classList.add('hidden');
    allRekomendasi = [rekomendasi, ...allRekomendasi];
    renderRekomendasi();
    showToast(`Rekomendasi AI untuk "${item.nama}" berhasil dibuat.`);
  } catch (err) {
    el.aiError.textContent = err.message || 'Gagal meminta rekomendasi AI.';
    el.aiError.classList.remove('hidden');
  } finally {
    generatingItemId = null;
    applyFilters();
  }
}

el.aiList.addEventListener('click', async (e) => {
  const button = e.target.closest('[data-terapkan]');
  if (!button) return;

  const id = Number(button.dataset.terapkan);
  button.disabled = true;
  try {
    const updated = await terapkanRekomendasi(id);
    allRekomendasi = allRekomendasi.map((r) => (r.id === id ? updated : r));
    renderRekomendasi();
    applyFilters();
    showToast('Rekomendasi ditandai sebagai diterapkan.');
  } catch (err) {
    showToast(err.message || 'Gagal memperbarui rekomendasi.');
    button.disabled = false;
  }
});

// ---------- Init ----------

el.cari.addEventListener('input', applyFilters);
el.resetFilter.addEventListener('click', () => {
  activeKategori = 'Semua';
  activeStatus = 'Semua';
  el.cari.value = '';
  renderChipKategori();
  renderChipStatus();
  applyFilters();
});

// Tutup modal dengan tombol Escape.
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!el.modalForm.classList.contains('hidden')) closeFormModal();
  if (!el.modalHapus.classList.contains('hidden')) closeDeleteModal();
});

el.btnLogout.addEventListener('click', async () => {
  el.btnLogout.disabled = true;
  await logout();
  window.location.href = 'login.html';
});

async function init() {
  renderTanggalHariIni();

  if (SHOULD_USE_DEMO) {
    console.warn("Dashboard berjalan dalam MODE DEMO (Offline).");
    el.userName.textContent = "Admin Demo (Offline)";

    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const fourDaysLater = new Date(today); fourDaysLater.setDate(today.getDate() + 4);

    allItems = [
      { id: 1, nama: 'Tomat Segar', kategori: 'Sayur', jumlah_stok: 45, tanggal_masuk: today.toISOString(), tanggal_kadaluarsa: tomorrow.toISOString(), estimasi_umur_simpan_hari: 5, sisa_hari: 1, status: 'kritis' },
      { id: 2, nama: 'Apel Fuji', kategori: 'Buah', jumlah_stok: 20, tanggal_masuk: today.toISOString(), tanggal_kadaluarsa: fourDaysLater.toISOString(), estimasi_umur_simpan_hari: 10, sisa_hari: 4, status: 'berisiko' },
      { id: 3, nama: 'Susu UHT', kategori: 'Olahan Susu', jumlah_stok: 12, tanggal_masuk: today.toISOString(), tanggal_kadaluarsa: today.toISOString(), estimasi_umur_simpan_hari: 30, sisa_hari: 15, status: 'aman' }
    ];

    allRekomendasi = [
      { id: 1, item_id: 1, item: allItems[0], jenis_saran: 'Diskon', isi_saran: 'Berikan diskon 50% untuk Tomat Segar karena akan kadaluarsa dalam 1 hari.', diterapkan: false }
    ];
  } else {
    // Mode Production: Ambil data asli
    el.loading.classList.remove('hidden');
    try {
      const [me, items, rekomendasi] = await Promise.all([fetchMe(), fetchItems(), fetchRekomendasi()]);
      el.userName.textContent = me.name;
      allItems = items;
      allRekomendasi = rekomendasi;
    } catch (err) {
      el.error.textContent = err.message || 'Gagal memuat data dari server.';
      el.error.classList.remove('hidden');
      return;
    }
  }

  renderChipKategori();
  renderChipStatus();
  applyFilters();
  renderRekomendasi();

  el.loading.classList.add('hidden');
  el.aiLoading.classList.add('hidden');
  el.itemsContainer.classList.remove('hidden');
  el.aiContainer.classList.remove('hidden');
}

init();
