/**
 * Modul Manajemen Inventaris — Filter & Summary Layer
 * Tanggung Jawab: Filter kategori, pencarian teks, chip status, kartu KPI, dan ringkasan stok
 */

import { state } from './state.js?v=1.0.7';
import { el } from './elements.js?v=1.0.7';
import { esc, BULAN_PANJANG, HARI } from './utils.js?v=1.0.7';
import { renderItems } from './items-render.js';

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
