if (!getToken()) {
  window.location.href = 'login.html';
}

const HIJAU = '#14532d';

const ST = {
  kritis: { label: 'Kritis', fg: '#9f1239', bg: '#fff1f3', bd: '#fecdd3', dot: '#e11d48' },
  berisiko: { label: 'Berisiko', fg: '#92400e', bg: '#fffbeb', bd: '#fde68a', dot: '#f59e0b' },
  aman: { label: 'Aman', fg: '#166534', bg: '#f0fdf4', bd: '#bbf7d0', dot: '#22c55e' },
};

const JENIS_WARNA = {
  Diskon: { fg: '#92400e', bg: '#fffbeb', bd: '#fde68a' },
  Distribusi: { fg: '#166534', bg: '#f0fdf4', bd: '#bbf7d0' },
  Bundling: { fg: '#86198f', bg: '#fdf4ff', bd: '#f5d0fe' },
  Pemusnahan: { fg: '#9f1239', bg: '#fff1f3', bd: '#fecdd3' },
};
const JENIS_WARNA_DEFAULT = { fg: '#5d6f63', bg: '#fafbf9', bd: '#e0e7e0' };

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

function badgeStyle(status) {
  const s = ST[status];
  return `display:inline-flex;align-items:center;padding:4px 11px;border-radius:999px;font-size:12px;font-weight:600;color:${s.fg};background:${s.bg};border:1px solid ${s.bd}`;
}

function jenisBadgeStyle(jenis) {
  const w = JENIS_WARNA[jenis] || JENIS_WARNA_DEFAULT;
  return `display:inline-flex;align-items:center;padding:4px 11px;border-radius:999px;font-size:12px;font-weight:600;color:${w.fg};background:${w.bg};border:1px solid ${w.bd}`;
}

