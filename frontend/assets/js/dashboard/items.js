/**
 * Modul Manajemen Inventaris (Items)
 * Arsitektur Bersih (Clean Architecture) - Domain & Feature Layer
 */

import { state } from './state.js?v=1.0.5';
import { el } from './elements.js?v=1.0.5';
import {
  esc,
  formatTanggal,
  formatRupiah,
  sisaHariText,
  progressPercent,
  showToast,
  withButtonLoading,
  BULAN_PANJANG,
  HARI,
} from './utils.js?v=1.0.5';
import { loadRekomendasi, isSudahDiterapkanBaruBaruIni, requestRekomendasi } from './ai.js?v=1.0.5';
import { openLabelModal } from './labels.js?v=1.0.5';

export function renderTanggalHariIni() {
  if (!el.tanggalHariIni) return;
  const now = new Date();
  el.tanggalHariIni.textContent = `${HARI[now.getDay()]}, ${now.getDate()} ${BULAN_PANJANG[now.getMonth()]} ${now.getFullYear()}`;
}

export function renderSummary(filteredItems) {
  if (!el.summaryTotal) return;
  el.summaryTotal.textContent = state.allItems.length;
  const totalStok = state.allItems.reduce((sum, item) => sum + item.jumlah_stok, 0);
  if (el.summaryTotalStok) el.summaryTotalStok.textContent = `${totalStok} unit di gudang`;
  if (el.summaryAman) el.summaryAman.textContent = state.allItems.filter((item) => item.status === 'aman').length;
  if (el.summaryBerisiko) el.summaryBerisiko.textContent = state.allItems.filter((item) => item.status === 'berisiko').length;
  if (el.summaryKritis) el.summaryKritis.textContent = state.allItems.filter((item) => item.status === 'kritis').length;
  if (el.jumlahTampil) el.jumlahTampil.textContent = `· ${filteredItems.length}`;

  // Highlight KPI card yang sedang aktif memfilter tabel (desktop/tablet)
  const isDesktop = window.innerWidth >= 640;
  const kpiCards = document.querySelectorAll('[data-filter]');
  kpiCards.forEach((card) => {
    const filter = card.dataset.filter;
    const isActive = (filter === 'Semua' && state.activeStatus === 'Semua') || filter === state.activeStatus;

    if (!isDesktop) {
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
      card.classList.toggle('ring-2', isActive && state.activeStatus === 'Semua');
      card.classList.toggle('ring-slate-700', isActive && state.activeStatus === 'Semua');
      card.classList.toggle('ring-offset-2', isActive && state.activeStatus === 'Semua');
    }
  });
}

export function setupKpiFilterEvents() {
  document.querySelectorAll('[data-filter]').forEach((card) => {
    card.addEventListener('click', () => {
      if (window.innerWidth < 640) return;
      const filter = card.dataset.filter;
      if (filter === 'Semua') {
        state.activeStatus = 'Semua';
      } else {
        state.activeStatus = state.activeStatus === filter ? 'Semua' : filter;
      }
      renderFilters();
      applyFilters();
    });
  });
}

export function hasRekomendasiAktif(itemId) {
  return state.allRekomendasi.some((r) => (
    r.item_id === itemId && (!r.diterapkan || isSudahDiterapkanBaruBaruIni(r))
  ));
}

export function renderActionButtons(item, isMobile = false) {
  const template = document.getElementById('tmpl-action-buttons');
  if (!template) return document.createElement('div');
  const clone = template.content.cloneNode(true);

  const btnAi = clone.querySelector('[data-action="ai"]');
  const btnLabel = clone.querySelector('[data-action="label"]');
  const btnEdit = clone.querySelector('[data-action="edit"]');
  const btnHapus = clone.querySelector('[data-action="hapus"]');

  const bisaAi = item.status !== 'aman';
  const sudahAdaRekomendasi = bisaAi && hasRekomendasiAktif(item.id);
  const sudahKadaluarsa = item.sisa_hari < 0;

  // 1. Tombol AI (hanya untuk barang kritis/berisiko)
  if (bisaAi && btnAi) {
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
  } else if (btnAi) {
    btnAi.remove();
  }

  // 2. Tombol Label Rak (untuk barang yang belum kadaluarsa)
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

  // 3. Tombol Edit & Hapus
  if (btnEdit) btnEdit.dataset.id = item.id;
  if (btnHapus) btnHapus.dataset.id = item.id;

  if (isMobile && btnEdit && btnHapus) {
    btnEdit.className = 'btn btn-outline btn-icon';
    btnHapus.className = 'btn btn-outline btn-icon hover:!border-danger hover:!text-danger';

    const rightActions = document.createElement('div');
    rightActions.className = 'flex items-center gap-1.5 ml-auto';
    if (btnLabel && bisaLabelRak && btnLabel.parentNode) {
      btnLabel.parentNode.insertBefore(rightActions, btnLabel);
      rightActions.appendChild(btnLabel);
    } else if (btnEdit.parentNode) {
      btnEdit.parentNode.insertBefore(rightActions, btnEdit);
    }
    rightActions.appendChild(btnEdit);
    rightActions.appendChild(btnHapus);
  } else {
    if (btnEdit) btnEdit.className = 'btn btn-outline btn-icon w-7 h-7 shrink-0';
    if (btnHapus) btnHapus.className = 'btn btn-outline btn-icon hover:!border-danger hover:!text-danger w-7 h-7 shrink-0';
  }

  return clone;
}

