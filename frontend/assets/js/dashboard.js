// Pastikan user sudah login
if (!getToken()) {
  window.location.href = 'login.html';
}

const BULAN_PANJANG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

let allItems = [];
let allRekomendasi = [];
let activeKategori = 'Semua';
let activeStatus = 'Semua';
let activeAiFilter = 'semua';
let editingItemId = null;
let deletingItemId = null;
let generatingItemId = null;

const el = {
  tanggalHariIni: document.getElementById('tanggal-hari-ini'),
  jumlahTampil: document.getElementById('jumlah-tampil'),
  chipFilters: document.getElementById('chip-filters'),
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
  btnTambahFab: document.getElementById('btn-tambah-fab'),
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
  aiFilterTabs: document.getElementById('ai-filter-tabs'),
  aiCountSemua: document.getElementById('ai-count-semua'),
  aiCountBelum: document.getElementById('ai-count-belum'),
  aiCountSudah: document.getElementById('ai-count-sudah'),
  userName: document.getElementById('user-name'),
  btnLogout: document.getElementById('btn-logout'),
  modalLabelDiskon: document.getElementById('modal-label-diskon'),
  modalLabelClose: document.getElementById('modal-label-close'),
  modalLabelCancel: document.getElementById('modal-label-cancel'),
  btnPrintLabels: document.getElementById('btn-print-labels'),
  labelInputNama: document.getElementById('label-input-nama'),
  labelInputKategori: document.getElementById('label-input-kategori'),
  labelInputKadaluarsa: document.getElementById('label-input-kadaluarsa'),
  labelInputHargaAsli: document.getElementById('label-input-harga-asli'),
  labelPctGroup: document.getElementById('label-pct-group'),
  labelInputTagline: document.getElementById('label-input-tagline'),
  labelInputQty: document.getElementById('label-input-qty'),
  shelfTagPreview: document.getElementById('shelf-tag-preview'),
  previewNama: document.getElementById('preview-nama'),
  previewKategori: document.getElementById('preview-kategori'),
  previewKadaluarsa: document.getElementById('preview-kadaluarsa'),
  previewTagline: document.getElementById('preview-tagline'),
  previewPct: document.getElementById('preview-pct'),
  previewHargaAsli: document.getElementById('preview-harga-asli'),
  previewHargaDiskon: document.getElementById('preview-harga-diskon'),
  printableLabelsArea: document.getElementById('printable-labels-area'),
  btnNavScanVoucher: document.getElementById('btn-nav-scan-voucher'),
  modalVoucher: document.getElementById('modal-voucher'),
  modalVoucherClose: document.getElementById('modal-voucher-close'),
  modalVoucherCancel: document.getElementById('modal-voucher-cancel'),
  btnPrintVouchers: document.getElementById('btn-print-vouchers'),
  voucherInputJudul: document.getElementById('voucher-input-judul'),
  voucherInputTarget: document.getElementById('voucher-input-target'),
  voucherInputKadaluarsa: document.getElementById('voucher-input-kadaluarsa'),
  voucherDiskonGroup: document.getElementById('voucher-diskon-group'),
  voucherInputMinBelanja: document.getElementById('voucher-input-min-belanja'),
  voucherInputQty: document.getElementById('voucher-input-qty'),
  voucherInputKode: document.getElementById('voucher-input-kode'),
  btnVoucherGenerateCode: document.getElementById('btn-voucher-generate-code'),
  voucherTicketPreview: document.getElementById('voucher-ticket-preview'),
  voucherPreviewJudul: document.getElementById('voucher-preview-judul'),
  voucherPreviewTarget: document.getElementById('voucher-preview-target'),
  voucherPreviewBadge: document.getElementById('voucher-preview-badge'),
  voucherPreviewMinBelanja: document.getElementById('voucher-preview-min-belanja'),
  voucherPreviewMinBelanjaCell: document.getElementById('voucher-preview-min-belanja-cell'),
  voucherPreviewKadaluarsaCell: document.getElementById('voucher-preview-kadaluarsa-cell'),
  voucherPreviewKadaluarsa: document.getElementById('voucher-preview-kadaluarsa'),
  voucherPreviewBarcodeSvg: document.getElementById('voucher-preview-barcode-svg'),
  voucherPreviewKode: document.getElementById('voucher-preview-kode'),
  modalScanVoucher: document.getElementById('modal-scan-voucher'),
  modalScanClose: document.getElementById('modal-scan-close'),
  modalScanCloseBtn: document.getElementById('modal-scan-close-btn'),
  scanInputKode: document.getElementById('scan-input-kode'),
  scanInputBelanja: document.getElementById('scan-input-belanja'),
  btnDoScan: document.getElementById('btn-do-scan'),
  scanQuickVouchers: document.getElementById('scan-quick-vouchers'),
  btnKasirCreateVoucher: document.getElementById('btn-kasir-create-voucher'),
  btnMobileScanVoucher: document.getElementById('btn-mobile-scan-voucher'),
  scanResultContainer: document.getElementById('scan-result-container'),
  printableVouchersArea: document.getElementById('printable-vouchers-area'),
  btnScanCamera: document.getElementById('btn-scan-camera'),
  btnScanCameraClose: document.getElementById('btn-scan-camera-close'),
  scanCameraWrap: document.getElementById('scan-camera-wrap'),
  scanCameraVideo: document.getElementById('scan-camera-video'),
  scanCameraStatus: document.getElementById('scan-camera-status'),
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

function sanitizeFilename(text) {
  return String(text || 'Dokumen')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function tanggalFileStamp() {
  const d = new Date();
  const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][d.getMonth()];
  return `${d.getDate()}${bulan}${d.getFullYear()}`;
}

/**
 * Ganti document.title (menentukan nama file PDF hasil cetak), panggil
 * window.print(), lalu kembalikan title & jalankan afterFn setelah dialog
 * cetak BENAR-BENAR selesai. afterprint tidak fire di semua browser, jadi
 * dipasangi fallback timeout supaya modal tidak macet terbuka selamanya --
 * tapi afterprint (kalau fire) selalu menang lebih dulu karena timeout
 * dibatalkan begitu event itu tiba.
 */
function printDocument(fileTitle, afterFn) {
  const originalTitle = document.title;
  document.title = sanitizeFilename(fileTitle);

  let selesai = false;
  const finish = () => {
    if (selesai) return;
    selesai = true;
    document.title = originalTitle;
    window.removeEventListener('afterprint', finish);
    clearTimeout(fallbackTimer);
    if (afterFn) afterFn();
  };

  window.addEventListener('afterprint', finish);
  const fallbackTimer = setTimeout(finish, 2000);

  window.print();
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

  // Highlight KPI card yang sedang aktif memfilter tabel (hanya di desktop/tablet)
  const isDesktop = window.innerWidth >= 640;
  const kpiCards = document.querySelectorAll('[data-filter]');
  kpiCards.forEach((card) => {
    const filter = card.dataset.filter;
    const isActive = (filter === 'Semua' && activeStatus === 'Semua') || filter === activeStatus;

    if (!isDesktop) {
      // Hapus ring highlight pada mobile
      card.classList.remove('ring-2', 'ring-offset-2', 'ring-emerald-500', 'ring-amber-500', 'ring-rose-500', 'ring-slate-700');
      return;
    }

    card.classList.toggle('ring-2', isActive && filter !== 'Semua');
    card.classList.toggle('ring-offset-2', isActive && filter !== 'Semua');

    if (filter === 'aman') {
      card.classList.toggle('ring-emerald-500', isActive);
    } else if (filter === 'berisiko') {
      card.classList.toggle('ring-amber-500', isActive);
    } else if (filter === 'kritis') {
      card.classList.toggle('ring-rose-500', isActive);
    } else if (filter === 'Semua') {
      card.classList.toggle('ring-2', isActive && activeStatus === 'Semua');
      card.classList.toggle('ring-slate-700', isActive && activeStatus === 'Semua');
      card.classList.toggle('ring-offset-2', isActive && activeStatus === 'Semua');
    }
  });
}

function setupKpiFilterEvents() {
  document.querySelectorAll('[data-filter]').forEach((card) => {
    card.addEventListener('click', () => {
      // Abaikan klik KPI card pada layar mobile (< 640px)
      if (window.innerWidth < 640) return;

      const filter = card.dataset.filter;
      if (filter === 'Semua') {
        activeStatus = 'Semua';
      } else {
        activeStatus = activeStatus === filter ? 'Semua' : filter;
      }
      renderFilters();
      applyFilters();
    });
  });
}

/**
 * Kriteria SAMA dengan yang menyembunyikan kartu di panel AI Insight
 * (isSudahDiterapkanBaruBaruIni, ambang 24 jam) -- supaya tombol "Minta
 * Saran AI" hanya menyala lagi setelah kartu rekomendasinya benar-benar
 * hilang dari panel, bukan begitu admin menandai "Diterapkan".
 */
function hasRekomendasiAktif(itemId) {
  return allRekomendasi.some((r) => (
    r.item_id === itemId && (!r.diterapkan || isSudahDiterapkanBaruBaruIni(r))
  ));
}

function renderActionButtons(item, isMobile = false) {
  const template = document.getElementById('tmpl-action-buttons');
  const clone = template.content.cloneNode(true);

  const btnAi = clone.querySelector('[data-action="ai"]');
  const btnLabel = clone.querySelector('[data-action="label"]');
  const btnEdit = clone.querySelector('[data-action="edit"]');
  const btnHapus = clone.querySelector('[data-action="hapus"]');

  const bisaAi = item.status !== 'aman';
  const sudahAdaRekomendasi = bisaAi && hasRekomendasiAktif(item.id);
  const sudahKadaluarsa = item.sisa_hari < 0;

  // 1. Tombol AI (hanya untuk barang kritis/berisiko)
  if (bisaAi) {
    btnAi.classList.remove('hidden');
    btnAi.dataset.id = item.id;
    if (sudahAdaRekomendasi) {
      btnAi.disabled = true;
      btnAi.className = isMobile
        ? 'btn btn-outline border-subtle text-light text-xs h-8 px-3 rounded-lg cursor-not-allowed flex items-center gap-1.5 font-medium'
        : 'btn btn-outline btn-icon border-subtle text-light cursor-not-allowed w-7 h-7 shrink-0';
      btnAi.title = 'Rekomendasi masih berlaku, tunggu 24 jam untuk meminta saran baru';
    } else {
      btnAi.className = isMobile
        ? 'btn bg-purple-50 text-purple-700 border border-purple-200/80 hover:bg-purple-100 cursor-pointer text-xs h-8 px-3 rounded-lg flex items-center gap-1.5 font-semibold'
        : 'btn btn-outline btn-icon border-purple-200 text-purple-700 hover:bg-purple-50 cursor-pointer transition-colors w-7 h-7 shrink-0';
      btnAi.title = 'Minta Saran AI';
    }
    if (isMobile) {
      const labelSpan = document.createElement('span');
      labelSpan.textContent = 'Minta Saran AI';
      btnAi.appendChild(labelSpan);
    }
  } else {
    btnAi.remove();
  }

  // 2. Tombol Label Rak (untuk semua barang yang belum kadaluarsa)
  const bisaLabelRak = !sudahKadaluarsa;
  if (btnLabel) {
    if (bisaLabelRak) {
      btnLabel.dataset.id = item.id;
      btnLabel.title = 'Cetak Label Rak';
      if (isMobile) {
        btnLabel.className = 'btn btn-outline btn-icon hover:!border-purple-300 hover:!text-purple-700';
      } else {
        btnLabel.className = 'btn btn-outline btn-icon hover:!border-purple-300 hover:!text-purple-700 w-7 h-7 shrink-0';
      }
    } else {
      btnLabel.remove();
    }
  }

  // 3. Tombol Edit & Hapus (selalu ada)
  btnEdit.dataset.id = item.id;
  btnHapus.dataset.id = item.id;

  if (isMobile) {
    btnEdit.className = 'btn btn-outline btn-icon';
    btnHapus.className = 'btn btn-outline btn-icon hover:!border-danger hover:!text-danger';

    const rightActions = document.createElement('div');
    rightActions.className = 'flex items-center gap-1.5 ml-auto';
    if (btnLabel && bisaLabelRak && btnLabel.parentNode) {
      btnLabel.parentNode.insertBefore(rightActions, btnLabel);
      rightActions.appendChild(btnLabel);
    } else {
      btnEdit.parentNode.insertBefore(rightActions, btnEdit);
    }
    rightActions.appendChild(btnEdit);
    rightActions.appendChild(btnHapus);
  } else {
    btnEdit.className = 'btn btn-outline btn-icon w-7 h-7 shrink-0';
    btnHapus.className = 'btn btn-outline btn-icon hover:!border-danger hover:!text-danger w-7 h-7 shrink-0';
  }

  return clone;
}

function renderTableRow(item) {
  const pct = progressPercent(item);
  const template = document.getElementById('tmpl-table-row');
  const clone = template.content.cloneNode(true);

  const dotEl = clone.querySelector('.js-dot');
  if (dotEl) dotEl.classList.add(`dot-${item.status}`);

  // Status dot color indicator next to name
  const statusDot = clone.querySelector('.js-status-dot');
  if (statusDot) {
    const dotColors = { aman: '#22c55e', berisiko: '#f59e0b', kritis: '#e11d48' };
    statusDot.style.backgroundColor = dotColors[item.status] || '#8a9a8f';
  }

  clone.querySelector('.js-nama').textContent = item.nama;
  clone.querySelector('.js-kategori').textContent = item.kategori;
  clone.querySelector('.js-stok').textContent = item.jumlah_stok;
  clone.querySelector('.js-kadaluarsa').textContent = formatTanggal(item.tanggal_kadaluarsa);
  clone.querySelector('.js-sisa-text').textContent = sisaHariText(item.sisa_hari);

  // Color the sisa text based on status
  const sisaText = clone.querySelector('.js-sisa-text');
  const sisaColors = { aman: '#166534', berisiko: '#92400e', kritis: '#9f1239' };
  sisaText.style.color = sisaColors[item.status] || '';

  const progressBar = clone.querySelector('.js-progress-bar');
  if (progressBar) {
    progressBar.style.width = `${pct}%`;
    progressBar.classList.add(`progress-${item.status}`);
  }

  const badge = clone.querySelector('.js-status-badge');
  badge.textContent = item.status.charAt(0).toUpperCase() + item.status.slice(1);
  badge.classList.add(`badge-${item.status}`);

  clone.querySelector('.js-actions').appendChild(renderActionButtons(item, false));

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

  clone.querySelector('.js-actions').appendChild(renderActionButtons(item, true));

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

function renderFilters() {
  if (!el.chipFilters) return;
  el.chipFilters.innerHTML = '';

  // 1. Chip "Semua"
  const chipSemua = document.createElement('div');
  chipSemua.className = 'chip';
  chipSemua.textContent = 'Semua';
  if (activeKategori === 'Semua' && activeStatus === 'Semua') {
    chipSemua.classList.add('chip-active');
  }
  chipSemua.addEventListener('click', () => {
    activeKategori = 'Semua';
    activeStatus = 'Semua';
    renderFilters();
    applyFilters();
  });
  el.chipFilters.appendChild(chipSemua);

  // 2. Status Chips (Kritis, Berisiko, Aman)
  const statusItems = [
    { key: 'kritis', label: 'Kritis' },
    { key: 'berisiko', label: 'Berisiko' },
    { key: 'aman', label: 'Aman' },
  ];

  statusItems.forEach(({ key, label }) => {
    const chip = document.createElement('div');
    chip.className = `chip chip-status-${key}`;

    const dot = document.createElement('span');
    dot.className = `dot dot-${key} mr-1.5 shrink-0`;
    chip.appendChild(dot);

    const textSpan = document.createElement('span');
    textSpan.textContent = label;
    chip.appendChild(textSpan);

    if (activeStatus === key) {
      chip.classList.add('chip-active');
      setTimeout(() => chip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }), 50);
    }

    chip.addEventListener('click', (e) => {
      if (activeStatus === key) {
        activeStatus = 'Semua';
      } else {
        activeStatus = key;
        activeKategori = 'Semua'; // Reset Kategori saat memilih Status agar tidak menghasilkan 0 barang
      }
      renderFilters();
      applyFilters();
    });
    el.chipFilters.appendChild(chip);
  });

  // 3. Category Chips
  const categories = [...new Set(allItems.map((item) => item.kategori))];
  categories.forEach((kategori) => {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.textContent = kategori;
    if (activeKategori === kategori) {
      chip.classList.add('chip-active');
      setTimeout(() => chip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }), 50);
    }

    chip.addEventListener('click', () => {
      if (activeKategori === kategori) {
        activeKategori = 'Semua';
      } else {
        activeKategori = kategori;
        activeStatus = 'Semua'; // Reset Status saat memilih Kategori agar tidak menghasilkan 0 barang
      }
      renderFilters();
      applyFilters();
    });
    el.chipFilters.appendChild(chip);
  });

  // Datalist options for modal form
  if (el.daftarKategori) {
    el.daftarKategori.innerHTML = '';
    categories.forEach(k => {
      const opt = document.createElement('option');
      opt.value = k;
      el.daftarKategori.appendChild(opt);
    });
  }
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
    renderFilters();
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
if (el.btnTambahFab) el.btnTambahFab.addEventListener('click', () => openFormModal());
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
  const isKadaluarsa = item.sisa_hari < 0;
  el.modalHapusText.textContent = isKadaluarsa
    ? `"${item.nama}" (${item.jumlah_stok} unit) telah lewat masa kadaluarsa dan akan dicatat ke Riwayat sebagai barang terbuang/pemusnahan.`
    : `"${item.nama}" (${item.jumlah_stok} unit) akan dihapus dari stok aktif dan dicatat ke Riwayat sebagai barang terbuang.`;
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
    showToast('Barang berhasil dihapus dan dicatat ke riwayat sebagai pangan terbuang.');
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
  if (button.dataset.action === 'label') openLabelModal(item);
}

