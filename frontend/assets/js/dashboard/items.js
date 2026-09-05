/**
 * Modul Manajemen Inventaris (Items)
 * Arsitektur Bersih (Clean Architecture) - Domain & Feature Layer
 */

import { state } from './state.js?v=1.0.7';
import { el } from './elements.js?v=1.0.7';
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
} from './utils.js?v=1.0.7';
import { loadRekomendasi, isSudahDiterapkanBaruBaruIni, requestRekomendasi } from './ai.js?v=1.0.7';
import { openLabelModal } from './labels.js?v=1.0.7';

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
  const mobileQuickCount = document.getElementById('mobile-quick-count');
  if (mobileQuickCount) mobileQuickCount.textContent = `· ${state.allItems.length}`;

  // Highlight KPI card yang sedang aktif memfilter tabel (desktop/tablet atau halaman inventaris)
  const isDesktop = window.innerWidth >= 640;
  const isInventaris = window.location.pathname.toLowerCase().includes('inventaris');
  const kpiCards = document.querySelectorAll('[data-filter]');
  kpiCards.forEach((card) => {
    const filter = (card.dataset.filter || '').toLowerCase();
    const currentStatus = (state.activeStatus || 'Semua').toLowerCase();
    const isActive = (filter === 'semua' && currentStatus === 'semua') || filter === currentStatus;

    if (!isDesktop && !isInventaris) {
      card.classList.remove('ring-2', 'ring-offset-2', 'ring-emerald-500', 'ring-amber-500', 'ring-rose-500', 'ring-slate-700');
      return;
    }

    card.classList.toggle('ring-2', isActive && filter !== 'semua');
    card.classList.toggle('ring-offset-2', isActive && filter !== 'semua');

    if (filter === 'aman') {
      card.classList.toggle('ring-emerald-500', isActive);
    } else if (filter === 'berisiko') {
      card.classList.toggle('ring-amber-500', isActive);
    } else if (filter === 'kritis') {
      card.classList.toggle('ring-rose-500', isActive);
    } else if (filter === 'semua') {
      card.classList.toggle('ring-2', isActive && currentStatus === 'semua');
      card.classList.toggle('ring-slate-700', isActive && currentStatus === 'semua');
      card.classList.toggle('ring-offset-2', isActive && currentStatus === 'semua');
    }
  });
}

export function setupKpiFilterEvents() {
  document.querySelectorAll('[data-filter]').forEach((card) => {
    card.addEventListener('click', () => {
      const isInventaris = window.location.pathname.toLowerCase().includes('inventaris');
      if (window.innerWidth < 640 && !isInventaris) return;
      const rawFilter = (card.dataset.filter || '').toLowerCase();
      const filter = rawFilter === 'semua' ? 'Semua' : rawFilter;
      if (filter === 'Semua') {
        state.activeStatus = 'Semua';
      } else {
        state.activeStatus = (state.activeStatus || '').toLowerCase() === filter ? 'Semua' : filter;
      }
      renderFilters();
      applyFilters();
    });
  });
}