export function renderTableRow(item) {
  const pct = progressPercent(item);
  const template = document.getElementById('tmpl-table-row');
  if (!template) return document.createElement('div');
  const clone = template.content.cloneNode(true);

  const dotEl = clone.querySelector('.js-dot');
  if (dotEl) dotEl.classList.add(`dot-${item.status}`);

  // Status dot color indicator next to name
  const statusDot = clone.querySelector('.js-status-dot');
  if (statusDot) {
    const dotColors = { aman: '#22c55e', berisiko: '#f59e0b', kritis: '#e11d48' };
    statusDot.style.backgroundColor = dotColors[item.status] || '#8a9a8f';
  }

  const elNama = clone.querySelector('.js-nama');
  if (elNama) elNama.textContent = item.nama;

  const elKategori = clone.querySelector('.js-kategori');
  if (elKategori) elKategori.textContent = item.kategori;

  const elStok = clone.querySelector('.js-stok');
  if (elStok) elStok.textContent = item.jumlah_stok;

  const elKadaluarsa = clone.querySelector('.js-kadaluarsa');
  if (elKadaluarsa) elKadaluarsa.textContent = formatTanggal(item.tanggal_kadaluarsa);

  const elSisa = clone.querySelector('.js-sisa-text');
  if (elSisa) {
    elSisa.textContent = sisaHariText(item.sisa_hari);
    const sisaColors = { aman: '#166534', berisiko: '#92400e', kritis: '#9f1239' };
    elSisa.style.color = sisaColors[item.status] || '';
  }

  const progressBar = clone.querySelector('.js-progress-bar');
  if (progressBar) {
    progressBar.style.width = `${pct}%`;
    progressBar.classList.add(`progress-${item.status}`);
  }

  const badge = clone.querySelector('.js-status-badge');
  if (badge) {
    badge.textContent = item.status.charAt(0).toUpperCase() + item.status.slice(1);
    badge.classList.add(`badge-${item.status}`);
  }

  const actions = clone.querySelector('.js-actions');
  if (actions) {
    actions.appendChild(renderActionButtons(item, false));
  }

  return clone;
}

export function renderCard(item) {
  const pct = progressPercent(item);
  const template = document.getElementById('tmpl-card');
  if (!template) return document.createElement('div');
  const clone = template.content.cloneNode(true);

  const elNama = clone.querySelector('.js-nama');
  if (elNama) elNama.textContent = item.nama;

  const elKategori = clone.querySelector('.js-kategori');
  if (elKategori) elKategori.textContent = item.kategori;

  const elStok = clone.querySelector('.js-stok');
  if (elStok) elStok.textContent = item.jumlah_stok;

  const elSisa = clone.querySelector('.js-sisa-text');
  if (elSisa) elSisa.textContent = sisaHariText(item.sisa_hari);

  const elKadaluarsa = clone.querySelector('.js-kadaluarsa');
  if (elKadaluarsa) elKadaluarsa.textContent = formatTanggal(item.tanggal_kadaluarsa);

  const progressBar = clone.querySelector('.js-progress-bar');
  if (progressBar) {
    progressBar.style.width = `${pct}%`;
    progressBar.classList.add(`progress-${item.status}`);
  }

  const badge = clone.querySelector('.js-status-badge');
  if (badge) {
    badge.textContent = item.status.charAt(0).toUpperCase() + item.status.slice(1);
    badge.classList.add(`badge-${item.status}`);
  }

  const actions = clone.querySelector('.js-actions');
  if (actions) {
    actions.appendChild(renderActionButtons(item, true));
  }

  return clone;
}

export function renderItems(items) {
  if (!el.tableBody || !el.cards) return;
  el.tableBody.innerHTML = '';
  el.cards.innerHTML = '';

  const tableFrag = document.createDocumentFragment();
  const cardFrag = document.createDocumentFragment();

  items.forEach((item) => {
    tableFrag.appendChild(renderTableRow(item));
    cardFrag.appendChild(renderCard(item));
  });

  el.tableBody.appendChild(tableFrag);
  el.cards.appendChild(cardFrag);
}