el.tableBody.addEventListener('click', handleActionClick);
el.cards.addEventListener('click', handleActionClick);

// ---------- AI Insight Panel ----------

function renderAiCard(rekomendasi) {
  const item = rekomendasi.item;
  if (!item) return null;

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

  const isKadaluarsa = item.sisa_hari < 0;
  const jenis = (rekomendasi.jenis_saran || '').toLowerCase();
  const isTindakanBuang = ['dibuang', 'retur', 'pemusnahan'].includes(jenis) || isKadaluarsa;

  if (rekomendasi.diterapkan) {
    const span = document.createElement('span');
    span.className = 'inline-flex items-center gap-1.5 text-[13px] font-medium text-success ml-auto';
    span.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg> Diterapkan`;
    actions.appendChild(span);
  } else if (isTindakanBuang) {
    // 1. Kalau buang barang -> 1 tombol Buang Barang
    const btnBuang = document.createElement('button');
    btnBuang.type = 'button';
    btnBuang.dataset.buangItem = item.id;
    btnBuang.dataset.recId = rekomendasi.id;
    btnBuang.className = 'btn btn-danger h-9 px-4 text-[12.5px] ml-auto inline-flex items-center gap-1.5 font-semibold';
    btnBuang.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/></svg> <span>Buang Barang</span>`;
    actions.appendChild(btnBuang);
  } else if (jenis === 'diskon') {
    // 2. Kalau diskon -> 2 pilihan: Print Label atau Print Kupon
    const btnLabel = document.createElement('button');
    btnLabel.type = 'button';
    btnLabel.dataset.cetakLabel = rekomendasi.id;
    btnLabel.className = 'btn btn-outline h-9 px-3 text-[12px] inline-flex items-center gap-1.5 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 transition font-medium';
    btnLabel.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><circle cx="7" cy="7" r=".5" fill="currentColor"/></svg> <span>Print Label</span>`;
    actions.appendChild(btnLabel);

    const btnVoucher = document.createElement('button');
    btnVoucher.type = 'button';
    btnVoucher.dataset.buatVoucher = rekomendasi.id;
    btnVoucher.className = 'btn bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 h-9 px-3.5 text-[12px] inline-flex items-center gap-1.5 font-semibold transition ml-auto';
    btnVoucher.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg> <span>Print Kupon</span>`;
    actions.appendChild(btnVoucher);
  } else if (jenis === 'bundling') {
    // 3. Kalau bundling -> 1 tombol Print Label Bundling
    const btnBundling = document.createElement('button');
    btnBundling.type = 'button';
    btnBundling.dataset.cetakBundling = rekomendasi.id;
    btnBundling.className = 'btn bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 h-9 px-3.5 text-[12.5px] ml-auto inline-flex items-center gap-1.5 font-semibold transition';
    btnBundling.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/></svg> <span>Print Label Bundling</span>`;
    actions.appendChild(btnBundling);
  } else if (jenis === 'distribusi') {
    // 4. Kalau distribusi -> 1 tombol Salurkan Pangan
    const btnDistribusi = document.createElement('button');
    btnDistribusi.type = 'button';
    btnDistribusi.dataset.terapkan = rekomendasi.id;
    btnDistribusi.className = 'btn btn-primary h-9 px-3.5 text-[12.5px] ml-auto font-semibold inline-flex items-center gap-1.5';
    btnDistribusi.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg> <span>Salurkan Pangan</span>`;
    actions.appendChild(btnDistribusi);
  } else {
    // Default
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.terapkan = rekomendasi.id;
    btn.className = 'btn btn-primary h-9 px-3.5 text-[13px] ml-auto font-semibold';
    btn.textContent = 'Tandai Diterapkan';
    actions.appendChild(btn);
  }

  return clone;
}