function chipStyle(aktif) {
  return `padding:6px 13px;border-radius:999px;font-size:12.5px;font-weight:500;cursor:pointer;border:1px solid ${aktif ? HIJAU : '#e0e7e0'};background:${aktif ? HIJAU : '#fff'};color:${aktif ? '#fff' : '#5d6f63'}`;
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

function actionButtonsHtml(item) {
  const bisaAi = item.status !== 'aman';
  const sudahAdaRekomendasi = bisaAi && hasRekomendasiAktif(item.id);
  return `
    <div class="flex justify-end gap-1.5" data-actions>
      ${bisaAi ? `<button type="button" data-action="ai" data-id="${item.id}" ${sudahAdaRekomendasi ? 'disabled' : ''} class="w-8 h-8 flex items-center justify-center rounded-[8px] border transition ${sudahAdaRekomendasi ? 'border-[#eef2ed] text-[#c3cec6] cursor-not-allowed' : 'border-[#f5d0fe] text-[#86198f] hover:bg-[#fdf4ff] cursor-pointer'}" title="${sudahAdaRekomendasi ? 'Sudah ada rekomendasi aktif untuk barang ini' : 'Minta Saran AI'}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M12 18v3M4.9 7.5l2.6 1.5M16.5 15l2.6 1.5M4.9 16.5l2.6-1.5M16.5 9l2.6-1.5" /><circle cx="12" cy="12" r="3.4" /></svg>
      </button>` : ''}
      <button type="button" data-action="edit" data-id="${item.id}" class="w-8 h-8 flex items-center justify-center rounded-[8px] border border-[#dbe3dc] text-[#3c4d42] hover:border-[#14532d] hover:text-[#14532d] transition" title="Edit">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
      </button>
      <button type="button" data-action="hapus" data-id="${item.id}" class="w-8 h-8 flex items-center justify-center rounded-[8px] border border-[#dbe3dc] text-[#3c4d42] hover:border-[#e11d48] hover:text-[#e11d48] transition" title="Hapus">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16z" /></svg>
      </button>
    </div>
  `;
}

function renderTableRow(item) {
  const s = ST[item.status];
  const pct = progressPercent(item);
  const row = document.createElement('div');
  row.className = 'grid grid-cols-[2.2fr_.9fr_.8fr_1fr_1.1fr_.9fr_.9fr] gap-3 px-[18px] py-3.5 border-b border-[#f1f4f0] items-center hover:bg-[#fafbf9] transition';
  row.innerHTML = `
    <div class="flex items-center gap-[11px] min-w-0">
      <span style="width:9px;height:9px;border-radius:50%;flex:0 0 auto;background:${s.dot}"></span>
      <div class="min-w-0">
        <div class="text-sm font-medium truncate text-[#132018]">${esc(item.nama)}</div>
      </div>
    </div>
    <div class="text-[13px] text-[#5d6f63]">${esc(item.kategori)}</div>
    <div class="text-[13.5px] font-medium font-heading">${item.jumlah_stok}</div>
    <div class="text-[13px] text-[#5d6f63]">${formatTanggal(item.tanggal_kadaluarsa)}</div>
    <div>
      <div class="text-[13px] font-medium mb-1">${sisaHariText(item.sisa_hari)}</div>
      <div class="h-1 rounded-full bg-[#eef2ed] overflow-hidden">
        <div style="height:100%;width:${pct}%;border-radius:99px;background:${s.dot}"></div>
      </div>
    </div>
    <div><span style="${badgeStyle(item.status)}">${s.label}</span></div>
    ${actionButtonsHtml(item)}
  `;
  return row;
}

function renderCard(item) {
  const s = ST[item.status];
  const pct = progressPercent(item);
  const card = document.createElement('article');
  card.className = 'bg-white border border-[#eef2ed] rounded-[14px] p-4';
  card.innerHTML = `
    <div class="flex items-start justify-between gap-2.5">
      <div class="min-w-0">
        <div class="text-[15px] font-semibold tracking-tight text-[#132018]">${esc(item.nama)}</div>
        <div class="text-[12.5px] text-[#93a398] mt-1">${esc(item.kategori)}</div>
      </div>
      <span style="${badgeStyle(item.status)}">${s.label}</span>
    </div>
    <div class="flex gap-5 mt-3.5">
      <div>
        <div class="text-[11.5px] text-[#93a398]">Stok</div>
        <div class="font-heading text-[15px] font-semibold mt-0.5">${item.jumlah_stok}</div>
      </div>
      <div>
        <div class="text-[11.5px] text-[#93a398]">Sisa</div>
        <div class="font-heading text-[15px] font-semibold mt-0.5">${sisaHariText(item.sisa_hari)}</div>
      </div>
      <div>
        <div class="text-[11.5px] text-[#93a398]">Kadaluarsa</div>
        <div class="text-[13.5px] font-medium mt-1">${formatTanggal(item.tanggal_kadaluarsa)}</div>
      </div>
    </div>
    <div class="h-1 rounded-full bg-[#eef2ed] overflow-hidden mt-3.5">
      <div style="height:100%;width:${pct}%;border-radius:99px;background:${s.dot}"></div>
    </div>
    <div class="mt-3.5 pt-3.5 border-t border-[#eef2ed]">${actionButtonsHtml(item)}</div>
  `;
  return card;
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
    chip.setAttribute('style', chipStyle(activeKategori === kategori));
    chip.addEventListener('click', () => {
      activeKategori = kategori;
      renderChipKategori();
      applyFilters();
    });
    el.chipKategori.appendChild(chip);
  });

  el.daftarKategori.innerHTML = kategoriList
    .filter((k) => k !== 'Semua')
    .map((k) => `<option value="${esc(k)}"></option>`)
    .join('');
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
    chip.setAttribute('style', chipStyle(activeStatus === key));
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
  const s = ST[item.status];
  const card = document.createElement('article');
  card.className = rekomendasi.diterapkan
    ? 'bg-[#fafbf9] border border-[#eef2ed] rounded-[14px] p-4 flex flex-col gap-3 opacity-70'
    : 'bg-white border border-[#eef2ed] rounded-[14px] p-4 flex flex-col gap-3';
  card.innerHTML = `
    <div class="flex items-start justify-between gap-2.5">
      <div class="flex items-center gap-2 min-w-0">
        <span style="width:9px;height:9px;border-radius:50%;flex:0 0 auto;background:${s.dot}"></span>
        <div class="text-[15px] font-semibold tracking-tight truncate">${esc(item.nama)}</div>
      </div>
      <span style="${badgeStyle(item.status)}">${s.label}</span>
    </div>
    <div class="bg-[#fdf4ff] border border-[#f5d0fe] rounded-[12px] p-3.5">
      <span style="${jenisBadgeStyle(rekomendasi.jenis_saran)}">${esc(rekomendasi.jenis_saran)}</span>
      <div class="text-[13.5px] text-[#581c67] leading-relaxed mt-2.5">${esc(rekomendasi.isi_saran)}</div>
    </div>
    <div class="flex gap-2">
      ${rekomendasi.diterapkan
        ? `<span class="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#166534]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            Sudah diterapkan
          </span>`
        : `<button type="button" data-terapkan="${rekomendasi.id}" class="h-9 px-3.5 rounded-[9px] bg-[#14532d] text-white text-[13px] font-semibold cursor-pointer hover:bg-[#0e3a20] transition">Tandai Diterapkan</button>`}
    </div>
  `;
  return card;
}

function renderAiGroup(judul, daftarRekomendasi) {
  if (daftarRekomendasi.length === 0) return null;

  const group = document.createElement('div');
  group.className = 'flex flex-col gap-2.5';
  group.innerHTML = `<div class="text-xs font-semibold text-[#9aab9f] tracking-wide px-1">${esc(judul)} · ${daftarRekomendasi.length}</div>`;

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
  el.loading.classList.remove('hidden');
  el.aiLoading.classList.remove('hidden');
  el.error.classList.add('hidden');
  el.aiError.classList.add('hidden');
  el.itemsContainer.classList.add('hidden');
  el.empty.classList.add('hidden');
  el.aiEmpty.classList.add('hidden');
  el.aiContainer.classList.add('hidden');

  try {
    const [me, items, rekomendasi] = await Promise.all([fetchMe(), fetchItems(), fetchRekomendasi()]);
    el.userName.textContent = me.name;
    allItems = items;
    allRekomendasi = rekomendasi;
    renderChipKategori();
    renderChipStatus();
    applyFilters();
    renderRekomendasi();
  } catch (err) {
    el.error.textContent = err.message || 'Terjadi kesalahan saat memuat data.';
    el.error.classList.remove('hidden');
  } finally {
    el.loading.classList.add('hidden');
    el.aiLoading.classList.add('hidden');
  }
}

init();
