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

function hasRekomendasiAktif(itemId) {
  return allRekomendasi.some((r) => r.item_id === itemId && !r.diterapkan);
}

function renderActionButtons(item, isMobile = false) {
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
      btnAi.className = isMobile
        ? 'btn btn-outline border-subtle text-light text-xs h-8 px-3 rounded-lg cursor-not-allowed flex items-center gap-1.5 font-medium'
        : 'btn btn-outline btn-icon border-subtle text-light cursor-not-allowed w-7 h-7 shrink-0';
      btnAi.title = 'Sudah ada rekomendasi aktif untuk barang ini';
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
    btnAi.classList.add('hidden');
  }

  btnEdit.dataset.id = item.id;
  btnHapus.dataset.id = item.id;

  if (isMobile) {
    // Tombol Edit dan Hapus berbentuk icon-only square button di kanan agar rapi & lega
    btnEdit.className = 'btn btn-outline btn-icon';
    btnHapus.className = 'btn btn-outline btn-icon hover:!border-danger hover:!text-danger';

    // Bungkus Edit dan Hapus di kontainer flex kanan
    const rightActions = document.createElement('div');
    rightActions.className = 'flex items-center gap-1.5 ml-auto';
    btnEdit.parentNode.insertBefore(rightActions, btnEdit);
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

function updateAiFilterUI() {
  const perluCount = allRekomendasi.filter((r) => !r.diterapkan).length;
  const sudahCount = allRekomendasi.filter((r) => r.diterapkan).length;
  const semuaCount = allRekomendasi.length;

  if (el.aiCountSemua) el.aiCountSemua.textContent = semuaCount;
  if (el.aiCountBelum) el.aiCountBelum.textContent = perluCount;
  if (el.aiCountSudah) el.aiCountSudah.textContent = sudahCount;

  if (el.aiFilterTabs) {
    const buttons = el.aiFilterTabs.querySelectorAll('[data-ai-filter]');
    buttons.forEach((btn) => {
      const isActive = btn.dataset.aiFilter === activeAiFilter;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }
}

function renderRekomendasi() {
  el.aiList.innerHTML = '';
  updateAiFilterUI();

  const total = allRekomendasi.length;
  el.aiEmpty.classList.toggle('hidden', total > 0);
  el.aiContainer.classList.toggle('hidden', total === 0);

  if (total === 0) return;

  const perluDitindak = allRekomendasi.filter((r) => !r.diterapkan);
  const sudahDitindak = allRekomendasi.filter((r) => r.diterapkan);

  const fragment = document.createDocumentFragment();

  if (activeAiFilter === 'semua') {
    const groupPerlu = renderAiGroup('Perlu Ditindak', perluDitindak);
    const groupSudah = renderAiGroup('Sudah Ditindak', sudahDitindak);
    if (groupPerlu) fragment.appendChild(groupPerlu);
    if (groupSudah) fragment.appendChild(groupSudah);
  } else if (activeAiFilter === 'belum') {
    if (perluDitindak.length > 0) {
      const groupPerlu = renderAiGroup('Perlu Ditindak', perluDitindak);
      if (groupPerlu) fragment.appendChild(groupPerlu);
    } else {
      const emptyBox = document.createElement('div');
      emptyBox.className = 'py-8 px-4 text-center bg-purple-50/40 rounded-xl border border-dashed border-purple-200';
      emptyBox.innerHTML = `
        <div class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-700 mb-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        </div>
        <div class="font-heading text-[14.5px] font-semibold text-primary">Semua saran sudah diterapkan!</div>
        <p class="text-xs text-soft mt-0.5">Tidak ada saran AI yang perlu ditindak saat ini.</p>
      `;
      fragment.appendChild(emptyBox);
    }
  } else if (activeAiFilter === 'sudah') {
    if (sudahDitindak.length > 0) {
      const groupSudah = renderAiGroup('Sudah Ditindak', sudahDitindak);
      if (groupSudah) fragment.appendChild(groupSudah);
    } else {
      const emptyBox = document.createElement('div');
      emptyBox.className = 'py-8 px-4 text-center bg-purple-50/40 rounded-xl border border-dashed border-purple-200';
      emptyBox.innerHTML = `
        <div class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-700 mb-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div class="font-heading text-[14.5px] font-semibold text-primary">Belum ada saran diterapkan</div>
        <p class="text-xs text-soft mt-0.5">Klik tombol "Tandai Diterapkan" pada saran yang sudah dijalankan.</p>
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

  setupKpiFilterEvents();
  renderFilters();
  applyFilters();
  renderRekomendasi();

  el.loading.classList.add('hidden');
  el.aiLoading.classList.add('hidden');
  el.itemsContainer.classList.remove('hidden');
  el.aiContainer.classList.remove('hidden');
}

init();