function renderAiGroup(judul, daftarRekomendasi) {
  const validList = (daftarRekomendasi || []).filter((r) => r && r.item);
  if (validList.length === 0) return null;

  const group = document.createElement('div');
  group.className = 'flex flex-col gap-2.5';

  const header = document.createElement('div');
  header.className = 'text-xs font-semibold text-caption tracking-wide px-1';
  header.textContent = `${judul} · ${validList.length}`;
  group.appendChild(header);

  validList.forEach((r) => {
    const card = renderAiCard(r);
    if (card) group.appendChild(card);
  });
  return group;
}

const AI_SUDAH_DITERAPKAN_JAM = 24;

/**
 * Kartu "Diterapkan" cuma disembunyikan dari TAMPILAN panel setelah 24 jam
 * sejak diterapkan_at (bukan created_at -- yang relevan adalah kapan admin
 * menindaklanjuti, bukan kapan AI membuat sarannya). Data di database dan
 * halaman Riwayat tidak tersentuh sama sekali; ini murni filter render.
 */
function isSudahDiterapkanBaruBaruIni(r) {
  if (!r.diterapkan_at) return true;
  const jamSejakDiterapkan = (Date.now() - new Date(r.diterapkan_at).getTime()) / 3600000;
  return jamSejakDiterapkan < AI_SUDAH_DITERAPKAN_JAM;
}

function getRekomendasiTampil() {
  const perluDitindak = allRekomendasi.filter((r) => !r.diterapkan);
  const sudahDitindak = allRekomendasi.filter((r) => r.diterapkan && isSudahDiterapkanBaruBaruIni(r));
  return { perluDitindak, sudahDitindak };
}