export function renderFilters() {
  if (!el.chipFilters) return;
  const categories = [...new Set(state.allItems.map((i) => i.kategori).filter(Boolean))];

  if (el.daftarKategori) {
    el.daftarKategori.innerHTML = categories.map((k) => `<option value="${esc(k)}"></option>`).join('');
  }

  el.chipFilters.innerHTML = '';

  const chipSemua = document.createElement('button');
  chipSemua.type = 'button';
  chipSemua.className = `chip ${state.activeKategori === 'Semua' && state.activeStatus === 'Semua' ? 'active' : ''}`;
  chipSemua.textContent = 'Semua';
  chipSemua.addEventListener('click', () => {
    state.activeKategori = 'Semua';
    state.activeStatus = 'Semua';
    renderFilters();
    applyFilters();
  });
  el.chipFilters.appendChild(chipSemua);

  // Chip status (khusus mobile)
  const statusList = [
    { key: 'aman', label: 'Aman' },
    { key: 'berisiko', label: 'Berisiko' },
    { key: 'kritis', label: 'Kritis' },
  ];
  statusList.forEach(({ key, label }) => {
    const count = state.allItems.filter((i) => i.status === key).length;
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `chip sm:hidden ${state.activeStatus === key ? 'active' : ''}`;
    chip.innerHTML = `
      <span class="w-1.5 h-1.5 rounded-full ${key === 'aman' ? 'bg-emerald-500' : key === 'berisiko' ? 'bg-amber-500' : 'bg-rose-500'}"></span>
      ${label} (${count})
    `;
    chip.addEventListener('click', () => {
      state.activeStatus = state.activeStatus === key ? 'Semua' : key;
      renderFilters();
      applyFilters();
    });
    el.chipFilters.appendChild(chip);
  });

  // Chip kategori
  categories.forEach((kat) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `chip ${state.activeKategori === kat ? 'active' : ''}`;
    chip.textContent = kat;
    chip.addEventListener('click', () => {
      state.activeKategori = state.activeKategori === kat ? 'Semua' : kat;
      renderFilters();
      applyFilters();
    });
    el.chipFilters.appendChild(chip);
  });
}

export function applyFilters() {
  const query = (el.cari?.value || '').toLowerCase().trim();

  let filtered = state.allItems.filter((item) => {
    const matchQuery = !query || item.nama.toLowerCase().includes(query) || item.kategori.toLowerCase().includes(query);
    const matchKategori = state.activeKategori === 'Semua' || item.kategori === state.activeKategori;
    const matchStatus = state.activeStatus === 'Semua' || item.status === state.activeStatus;
    return matchQuery && matchKategori && matchStatus;
  });

  renderSummary(filtered);

  if (!el.itemsContainer || !el.loading || !el.empty) return;
  el.loading.classList.add('hidden');

  if (state.allItems.length === 0) {
    el.empty.classList.remove('hidden');
    el.itemsContainer.classList.add('hidden');
    return;
  }

  el.empty.classList.add('hidden');
  el.itemsContainer.classList.remove('hidden');

  if (filtered.length === 0) {
    if (el.tableBody) {
      el.tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-light text-sm">Tidak ada barang yang cocok dengan filter</td></tr>';
    }
    if (el.cards) {
      el.cards.innerHTML = '<div class="text-center py-8 text-light text-sm">Tidak ada barang yang cocok dengan filter</div>';
    }
    return;
  }

  renderItems(filtered);
}

export function openFormModal(item = null) {
  if (!el.modalForm) return;
  state.editingItemId = item ? item.id : null;
  el.modalFormTitle.textContent = item ? 'Edit Barang' : 'Tambah Barang';
  el.formError.classList.add('hidden');

  if (item) {
    el.inputNama.value = item.nama;
    el.inputKategori.value = item.kategori;
    el.inputMasuk.value = item.tanggal_masuk;
    el.inputUmur.value = item.estimasi_umur_simpan_hari;
    el.inputStok.value = item.jumlah_stok;
  } else {
    el.formItem.reset();
    el.inputMasuk.value = new Date().toISOString().split('T')[0];
  }

  el.modalForm.classList.remove('hidden');
  el.inputNama.focus();
}

export function closeFormModal() {
  if (!el.modalForm) return;
  el.modalForm.classList.add('hidden');
  state.editingItemId = null;
}