export function getItemStatusInfo(item) {
  if (!item) return { label: '', badgeClass: 'badge-default', dotColor: '#8a9a8f' };

  // 1. Cek apakah ada rekomendasi yang sudah DITERAPKAN hari ini (prioritas utama)
  const appliedRec = (state.allRekomendasi || []).find(
    (r) => r.item_id === item.id && (r.diterapkan === true || r.diterapkan === 1) && isSudahDiterapkanBaruBaruIni(r)
  );

  // 2. Cek apakah ada rekomendasi AI aktif yang menunggu tindakan
  const pendingRec = (state.allRekomendasi || []).find(
    (r) => r.item_id === item.id && (!r.diterapkan || r.diterapkan === false || r.diterapkan === 0)
  );

  const activeRec = appliedRec || pendingRec;
  const isApplied = Boolean(appliedRec);
  const rawJenis = activeRec?.jenis_saran ? activeRec.jenis_saran.trim() : null;
  const jenisSaran = rawJenis ? (rawJenis.charAt(0).toUpperCase() + rawJenis.slice(1)) : null;

  // Status risiko bawaan barang (Aman, Berisiko, Kritis) - konsisten dengan KPI & filter inventaris
  const dotColors = { aman: '#22c55e', berisiko: '#f59e0b', kritis: '#e11d48' };
  const rawStatus = (item.status || 'aman').toLowerCase();
  const label = rawStatus === 'berisiko' ? 'Berisiko' : (rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1));
  const dotColor = dotColors[rawStatus] || '#8a9a8f';
  const badgeClass = `badge-${rawStatus}`;

  return {
    hasAiAction: Boolean(activeRec),
    isApplied,
    jenisSaran,
    label, // Selalu "Aman", "Berisiko", atau "Kritis" agar konsisten di inventaris
    badgeClass,
    dotClass: `dot-${rawStatus}`,
    dotColor,
    title: isApplied
      ? `Status: ${label} · Tindakan AI "${jenisSaran}" telah diterapkan`
      : jenisSaran
      ? `Status: ${label} · Saran AI: "${jenisSaran}"`
      : `Status: ${label}`,
    rekomendasi: activeRec,
  };
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
  const statusInfo = getItemStatusInfo(item);
  const sudahKadaluarsa = item.sisa_hari < 0;

  // 1. Tombol AI (hanya untuk barang kritis/berisiko)
  if (bisaAi && btnAi) {
    btnAi.classList.remove('hidden');
    btnAi.dataset.id = item.id;

    if (statusInfo.hasAiAction) {
      if (statusInfo.isApplied) {
        btnAi.disabled = true;
        btnAi.className = isMobile
          ? 'btn bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs h-8 px-3 rounded-lg flex items-center gap-1.5 font-semibold cursor-default'
          : 'btn btn-outline btn-icon border-emerald-300 text-emerald-800 bg-emerald-50/70 w-7 h-7 shrink-0 cursor-default';
        btnAi.title = `Tindakan AI "${statusInfo.jenisSaran}" telah diterapkan`;
        btnAi.innerHTML = `
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        `;
        if (isMobile) {
          const labelSpan = document.createElement('span');
          labelSpan.textContent = statusInfo.jenisSaran;
          btnAi.appendChild(labelSpan);
        }
      } else {
        btnAi.className = isMobile
          ? 'btn bg-purple-50 text-purple-700 border border-purple-200/80 hover:bg-purple-100 cursor-pointer text-xs h-8 px-3 rounded-lg flex items-center gap-1.5 font-semibold'
          : 'btn btn-outline btn-icon border-purple-200 text-purple-700 hover:bg-purple-50 cursor-pointer transition-colors w-7 h-7 shrink-0';
        btnAi.title = `Saran AI: ${statusInfo.jenisSaran} (Klik untuk melihat saran)`;
        btnAi.innerHTML = `
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3v3M12 18v3M4.9 7.5l2.6 1.5M16.5 15l2.6 1.5M4.9 16.5l2.6-1.5M16.5 9l2.6-1.5" />
            <circle cx="12" cy="12" r="3.4" />
          </svg>
        `;
        if (isMobile) {
          const labelSpan = document.createElement('span');
          labelSpan.textContent = `Saran: ${statusInfo.jenisSaran}`;
          btnAi.appendChild(labelSpan);
        }
      }
    } else {
      btnAi.className = isMobile
        ? 'btn bg-purple-50 text-purple-700 border border-purple-200/80 hover:bg-purple-100 cursor-pointer text-xs h-8 px-3 rounded-lg flex items-center gap-1.5 font-semibold'
        : 'btn btn-outline btn-icon border-purple-200 text-purple-700 hover:bg-purple-50 cursor-pointer transition-colors w-7 h-7 shrink-0';
      btnAi.title = 'Minta Saran AI';
      btnAi.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3v3M12 18v3M4.9 7.5l2.6 1.5M16.5 15l2.6 1.5M4.9 16.5l2.6-1.5M16.5 9l2.6-1.5" />
          <circle cx="12" cy="12" r="3.4" />
        </svg>
      `;
      if (isMobile) {
        const labelSpan = document.createElement('span');
        labelSpan.textContent = 'Minta Saran AI';
        btnAi.appendChild(labelSpan);
      }
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

  const statusInfo = getItemStatusInfo(item);

  const dotEl = clone.querySelector('.js-dot');
  if (dotEl) {
    dotEl.classList.add(statusInfo.dotClass);
  }

  // Status dot color indicator next to name
  const statusDot = clone.querySelector('.js-status-dot');
  if (statusDot) {
    statusDot.style.backgroundColor = statusInfo.dotColor;
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
    badge.textContent = statusInfo.label;
    badge.className = `js-status-badge badge text-[11px] ${statusInfo.badgeClass}`;
    badge.title = statusInfo.title;
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

  const statusInfo = getItemStatusInfo(item);

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
    badge.textContent = statusInfo.label;
    badge.className = `js-status-badge badge shrink-0 ${statusInfo.badgeClass}`;
    badge.title = statusInfo.title;
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
  const categories = [...new Set(state.allItems.map((i) => i.kategori).filter(Boolean))].sort();

  // Isi dropdown kategori
  if (el.daftarKategori) {
    el.daftarKategori.innerHTML = categories.map((k) => `<option value="${esc(k)}"></option>`).join('');
  }
  if (el.filterKategori) {
    const currentVal = state.activeKategori;
    el.filterKategori.innerHTML = [
      `<option value="Semua">Semua Kategori</option>`,
      ...categories.map((kat) => `<option value="${esc(kat)}">${esc(kat)}</option>`),
    ].join('');
    el.filterKategori.value = categories.includes(currentVal) ? currentVal : 'Semua';
  }

  // Chip bar — hanya chip STATUS (bukan kategori)
  el.chipFilters.innerHTML = '';

  // Chip "Semua" — reset status filter
  const chipSemua = document.createElement('button');
  chipSemua.type = 'button';
  chipSemua.className = `chip ${state.activeStatus === 'Semua' ? 'chip-active active' : ''}`;
  chipSemua.textContent = 'Semua';
  chipSemua.addEventListener('click', () => {
    state.activeStatus = 'Semua';
    renderFilters();
    applyFilters();
  });
  el.chipFilters.appendChild(chipSemua);

  // Chip Aman / Berisiko / Kritis
  const statusList = [
    { key: 'aman', label: 'Aman' },
    { key: 'berisiko', label: 'Berisiko' },
    { key: 'kritis', label: 'Kritis' },
  ];
  const anyStatusActive = state.activeStatus !== 'Semua';
  statusList.forEach(({ key, label }) => {
    const isActive = state.activeStatus === key;
    const count = state.allItems.filter((i) => i.status === key).length;
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `chip ${isActive ? 'chip-active active' : anyStatusActive ? 'chip-muted' : ''}`;
    chip.textContent = `${label} (${count})`;
    chip.addEventListener('click', () => {
      state.activeStatus = isActive ? 'Semua' : key;
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

  if (typeof window.renderUrgentSection === 'function') {
    window.renderUrgentSection();
  }

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
    el.empty.classList.remove('hidden');
    el.itemsContainer.classList.add('hidden');
    return;
  }

  el.empty.classList.add('hidden');
  el.itemsContainer.classList.remove('hidden');
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
    const statusInfo = getItemStatusInfo(item);
    if (statusInfo.isApplied) {
      showToast(`Tindakan AI "${statusInfo.jenisSaran}" untuk "${item.nama}" telah diterapkan.`);
      return;
    }
    // Jika sudah ada rekomendasi aktif yang menunggu tindakan, sorot kartunya di panel AI
    if (statusInfo.hasAiAction && statusInfo.rekomendasi) {
      const recId = statusInfo.rekomendasi.id;
      const aiCard = document.querySelector(
        `[data-buang-item="${item.id}"], [data-cetak-label="${recId}"], [data-terapkan="${recId}"], [data-buat-voucher="${recId}"], [data-cetak-bundling="${recId}"]`
      )?.closest('.card');
      if (aiCard) {
        aiCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        aiCard.classList.add('ring-2', 'ring-purple-500', 'ring-offset-2');
        setTimeout(() => aiCard.classList.remove('ring-2', 'ring-purple-500', 'ring-offset-2'), 2500);
        showToast(`Membuka rekomendasi AI "${statusInfo.jenisSaran}" untuk ${item.nama}.`);
        return;
      }
    }
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

  // Delegasi event klik aksi pada tabel dan kartu (Inventaris & Dashboard Urgent)
  if (el.tableBody) el.tableBody.addEventListener('click', handleActionClick);
  if (el.cards) el.cards.addEventListener('click', handleActionClick);

  const urgentContainer = document.getElementById('urgent-container');
  if (urgentContainer) urgentContainer.addEventListener('click', handleActionClick);

  // Filter input pencarian, dropdown kategori, & tombol reset
  if (el.cari) el.cari.addEventListener('input', applyFilters);

  if (el.filterKategori) {
    el.filterKategori.addEventListener('change', () => {
      state.activeKategori = el.filterKategori.value;
      applyFilters();
    });
  }

  if (el.resetFilter) {
    el.resetFilter.addEventListener('click', () => {
      state.activeKategori = 'Semua';
      state.activeStatus = 'Semua';
      if (el.filterKategori) el.filterKategori.value = 'Semua';
      if (el.cari) el.cari.value = '';
      renderFilters();
      applyFilters();
    });
  }
}