function updateAiFilterUI() {
  const { perluDitindak, sudahDitindak } = getRekomendasiTampil();

  if (el.aiCountSemua) el.aiCountSemua.textContent = perluDitindak.length + sudahDitindak.length;
  if (el.aiCountBelum) el.aiCountBelum.textContent = perluDitindak.length;
  if (el.aiCountSudah) el.aiCountSudah.textContent = sudahDitindak.length;

  if (el.aiFilterTabs) {
    const buttons = el.aiFilterTabs.querySelectorAll('[data-ai-filter]');
    buttons.forEach((btn) => {
      const isActive = btn.dataset.aiFilter === activeAiFilter;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }
}

function renderAiEmptyBelumBox() {
  const emptyBox = document.createElement('div');
  emptyBox.className = 'py-8 px-4 text-center bg-purple-50/40 rounded-xl border border-dashed border-purple-200';
  emptyBox.innerHTML = `
    <div class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-700 mb-2">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
    </div>
    <div class="font-heading text-[14.5px] font-semibold text-primary">Semua saran telah diterapkan!</div>
    <p class="text-xs text-soft mt-0.5">Tidak ada saran AI yang perlu ditindak saat ini.</p>
  `;
  return emptyBox;
}

function renderRekomendasi() {
  el.aiList.innerHTML = '';
  updateAiFilterUI();

  const total = allRekomendasi.length;
  el.aiEmpty.classList.toggle('hidden', total > 0);
  el.aiContainer.classList.toggle('hidden', total === 0);

  if (total === 0) return;

  const { perluDitindak, sudahDitindak } = getRekomendasiTampil();

  const fragment = document.createDocumentFragment();

  if (activeAiFilter === 'semua') {
    if (perluDitindak.length === 0 && sudahDitindak.length === 0) {
      // Semua rekomendasi ada, tapi seluruhnya sudah diterapkan >24 jam --
      // sama seperti tab "Belum" kosong, pakai pesan yang sama (bukan gaya
      // baru), karena secara fungsional tidak ada yang perlu admin lihat.
      fragment.appendChild(renderAiEmptyBelumBox());
    } else {
      const groupPerlu = renderAiGroup('Perlu Ditindak', perluDitindak);
      const groupSudah = renderAiGroup('Diterapkan', sudahDitindak);
      if (groupPerlu) fragment.appendChild(groupPerlu);
      if (groupSudah) fragment.appendChild(groupSudah);
    }
  } else if (activeAiFilter === 'belum') {
    if (perluDitindak.length > 0) {
      const groupPerlu = renderAiGroup('Perlu Ditindak', perluDitindak);
      if (groupPerlu) fragment.appendChild(groupPerlu);
    } else {
      fragment.appendChild(renderAiEmptyBelumBox());
    }
  } else if (activeAiFilter === 'sudah') {
    if (sudahDitindak.length > 0) {
      const groupSudah = renderAiGroup('Diterapkan', sudahDitindak);
      if (groupSudah) fragment.appendChild(groupSudah);
    } else {
      const emptyBox = document.createElement('div');
      emptyBox.className = 'py-8 px-4 text-center bg-purple-50/40 rounded-xl border border-dashed border-purple-200';
      emptyBox.innerHTML = `
        <div class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-700 mb-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div class="font-heading text-[14.5px] font-semibold text-primary">Belum ada saran yang diterapkan</div>
        <p class="text-xs text-soft mt-0.5">Klik tombol "Tandai Diterapkan" pada saran yang telah dijalankan.</p>
      `;
      fragment.appendChild(emptyBox);
    }
  }

  el.aiList.appendChild(fragment);
}

async function loadRekomendasi() {
  el.aiError.classList.add('hidden');
  el.aiLoading.classList.remove('hidden');
  try {
    const data = await fetchRekomendasi();
    allRekomendasi = (data || []).filter((r) => r && r.item);
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

    // Cache Gemini bisa mengembalikan baris database yang sama (id sama)
    // kalau item ini sudah punya rekomendasi hari ini -- jangan prepend
    // duplikat, cukup perbarui entri yang sudah ada dengan data terbaru.
    const sudahAda = allRekomendasi.some((r) => r.id === rekomendasi.id);
    if (sudahAda) {
      allRekomendasi = allRekomendasi.map((r) => (r.id === rekomendasi.id ? rekomendasi : r));
      showToast(`Rekomendasi untuk "${item.nama}" sudah ada, tidak dibuat ulang.`);
    } else {
      allRekomendasi = [rekomendasi, ...allRekomendasi];
      showToast(`Rekomendasi AI untuk "${item.nama}" berhasil dibuat.`);
    }
    renderRekomendasi();
  } catch (err) {
    el.aiError.textContent = err.message || 'Gagal meminta rekomendasi AI.';
    el.aiError.classList.remove('hidden');
  } finally {
    generatingItemId = null;
    applyFilters();
  }
}

el.aiList.addEventListener('click', async (e) => {
  // 1. Handler Cetak Label Rak (Diskon)
  const btnLabel = e.target.closest('[data-cetak-label]');
  if (btnLabel) {
    const id = Number(btnLabel.dataset.cetakLabel);
    const rec = allRekomendasi.find((r) => r.id === id);
    if (rec && rec.item) {
      openLabelModal(rec.item, rec, false);
    }
    return;
  }

  // 2. Handler Cetak Label Paket Bundling
  const btnBundling = e.target.closest('[data-cetak-bundling]');
  if (btnBundling) {
    const id = Number(btnBundling.dataset.cetakBundling);
    const rec = allRekomendasi.find((r) => r.id === id);
    if (rec && rec.item) {
      openLabelModal(rec.item, rec, true);
    }
    return;
  }

  // 3. Handler Buat Kupon Barcode
  const btnVoucher = e.target.closest('[data-buat-voucher]');
  if (btnVoucher) {
    const id = Number(btnVoucher.dataset.buatVoucher);
    const rec = allRekomendasi.find((r) => r.id === id);
    if (rec && rec.item) {
      openVoucherModal(rec.item, rec);
    }
    return;
  }

  // 4. Handler Tombol Buang Barang (dari saran AI)
  const btnBuang = e.target.closest('[data-buang-item]');
  if (btnBuang) {
    const itemId = Number(btnBuang.dataset.buangItem);
    const recId = Number(btnBuang.dataset.recId);
    const item = allItems.find((i) => i.id === itemId);
    if (item) {
      openDeleteModal(item);
    }
    return;
  }

  // 5. Handler Tandai / Terapkan Aksi
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

// ---------- Modal Cetak Label Rak Promo & Diskon ----------

let currentLabelData = {
  nama: '',
  kategori: '',
  kadaluarsa: '',
  sisaHari: 0,
  hargaAsli: 20000,
  diskonPct: 50,
  tagline: 'FOOD RESCUE DEAL',
  qty: 4,
  sku: 'SKU-SPC-001',
};

const DEFAULT_PRICES = {
  sayur: 12000,
  buah: 28000,
  'olahan susu': 24000,
  roti: 16000,
  sembako: 65000,
  daging: 45000,
  ikan: 35000,
  bumbu: 8000,
};

function formatRupiah(num) {
  return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

function extractDiscountPct(saranText) {
  if (!saranText) return 50;
  const match = saranText.match(/(\d{1,2})\s*%/);
  if (match && match[1]) {
    const val = Number(match[1]);
    if (val >= 10 && val <= 90) return val;
  }
  return 50;
}

function openLabelModal(item, rekomendasi = null, isBundling = false) {
  if (el.modalScanVoucher) closeScanVoucherModal();
  if (el.modalVoucher) closeVoucherModal();
  if (el.modalForm) closeFormModal();
  if (el.modalHapus) closeDeleteModal();

  if (!item || item.sisa_hari < 0) {
    showToast('Barang yang sudah kadaluarsa tidak dapat dibuatkan label rak.');
    return;
  }

  const isBundlingMode = Boolean(isBundling || (rekomendasi && (rekomendasi.jenis_saran || '').toLowerCase() === 'bundling'));
  const katKey = (item.kategori || '').toLowerCase().trim();
  const defaultHarga = DEFAULT_PRICES[katKey] || 20000;
  const pct = rekomendasi ? extractDiscountPct(rekomendasi.isi_saran) : (isBundlingMode ? 30 : 50);

  currentLabelData = {
    nama: item.nama,
    kategori: isBundlingMode ? `${item.kategori} · Paket Bundling` : item.kategori,
    kadaluarsa: item.tanggal_kadaluarsa ? formatTanggal(item.tanggal_kadaluarsa) : 'Hari Ini',
    sisaHari: item.sisa_hari,
    hargaAsli: defaultHarga,
    diskonPct: pct,
    tagline: isBundlingMode ? 'PROMO PAKET BUNDLING' : 'FOOD RESCUE DEAL',
    qty: 4,
    rekomendasiId: rekomendasi ? rekomendasi.id : null,
  };

  currentLabelData.qty = populateLabelQtyOptions(item);

  if (el.labelInputNama) el.labelInputNama.value = currentLabelData.nama;
  if (el.labelInputKategori) el.labelInputKategori.value = currentLabelData.kategori;
  if (el.labelInputKadaluarsa) el.labelInputKadaluarsa.value = currentLabelData.kadaluarsa;
  if (el.labelInputHargaAsli) el.labelInputHargaAsli.value = currentLabelData.hargaAsli;
  if (el.labelInputTagline) el.labelInputTagline.value = currentLabelData.tagline;

  updateLabelPctButtons(currentLabelData.diskonPct);
  updateLabelPreview();

  if (el.modalLabelDiskon) el.modalLabelDiskon.classList.remove('hidden');
}

function closeLabelModal() {
  if (el.modalLabelDiskon) el.modalLabelDiskon.classList.add('hidden');
}

function updateLabelPctButtons(selectedPct) {
  if (!el.labelPctGroup) return;
  const buttons = el.labelPctGroup.querySelectorAll('[data-pct]');
  buttons.forEach((btn) => {
    btn.classList.toggle('active', Number(btn.dataset.pct) === Number(selectedPct));
  });
}

function updateLabelPreview() {
  const hargaAsli = Math.max(0, Number(el.labelInputHargaAsli?.value || 0));
  const pct = currentLabelData.diskonPct;
  const hargaDiskon = Math.max(0, Math.round((hargaAsli * (100 - pct) / 100) / 500) * 500);

  currentLabelData.hargaAsli = hargaAsli;
  currentLabelData.tagline = el.labelInputTagline?.value || 'FOOD RESCUE DEAL';
  currentLabelData.qty = Number(el.labelInputQty?.value || 4);

  if (el.previewNama) el.previewNama.textContent = currentLabelData.nama;
  if (el.previewKategori) el.previewKategori.textContent = `${currentLabelData.kategori} · ${sisaHariText(currentLabelData.sisaHari)}`;
  if (el.previewKadaluarsa) el.previewKadaluarsa.textContent = currentLabelData.kadaluarsa;
  if (el.previewTagline) el.previewTagline.textContent = currentLabelData.tagline;
  if (el.previewPct) el.previewPct.textContent = `-${pct}%`;
  if (el.previewHargaAsli) el.previewHargaAsli.textContent = formatRupiah(hargaAsli);
  if (el.previewHargaDiskon) el.previewHargaDiskon.textContent = formatRupiah(hargaDiskon);
}

function printShelfLabels() {
  if (!el.shelfTagPreview || !el.printableLabelsArea) return;
  if (el.printableVouchersArea) el.printableVouchersArea.innerHTML = '';
  const qty = currentLabelData.qty;

  const previewHTML = el.shelfTagPreview.outerHTML;
  el.printableLabelsArea.innerHTML = '';

  for (let i = 0; i < qty; i++) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'shelf-tag-print-item';
    itemDiv.innerHTML = previewHTML;
    el.printableLabelsArea.appendChild(itemDiv);
  }

  if (currentLabelData.rekomendasiId) {
    terapkanRekomendasi(currentLabelData.rekomendasiId).then((updated) => {
      allRekomendasi = allRekomendasi.map((r) => (r.id === updated.id ? updated : r));
      renderRekomendasi();
      applyFilters();
    }).catch(() => {});
  }

  const fileTitle = `Label-Rak-${sanitizeFilename(currentLabelData.nama)}-${tanggalFileStamp()}`;
  printDocument(fileTitle, closeLabelModal);
}

// Event Listeners for Label Modal
if (el.modalLabelClose) el.modalLabelClose.addEventListener('click', closeLabelModal);
if (el.modalLabelCancel) el.modalLabelCancel.addEventListener('click', closeLabelModal);
if (el.modalLabelDiskon) el.modalLabelDiskon.addEventListener('click', (e) => { if (e.target === el.modalLabelDiskon) closeLabelModal(); });
if (el.btnPrintLabels) el.btnPrintLabels.addEventListener('click', printShelfLabels);

if (el.labelInputHargaAsli) el.labelInputHargaAsli.addEventListener('input', updateLabelPreview);
if (el.labelInputTagline) el.labelInputTagline.addEventListener('change', updateLabelPreview);
if (el.labelInputQty) el.labelInputQty.addEventListener('change', updateLabelPreview);

if (el.labelPctGroup) {
  el.labelPctGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-pct]');
    if (!btn) return;
    currentLabelData.diskonPct = Number(btn.dataset.pct);
    updateLabelPctButtons(currentLabelData.diskonPct);
    updateLabelPreview();
  });
}

// ---------- Init ----------

if (el.aiFilterTabs) {
  el.aiFilterTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-ai-filter]');
    if (!btn) return;
    activeAiFilter = btn.dataset.aiFilter;
    renderRekomendasi();
  });
}