export function openDeleteModal(item) {
  if (!el.modalHapus) return;
  state.deletingItemId = item.id;
  const isKadaluarsa = item.sisa_hari < 0;
  el.modalHapusText.textContent = isKadaluarsa
    ? `"${item.nama}" (${item.jumlah_stok} unit) telah lewat masa kadaluarsa dan akan dicatat ke Riwayat sebagai barang terbuang/pemusnahan.`
    : `"${item.nama}" (${item.jumlah_stok} unit) akan dihapus dari stok aktif dan dicatat ke Riwayat sebagai barang terbuang.`;
  el.modalHapus.classList.remove('hidden');
}

export function closeDeleteModal() {
  if (!el.modalHapus) return;
  el.modalHapus.classList.add('hidden');
  state.deletingItemId = null;
}

export async function handleActionClick(e) {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const id = Number(btn.dataset.id);
  const item = state.allItems.find((i) => i.id === id);
  if (!item) return;

  if (action === 'edit') {
    openFormModal(item);
  } else if (action === 'hapus') {
    openDeleteModal(item);
  } else if (action === 'ai') {
    await requestRekomendasi(item, btn);
  } else if (action === 'label') {
    const rekomendasi = state.allRekomendasi.find((r) => r.item_id === item.id);
    openLabelModal(item, rekomendasi);
  }
}

export async function loadItems() {
  try {
    const data = await window.fetchItems();
    state.allItems = data || [];
    renderFilters();
    applyFilters();
  } catch (err) {
    if (el.error) {
      el.error.textContent = err.message || 'Gagal memuat data barang.';
      el.error.classList.remove('hidden');
    }
  }
}

/**
 * Setup Event Listeners untuk Inventaris
 */
export function initItemsEvents() {
  if (el.btnTambah) el.btnTambah.addEventListener('click', () => openFormModal());
  if (el.btnTambahFab) el.btnTambahFab.addEventListener('click', () => openFormModal());
  if (el.modalFormClose) el.modalFormClose.addEventListener('click', closeFormModal);
  if (el.formCancel) el.formCancel.addEventListener('click', closeFormModal);
  if (el.modalForm) {
    el.modalForm.addEventListener('click', (e) => {
      if (e.target === el.modalForm) closeFormModal();
    });
  }

  // Submit Form Item dengan Loading Button & Disabled State
  if (el.formItem) {
    el.formItem.addEventListener('submit', async (e) => {
      e.preventDefault();
      el.formError.classList.add('hidden');

      const payload = {
        nama: el.inputNama.value.trim(),
        kategori: el.inputKategori.value.trim(),
        tanggal_masuk: el.inputMasuk.value,
        estimasi_umur_simpan_hari: Number(el.inputUmur.value),
        jumlah_stok: Number(el.inputStok.value),
      };

      await withButtonLoading(el.formSubmit, 'Menyimpan...', async () => {
        try {
          if (state.editingItemId) {
            await window.updateItem(state.editingItemId, payload);
            showToast('Barang berhasil diperbarui.');
          } else {
            await window.createItem(payload);
            showToast('Barang berhasil ditambahkan.');
          }
          closeFormModal();
          await loadRekomendasi();
          await loadItems();
        } catch (err) {
          el.formError.textContent = err.message || 'Gagal menyimpan barang.';
          el.formError.classList.remove('hidden');
        }
      });
    });
  }

  // Modal Hapus Event Listeners dengan Loading Button
  if (el.modalHapusCancel) el.modalHapusCancel.addEventListener('click', closeDeleteModal);
  if (el.modalHapus) {
    el.modalHapus.addEventListener('click', (e) => {
      if (e.target === el.modalHapus) closeDeleteModal();
    });
  }

  if (el.modalHapusConfirm) {
    el.modalHapusConfirm.addEventListener('click', async () => {
      if (!state.deletingItemId) return;
      await withButtonLoading(el.modalHapusConfirm, 'Menghapus...', async () => {
        try {
          await window.deleteItem(state.deletingItemId);
          showToast('Barang berhasil dihapus dan dicatat ke riwayat sebagai pangan terbuang.');
          closeDeleteModal();
          await loadRekomendasi();
          await loadItems();
        } catch (err) {
          showToast(err.message || 'Gagal menghapus barang.');
        }
      });
    });
  }

  // Delegasi event klik aksi pada tabel dan kartu
  if (el.tableBody) el.tableBody.addEventListener('click', handleActionClick);
  if (el.cards) el.cards.addEventListener('click', handleActionClick);

  // Filter input pencarian & tombol reset
  if (el.cari) el.cari.addEventListener('input', applyFilters);
  if (el.resetFilter) {
    el.resetFilter.addEventListener('click', () => {
      state.activeKategori = 'Semua';
      state.activeStatus = 'Semua';
      if (el.cari) el.cari.value = '';
      renderFilters();
      applyFilters();
    });
  }
}