el.cari.addEventListener('input', applyFilters);
el.resetFilter.addEventListener('click', () => {
  activeKategori = 'Semua';
  activeStatus = 'Semua';
  el.cari.value = '';
  renderFilters();
  applyFilters();
});

// ---------- Barcode & Voucher Engine (API-Ready) ----------

function generateBarcodeSvgBars(text) {
  const clean = String(text || 'VCHR-SPC-88219').toUpperCase().replace(/[^0-9A-Z\-]/g, '-');
  const patterns = {
    '0': '101001101101', '1': '110100101011', '2': '101100101011', '3': '110110010101',
    '4': '101001101011', '5': '110100110101', '6': '101100110101', '7': '101001011011',
    '8': '110100101101', '9': '101100101101', 'A': '110101001011', 'B': '101101001011',
    'C': '110110100101', 'D': '101011001011', 'E': '110101100101', 'F': '101101100101',
    'G': '101010011011', 'H': '110101001101', 'I': '101101001101', 'J': '101011001101',
    'K': '110101010011', 'L': '101101010011', 'M': '110110101001', 'N': '101011010011',
    'O': '110101101001', 'P': '101101101001', 'Q': '101010110011', 'R': '110101011001',
    'S': '101101011001', 'T': '101011011001', 'U': '110010101011', 'V': '100110101011',
    'W': '110011010101', 'X': '100101101011', 'Y': '110010110101', 'Z': '100110110101',
    '-': '100101011011', '*': '100101101101'
  };

  const startStop = patterns['*'];
  let bitString = startStop + '0';
  for (const ch of clean) {
    const p = patterns[ch] || patterns['-'];
    bitString += p + '0';
  }
  bitString += startStop;

  let rects = '';
  let currentBarWidth = 0;
  let barStart = 0;

  for (let i = 0; i < bitString.length; i++) {
    if (bitString[i] === '1') {
      if (currentBarWidth === 0) barStart = i;
      currentBarWidth++;
    } else {
      if (currentBarWidth > 0) {
        rects += `<rect x="${barStart}" y="0" width="${currentBarWidth}" height="24" fill="currentColor" />`;
        currentBarWidth = 0;
      }
    }
  }
  if (currentBarWidth > 0) {
    rects += `<rect x="${barStart}" y="0" width="${currentBarWidth}" height="24" fill="currentColor" />`;
  }

  return { totalWidth: bitString.length, rects };
}

function generateVoucherCode(targetName = 'SPC') {
  const prefix = targetName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'SPC';
  const randNum = Math.floor(10000 + Math.random() * 90000);
  return `VCHR-${prefix}-${randNum}`;
}

let currentVoucherData = {
  judul: 'Food Rescue Deal',
  target: 'Semua Kategori',
  tipe: 'persen',
  nilai: 50,
  minBelanja: 25000,
  kadaluarsa: '2026-08-25',
  kuota: 10,
  qty: 4,
  kode: 'VCHR-SPC-88219'
};

function populateVoucherTargetOptions(selectedVal = 'Semua') {
  if (!el.voucherInputTarget) return;
  el.voucherInputTarget.innerHTML = '';

  const optGlobal = document.createElement('option');
  optGlobal.value = 'Semua';
  optGlobal.textContent = 'Semua Kategori (Global)';
  optGlobal.dataset.prefix = 'SPC';
  el.voucherInputTarget.appendChild(optGlobal);

  const categories = [...new Set(allItems.map((i) => i.kategori))];
  const catGroup = document.createElement('optgroup');
  catGroup.label = 'Kategori Produk';
  categories.forEach((cat) => {
    const opt = document.createElement('option');
    opt.value = `Kategori: ${cat}`;
    opt.textContent = `Semua ${cat}`;
    opt.dataset.prefix = cat.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'CAT';
    catGroup.appendChild(opt);
  });
  el.voucherInputTarget.appendChild(catGroup);

  const itemGroup = document.createElement('optgroup');
  itemGroup.label = 'Pangan Spesifik (Stok Gudang)';
  allItems.forEach((i) => {
    const opt = document.createElement('option');
    opt.value = i.nama;
    opt.textContent = `${i.nama} (${i.kategori} · ${sisaHariText(i.sisa_hari)})`;
    opt.dataset.prefix = i.nama.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'ITM';
    opt.dataset.kadaluarsa = i.tanggal_kadaluarsa;
    opt.dataset.kategori = i.kategori;
    itemGroup.appendChild(opt);
  });
  el.voucherInputTarget.appendChild(itemGroup);

  el.voucherInputTarget.value = selectedVal;
}

const QTY_DEFAULT_OPTIONS = [1, 2, 4, 6];
const QTY_MAKS_BACKEND = 50;

/**
 * Dipakai untuk modal Kupon maupun Label Rak: kalau ada item spesifik,
 * batasi opsi maksimal sejumlah stok barang (mencetak lebih banyak
 * kupon/label daripada barangnya sendiri tidak masuk akal) dan tambahkan
 * opsi "Sebanyak Stok". Tanpa item (voucher kategori/global), pakai
 * pilihan tetap karena tidak terikat satu barang.
 */
function populateQtyOptions(selectEl, item, satuan, defaultQty = 4) {
  if (!selectEl) return defaultQty;
  selectEl.innerHTML = '';

  if (!item) {
    QTY_DEFAULT_OPTIONS.forEach((n) => {
      const opt = document.createElement('option');
      opt.value = String(n);
      opt.textContent = n === 4 ? `${n} ${satuan} (1 Lembar)` : `${n} ${satuan}`;
      selectEl.appendChild(opt);
    });
    const pilihan = QTY_DEFAULT_OPTIONS.includes(defaultQty) ? defaultQty : 4;
    selectEl.value = String(pilihan);
    return pilihan;
  }

  const maksStok = Math.max(1, Math.min(Number(item.jumlah_stok) || 1, QTY_MAKS_BACKEND));
  const opsi = QTY_DEFAULT_OPTIONS.filter((n) => n <= maksStok);
  if (opsi.length === 0 || opsi[opsi.length - 1] !== maksStok) {
    opsi.push(maksStok);
  }

  opsi.forEach((n) => {
    const opt = document.createElement('option');
    opt.value = String(n);
    opt.textContent = n === maksStok ? `Sebanyak Stok (${n} ${satuan.toLowerCase()})` : `${n} ${satuan}`;
    selectEl.appendChild(opt);
  });

  const pilihan = Math.min(defaultQty, maksStok);
  selectEl.value = String(pilihan);
  return pilihan;
}

function populateVoucherQtyOptions(item, defaultQty = 4) {
  return populateQtyOptions(el.voucherInputQty, item, 'Kupon', defaultQty);
}

function populateLabelQtyOptions(item, defaultQty = 4) {
  return populateQtyOptions(el.labelInputQty, item, 'Label', defaultQty);
}

let voucherOpenedFromScanner = false;

function openVoucherModal(item = null, rekomendasi = null, fromScanner = false) {
  voucherOpenedFromScanner = Boolean(fromScanner);
  if (fromScanner) {
    closeScanVoucherModal();
  }
  if (el.modalLabelDiskon) closeLabelModal();
  if (el.modalForm) closeFormModal();
  if (el.modalHapus) closeDeleteModal();

  const targetName = item ? item.nama : 'Semua';
  const targetKategori = item ? item.kategori : 'Semua Kategori';
  const defaultDiskon = rekomendasi ? extractDiscountPct(rekomendasi.isi_saran) : 50;
  const kode = generateVoucherCode(item ? item.nama : 'SPC');

  populateVoucherTargetOptions(targetName);
  const qtyDefault = populateVoucherQtyOptions(item);

  let expDate = '2026-08-25';
  if (item && item.tanggal_kadaluarsa) {
    expDate = item.tanggal_kadaluarsa;
  }

  // Kupon untuk barang/rekomendasi spesifik tidak masuk akal punya syarat
  // belanja minimum -- barang itu sendiri yang jadi syaratnya. Backend
  // memaksa ini ke 0 juga (jangan andalkan frontend), tapi field disembunyikan
  // di sini supaya admin tidak bingung kenapa nilainya diabaikan.
  const untukTargetSpesifik = Boolean(item || rekomendasi);

  currentVoucherData = {
    judul: item ? `Food Rescue Promo · ${targetName}` : 'Kupon Penyelamatan Pangan Kasir',
    target: targetKategori,
    tipe: 'persen',
    nilai: defaultDiskon,
    minBelanja: untukTargetSpesifik ? 0 : 25000,
    kadaluarsa: expDate,
    qty: qtyDefault,
    kode: kode,
    rekomendasiId: rekomendasi ? rekomendasi.id : null,
  };

  if (el.voucherInputJudul) el.voucherInputJudul.value = currentVoucherData.judul;
  if (el.voucherInputTarget) el.voucherInputTarget.value = targetName;
  if (el.voucherInputKadaluarsa) el.voucherInputKadaluarsa.value = currentVoucherData.kadaluarsa;
  if (el.voucherInputMinBelanja) {
    el.voucherInputMinBelanja.value = currentVoucherData.minBelanja;
    const minBelanjaField = el.voucherInputMinBelanja.closest('div');
    if (minBelanjaField) minBelanjaField.classList.toggle('hidden', untukTargetSpesifik);
  }
  if (el.voucherInputQty) el.voucherInputQty.value = currentVoucherData.qty;
  if (el.voucherInputKode) el.voucherInputKode.value = currentVoucherData.kode;

  updateVoucherDiskonButtons(currentVoucherData.tipe, currentVoucherData.nilai);
  updateVoucherPreview();

  if (el.modalVoucher) el.modalVoucher.classList.remove('hidden');
}

function closeVoucherModal() {
  if (el.modalVoucher) el.modalVoucher.classList.add('hidden');
  if (voucherOpenedFromScanner) {
    voucherOpenedFromScanner = false;
    openScanVoucherModal();
    if (el.scanInputKode && currentVoucherData.kode) {
      el.scanInputKode.value = currentVoucherData.kode;
    }
  }
}

function updateVoucherDiskonButtons(selectedTipe, selectedVal) {
  if (!el.voucherDiskonGroup) return;
  const buttons = el.voucherDiskonGroup.querySelectorAll('[data-val]');
  buttons.forEach((btn) => {
    const isMatch = btn.dataset.tipe === selectedTipe && Number(btn.dataset.val) === Number(selectedVal);
    btn.classList.toggle('active', isMatch);
  });
}

function updateVoucherPreview() {
  if (el.voucherInputJudul && el.voucherInputJudul.value) {
    currentVoucherData.judul = el.voucherInputJudul.value;
  }
  currentVoucherData.minBelanja = Math.max(0, Number(el.voucherInputMinBelanja?.value || 0));
  currentVoucherData.kadaluarsa = el.voucherInputKadaluarsa?.value || '2026-08-25';
  currentVoucherData.qty = Number(el.voucherInputQty?.value || 4);
  currentVoucherData.kode = (el.voucherInputKode?.value || 'VCHR-SPC-88219').trim().toUpperCase();

  if (el.voucherPreviewJudul) el.voucherPreviewJudul.textContent = currentVoucherData.judul;
  if (el.voucherPreviewTarget) el.voucherPreviewTarget.textContent = `Khusus: ${currentVoucherData.target}`;
  if (el.voucherPreviewMinBelanja) el.voucherPreviewMinBelanja.textContent = formatRupiah(currentVoucherData.minBelanja);
  // Kupon tanpa syarat belanja minimum (item/rekomendasi spesifik) tidak
  // perlu menampilkan baris "MIN. BELANJA" di stiker cetak -- sel Masa
  // Berlaku melebar mengisi grid 2 kolom yang sama.
  const tanpaMinBelanja = currentVoucherData.minBelanja <= 0;
  if (el.voucherPreviewMinBelanjaCell) el.voucherPreviewMinBelanjaCell.classList.toggle('hidden', tanpaMinBelanja);
  if (el.voucherPreviewKadaluarsaCell) el.voucherPreviewKadaluarsaCell.classList.toggle('col-span-2', tanpaMinBelanja);
  if (el.voucherPreviewKadaluarsa) el.voucherPreviewKadaluarsa.textContent = formatTanggal(currentVoucherData.kadaluarsa);
  if (el.voucherPreviewKode) el.voucherPreviewKode.textContent = currentVoucherData.kode;

  if (el.voucherPreviewBadge) {
    if (currentVoucherData.tipe === 'persen') {
      el.voucherPreviewBadge.textContent = `-${currentVoucherData.nilai}%`;
    } else {
      el.voucherPreviewBadge.textContent = `-Rp ${Number(currentVoucherData.nilai).toLocaleString('id-ID')}`;
    }
  }

  if (el.voucherPreviewBarcodeSvg) {
    const barcodeData = generateBarcodeSvgBars(currentVoucherData.kode);
    el.voucherPreviewBarcodeSvg.setAttribute('viewBox', `0 0 ${barcodeData.totalWidth} 24`);
    el.voucherPreviewBarcodeSvg.innerHTML = barcodeData.rects;
  }
}

async function saveAndPrintVouchers() {
  const itemTarget = allItems.find((i) => i.nama === currentVoucherData.target || `${currentVoucherData.target}`.startsWith(i.nama));

  const payload = {
    item_id: itemTarget ? itemTarget.id : null,
    rekomendasi_id: currentVoucherData.rekomendasiId || null,
    judul: currentVoucherData.judul,
    target: currentVoucherData.target,
    tipe: currentVoucherData.tipe,
    nilai: currentVoucherData.nilai,
    min_belanja: currentVoucherData.minBelanja,
    jumlah: currentVoucherData.qty,
    berlaku_sampai: currentVoucherData.kadaluarsa,
  };

  // Satu kupon sekali pakai per lembar: backend membuat `jumlah` voucher
  // terpisah dengan kode unik masing-masing, bukan 1 voucher digandakan
  // tampilannya.
  let voucherList;
  try {
    voucherList = await createVoucher(payload);
  } catch (err) {
    showToast(err.message || 'Gagal menyimpan voucher ke server.');
    return;
  }

  const voucherPertama = voucherList[0];

  // Kode final ditentukan backend, bukan yang di-generate di frontend.
  currentVoucherData.kode = voucherPertama.kode;
  if (el.voucherInputKode) el.voucherInputKode.value = voucherPertama.kode;
  if (el.voucherPreviewKode) el.voucherPreviewKode.textContent = voucherPertama.kode;
  if (el.voucherPreviewBarcodeSvg) {
    const barcodeData = generateBarcodeSvgBars(voucherPertama.kode);
    el.voucherPreviewBarcodeSvg.setAttribute('viewBox', `0 0 ${barcodeData.totalWidth} 24`);
    el.voucherPreviewBarcodeSvg.innerHTML = barcodeData.rects;
  }

  await renderQuickVouchers();
  showToast(`${voucherList.length} kupon berhasil disimpan ke sistem kasir.`);

  if (currentVoucherData.rekomendasiId) {
    terapkanRekomendasi(currentVoucherData.rekomendasiId).then((updated) => {
      allRekomendasi = allRekomendasi.map((r) => (r.id === updated.id ? updated : r));
      renderRekomendasi();
      applyFilters();
    }).catch(() => {});
  }

  if (!el.voucherTicketPreview || !el.printableVouchersArea) return;
  if (el.printableLabelsArea) el.printableLabelsArea.innerHTML = '';
  const previewHTML = el.voucherTicketPreview.outerHTML;

  el.printableVouchersArea.innerHTML = '';
  voucherList.forEach((v) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'voucher-print-item';
    itemDiv.innerHTML = previewHTML;

    const kodeEl = itemDiv.querySelector('#voucher-preview-kode');
    if (kodeEl) kodeEl.textContent = v.kode;

    const barcodeEl = itemDiv.querySelector('#voucher-preview-barcode-svg');
    if (barcodeEl) {
      const barcodeData = generateBarcodeSvgBars(v.kode);
      barcodeEl.setAttribute('viewBox', `0 0 ${barcodeData.totalWidth} 24`);
      barcodeEl.innerHTML = barcodeData.rects;
    }

    el.printableVouchersArea.appendChild(itemDiv);
  });

  const fileTitle = `Kupon-${sanitizeFilename(currentVoucherData.target)}-${tanggalFileStamp()}`;
  printDocument(fileTitle, closeVoucherModal);
}

// ---------- Simulator Scanner & Validasi Kasir ----------

/**
 * Markup "ajakan scan" default -- dipakai saat modal baru dibuka maupun
 * saat hasil validasi lama diinvalidasi (mis. nominal belanja berubah),
 * supaya kasir tidak mengira aplikasinya rusak saat area hasil "kosong".
 */
function resetScanResultBox(pesan = 'Ketik atau pilih kode barcode di atas, lalu klik "Validasi"') {
  if (!el.scanResultContainer) return;
  el.scanResultContainer.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9aa89e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-1 opacity-60">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" />
    </svg>
    <span class="text-muted font-medium text-[11px]">${esc(pesan)}</span>
  `;
}

function openScanVoucherModal() {
  if (el.modalLabelDiskon) closeLabelModal();
  if (el.modalVoucher) closeVoucherModal();
  if (el.modalForm) closeFormModal();
  if (el.modalHapus) closeDeleteModal();

  if (el.modalScanVoucher) el.modalScanVoucher.classList.remove('hidden');
  renderQuickVouchers();
  if (el.scanInputKode) {
    el.scanInputKode.value = '';
    el.scanInputKode.focus();
  }
  resetScanResultBox();
}

function closeScanVoucherModal() {
  if (el.modalScanVoucher) el.modalScanVoucher.classList.add('hidden');
  stopScanCamera();
}

async function renderQuickVouchers() {
  if (!el.scanQuickVouchers) return;

  let vouchers = [];
  try {
    vouchers = await fetchVouchers({ status: 'aktif' });
  } catch (err) {
    el.scanQuickVouchers.innerHTML = '<span class="text-gray-400 text-xs italic">Gagal memuat voucher dari server.</span>';
    return;
  }
  vouchers = vouchers.filter((v) => v.terpakai < v.kuota);
  el.scanQuickVouchers.innerHTML = '';

  if (vouchers.length === 0) {
    el.scanQuickVouchers.innerHTML = '<span class="text-gray-400 text-xs italic">Belum ada voucher aktif.</span>';
    return;
  }

  vouchers.slice(0, 4).forEach((v) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'px-1.5 py-0.5 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 rounded-md text-[10px] sm:text-[11px] font-mono font-semibold transition cursor-pointer shrink-0';
    chip.textContent = v.kode;
    chip.title = `${v.judul} (${v.tipe === 'persen' ? '-' + v.nilai + '%' : '-Rp ' + v.nilai.toLocaleString('id-ID')})`;
    chip.addEventListener('click', () => {
      if (el.scanInputKode) el.scanInputKode.value = v.kode;
      doValidateVoucher();
    });
    el.scanQuickVouchers.appendChild(chip);
  });
}

async function doValidateVoucher() {
  const kode = (el.scanInputKode?.value || '').trim().toUpperCase();
  const totalBelanja = Number(el.scanInputBelanja?.value || 0);

  if (!kode) {
    showToast('Masukkan kode voucher terlebih dahulu.');
    return;
  }

  let voucher;
  try {
    voucher = await validasiVoucher(kode, totalBelanja);
  } catch (err) {
    const pesan = err.message || 'Voucher tidak dapat divalidasi.';
    const belumKadaluarsa = !pesan.toLowerCase().includes('kadaluarsa') && !pesan.toLowerCase().includes('berlaku');
    const isNotFound = pesan.toLowerCase().includes('tidak ditemukan');
    const isKuotaHabis = pesan.toLowerCase().includes('kuota');
    const isMinBelanja = pesan.toLowerCase().includes('minimal');

    if (isMinBelanja) {
      el.scanResultContainer.innerHTML = `
        <div class="w-full p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-left">
          <div class="flex items-center gap-1.5 font-bold text-xs">
            <span>⚠️ Belum Memenuhi Minimal Belanja</span>
          </div>
          <div class="text-[11px] mt-1">${esc(pesan)}</div>
        </div>
      `;
    } else if (isNotFound) {
      el.scanResultContainer.innerHTML = `
        <div class="w-full p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex flex-col items-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="mb-1"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>
          <strong class="font-bold text-xs">Voucher Tidak Ditemukan!</strong>
          <span class="text-[11px] mt-0.5">Kode "${esc(kode)}" tidak terdaftar di database server.</span>
        </div>
      `;
    } else if (isKuotaHabis) {
      el.scanResultContainer.innerHTML = `
        <div class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 flex flex-col items-center">
          <strong class="font-bold text-xs">Kuota Kupon Habis!</strong>
          <span class="text-[11px] mt-0.5">${esc(pesan)}</span>
        </div>
      `;
    } else if (!belumKadaluarsa) {
      el.scanResultContainer.innerHTML = `
        <div class="w-full p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex flex-col items-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="mb-1"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
          <strong class="font-bold text-xs">Kupon Telah Kadaluarsa!</strong>
          <span class="text-[11px] mt-0.5">${esc(pesan)}</span>
        </div>
      `;
    } else {
      el.scanResultContainer.innerHTML = `
        <div class="w-full p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex flex-col items-center">
          <strong class="font-bold text-xs">Voucher Tidak Valid</strong>
          <span class="text-[11px] mt-0.5">${esc(pesan)}</span>
        </div>
      `;
    }
    return;
  }

  // Backend (validasiVoucher) sudah menolak kalau min_belanja belum
  // terpenuhi dan ditangani di blok catch di atas -- titik ini hanya
  // tercapai kalau syarat belanja sudah lolos.
  let potongan = 0;
  if (voucher.tipe === 'persen') {
    potongan = Math.round((totalBelanja * (voucher.nilai / 100)) / 500) * 500;
  } else {
    potongan = Math.min(totalBelanja, voucher.nilai);
  }
  const totalAkhir = Math.max(0, totalBelanja - potongan);

  el.scanResultContainer.innerHTML = `
    <div class="w-full p-3.5 bg-emerald-50/90 border-2 border-emerald-500 rounded-xl text-left text-emerald-950 flex flex-col gap-2.5 box-border">
      <!-- Header Status & Badge Diskon -->
      <div class="flex items-center justify-between gap-2">
        <span class="inline-flex items-center gap-1 bg-emerald-800 text-white text-[9.5px] font-bold uppercase px-2 py-0.5 rounded-full">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Kupon Valid & Aktif</span>
        </span>
        <span class="text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-300/70">
          Diskon ${voucher.tipe === 'persen' ? voucher.nilai + '%' : formatRupiah(voucher.nilai)}
        </span>
      </div>

      <!-- Nama Kupon / Promo Lengkap -->
      <div>
        <h4 class="font-heading font-bold text-[13px] sm:text-sm text-gray-900 leading-snug break-words">${esc(voucher.judul)}</h4>
        <p class="text-[10.5px] text-gray-500 mt-0.5">Target: ${esc(voucher.target || 'Semua Kategori')} · Sisa kuota: <strong>${voucher.sisa_kuota}</strong></p>
      </div>

      <!-- Rincian Biaya Kasir -->
      <div class="bg-white rounded-lg p-2.5 border border-emerald-200 text-xs flex flex-col gap-1.5 shadow-2xs">
        <div class="flex justify-between items-center text-gray-500 text-[11.5px]">
          <span>Total Belanja Awal:</span>
          <span class="font-medium">${formatRupiah(totalBelanja)}</span>
        </div>
        <div class="flex justify-between items-center text-emerald-700 text-[11.5px]">
          <span>Potongan Kupon:</span>
          <span class="font-bold">-${formatRupiah(potongan)}</span>
        </div>
        <div class="flex justify-between items-center font-bold pt-1.5 border-t border-gray-100 text-gray-900">
          <span class="text-xs text-emerald-950">Total Tagihan Kasir:</span>
          <span class="font-heading text-sm sm:text-base text-emerald-800">${formatRupiah(totalAkhir)}</span>
        </div>
      </div>

      <!-- Tombol Eksekusi -->
      <button type="button" id="btn-redeem-voucher" class="btn btn-primary h-9 px-3 text-xs font-semibold w-full mt-0.5 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <span>Terapkan Kupon Kasir</span>
      </button>
    </div>
  `;

  document.getElementById('btn-redeem-voucher')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      const updated = await klaimVoucher(voucher.id, totalBelanja);
      showToast(`Kupon ${updated.kode} berhasil diklaim. Sisa kuota: ${updated.sisa_kuota}`);
      // Segarkan chip "Kupon Aktif Tersedia" dari server, bukan cuma filter
      // lokal -- supaya kupon yang baru habis langsung hilang, termasuk
      // kalau kasir lain mengklaim kupon berbeda di perangkat lain.
      await renderQuickVouchers();
      await doValidateVoucher();
    } catch (err) {
      showToast(err.message || 'Gagal mengklaim voucher.');
      btn.disabled = false;
    }
  });
}

// Event Listeners for Voucher Modal
if (el.modalVoucherClose) el.modalVoucherClose.addEventListener('click', closeVoucherModal);
if (el.modalVoucherCancel) el.modalVoucherCancel.addEventListener('click', closeVoucherModal);
if (el.modalVoucher) el.modalVoucher.addEventListener('click', (e) => { if (e.target === el.modalVoucher) closeVoucherModal(); });
if (el.btnPrintVouchers) el.btnPrintVouchers.addEventListener('click', saveAndPrintVouchers);

if (el.voucherInputJudul) el.voucherInputJudul.addEventListener('input', updateVoucherPreview);
if (el.voucherInputMinBelanja) el.voucherInputMinBelanja.addEventListener('input', updateVoucherPreview);
if (el.voucherInputKadaluarsa) el.voucherInputKadaluarsa.addEventListener('change', updateVoucherPreview);
if (el.voucherInputQty) el.voucherInputQty.addEventListener('change', updateVoucherPreview);
if (el.voucherInputKode) el.voucherInputKode.addEventListener('input', updateVoucherPreview);

if (el.btnVoucherGenerateCode) {
  el.btnVoucherGenerateCode.addEventListener('click', () => {
    const newCode = generateVoucherCode(currentVoucherData.target);
    if (el.voucherInputKode) el.voucherInputKode.value = newCode;
    updateVoucherPreview();
  });
}

if (el.voucherDiskonGroup) {
  el.voucherDiskonGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-val]');
    if (!btn) return;
    currentVoucherData.tipe = btn.dataset.tipe;
    currentVoucherData.nilai = Number(btn.dataset.val);
    updateVoucherDiskonButtons(currentVoucherData.tipe, currentVoucherData.nilai);
    updateVoucherPreview();
  });
}

if (el.voucherInputTarget) {
  el.voucherInputTarget.addEventListener('change', () => {
    const selectedOpt = el.voucherInputTarget.selectedOptions[0];
    const val = el.voucherInputTarget.value;
    const prefix = selectedOpt?.dataset.prefix || 'SPC';

    if (val === 'Semua') {
      currentVoucherData.target = 'Semua Kategori';
      currentVoucherData.judul = 'Kupon Penyelamatan Pangan Kasir';
    } else if (val.startsWith('Kategori: ')) {
      currentVoucherData.target = val.replace('Kategori: ', '');
      currentVoucherData.judul = `Promo Kategori · ${currentVoucherData.target}`;
    } else {
      currentVoucherData.target = selectedOpt?.dataset.kategori ? `${val} (${selectedOpt.dataset.kategori})` : val;
      currentVoucherData.judul = `Food Rescue Promo · ${val}`;
      if (selectedOpt?.dataset.kadaluarsa) {
        currentVoucherData.kadaluarsa = selectedOpt.dataset.kadaluarsa;
        if (el.voucherInputKadaluarsa) el.voucherInputKadaluarsa.value = currentVoucherData.kadaluarsa;
      }
    }

    currentVoucherData.kode = generateVoucherCode(prefix);
    if (el.voucherInputJudul) el.voucherInputJudul.value = currentVoucherData.judul;
    if (el.voucherInputKode) el.voucherInputKode.value = currentVoucherData.kode;
    updateVoucherPreview();
  });
}

// ---------- Scan Barcode Voucher via Kamera ----------

let scanCameraStream = null;
let scanCameraRafId = null;
let scanBarcodeDetector = null;

function isBarcodeDetectorSupported() {
  return typeof window.BarcodeDetector !== 'undefined';
}

async function startScanCamera() {
  if (!el.scanCameraWrap || !el.scanCameraVideo) return;

  if (!isBarcodeDetectorSupported()) {
    if (el.scanCameraStatus) {
      el.scanCameraStatus.textContent = 'Browser tidak mendukung, silakan ketik manual.';
    }
    el.scanCameraWrap.classList.remove('hidden');
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    if (el.scanCameraStatus) {
      el.scanCameraStatus.textContent = 'Kamera tidak tersedia di perangkat ini.';
    }
    el.scanCameraWrap.classList.remove('hidden');
    return;
  }

  try {
    scanCameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    });
  } catch (err) {
    showToast('Tidak bisa mengakses kamera. Periksa izin browser.');
    return;
  }

  el.scanCameraVideo.srcObject = scanCameraStream;
  el.scanCameraWrap.classList.remove('hidden');
  if (el.scanCameraStatus) el.scanCameraStatus.textContent = 'Arahkan kamera ke barcode voucher...';

  try {
    scanBarcodeDetector = new BarcodeDetector({ formats: ['code_39', 'code_128', 'ean_13', 'qr_code'] });
  } catch (err) {
    scanBarcodeDetector = new BarcodeDetector();
  }

  const detectLoop = async () => {
    if (!scanCameraStream || !el.scanCameraVideo) return;
    try {
      const barcodes = await scanBarcodeDetector.detect(el.scanCameraVideo);
      if (barcodes.length > 0) {
        const kode = barcodes[0].rawValue;
        if (el.scanInputKode) el.scanInputKode.value = kode.trim().toUpperCase();
        stopScanCamera();
        doValidateVoucher();
        return;
      }
    } catch (err) {
      // Frame belum siap / tidak terbaca — abaikan, coba lagi di frame berikutnya.
    }
    scanCameraRafId = requestAnimationFrame(detectLoop);
  };
  scanCameraRafId = requestAnimationFrame(detectLoop);
}

function stopScanCamera() {
  if (scanCameraRafId) {
    cancelAnimationFrame(scanCameraRafId);
    scanCameraRafId = null;
  }
  if (scanCameraStream) {
    scanCameraStream.getTracks().forEach((track) => track.stop());
    scanCameraStream = null;
  }
  if (el.scanCameraVideo) el.scanCameraVideo.srcObject = null;
  if (el.scanCameraWrap) el.scanCameraWrap.classList.add('hidden');
}

// Event Listeners for Scanner Kasir Modal
if (el.btnNavScanVoucher) el.btnNavScanVoucher.addEventListener('click', openScanVoucherModal);
if (el.btnMobileScanVoucher) el.btnMobileScanVoucher.addEventListener('click', openScanVoucherModal);
if (el.btnKasirCreateVoucher) el.btnKasirCreateVoucher.addEventListener('click', () => openVoucherModal(null, null, true));
if (el.modalScanClose) el.modalScanClose.addEventListener('click', closeScanVoucherModal);
if (el.modalScanCloseBtn) el.modalScanCloseBtn.addEventListener('click', closeScanVoucherModal);
if (el.modalScanVoucher) el.modalScanVoucher.addEventListener('click', (e) => { if (e.target === el.modalScanVoucher) closeScanVoucherModal(); });
if (el.btnDoScan) el.btnDoScan.addEventListener('click', doValidateVoucher);
if (el.scanInputKode) {
  el.scanInputKode.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doValidateVoucher();
  });
}
if (el.scanInputBelanja) {
  // Nominal belanja berubah (ketik ATAU panah atas/bawah -- keduanya
  // memicu event 'input' pada <input type="number">) meng-invalidate hasil
  // validasi/tombol klaim yang sedang tampil. Kasir wajib klik Validasi
  // lagi -- backend tetap satu-satunya sumber kebenaran, frontend tidak
  // menghitung ulang potongan/syarat kupon sendiri.
  el.scanInputBelanja.addEventListener('input', () => {
    resetScanResultBox('Nominal belanja berubah, klik "Validasi" lagi untuk memeriksa ulang kupon.');
  });
}
if (el.btnScanCamera) el.btnScanCamera.addEventListener('click', startScanCamera);
if (el.btnScanCameraClose) el.btnScanCameraClose.addEventListener('click', stopScanCamera);

// Tutup modal dengan tombol Escape.
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!el.modalForm.classList.contains('hidden')) closeFormModal();
  if (!el.modalHapus.classList.contains('hidden')) closeDeleteModal();
  if (el.modalLabelDiskon && !el.modalLabelDiskon.classList.contains('hidden')) closeLabelModal();
  if (el.modalVoucher && !el.modalVoucher.classList.contains('hidden')) closeVoucherModal();
  if (el.modalScanVoucher && !el.modalScanVoucher.classList.contains('hidden')) closeScanVoucherModal();
});

el.btnLogout.addEventListener('click', async () => {
  el.btnLogout.disabled = true;
  await logout();
  window.location.href = 'login.html';
});

async function init() {
  renderTanggalHariIni();

  el.loading.classList.remove('hidden');
  try {
    const [me, items, rekomendasi] = await Promise.all([fetchMe(), fetchItems(), fetchRekomendasi()]);
    if (me && me.name) el.userName.textContent = me.name;
    allItems = items || [];
    allRekomendasi = (rekomendasi || []).filter((r) => r && r.item);

    setupKpiFilterEvents();
    renderFilters();
    applyFilters();
    renderRekomendasi();
  } catch (err) {
    el.error.textContent = err.message || 'Gagal memuat data dari server.';
    el.error.classList.remove('hidden');
  } finally {
    el.loading.classList.add('hidden');
    el.aiLoading.classList.add('hidden');
    if (allItems.length > 0) {
      el.itemsContainer.classList.remove('hidden');
    }
    el.aiContainer.classList.remove('hidden');
  }
}

init();
