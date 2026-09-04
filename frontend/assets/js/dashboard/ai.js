/**
 * Modul Rekomendasi AI Copilot
 * Arsitektur Bersih (Clean Architecture) - Domain & Feature Layer
 */

import { state } from './state.js?v=1.0.5';
import { el } from './elements.js?v=1.0.5';
import { showToast, esc } from './utils.js?v=1.0.5';
import { applyFilters, openDeleteModal } from './items.js?v=1.0.5';
import { openLabelModal } from './labels.js?v=1.0.5';
import { openVoucherModal } from './vouchers.js?v=1.0.5';

const AI_SUDAH_DITERAPKAN_JAM = 24;

export function isSudahDiterapkanBaruBaruIni(r) {
  if (!r.diterapkan_at) return true;
  const jamSejakDiterapkan = (Date.now() - new Date(r.diterapkan_at).getTime()) / 3600000;
  return jamSejakDiterapkan < AI_SUDAH_DITERAPKAN_JAM;
}

export function getRekomendasiTampil() {
  const perluDitindak = state.allRekomendasi.filter((r) => !r.diterapkan);
  const sudahDitindak = state.allRekomendasi.filter((r) => r.diterapkan && isSudahDiterapkanBaruBaruIni(r));
  return { perluDitindak, sudahDitindak };
}

export function updateAiFilterUI() {
  const { perluDitindak, sudahDitindak } = getRekomendasiTampil();

  if (el.aiCountSemua) el.aiCountSemua.textContent = perluDitindak.length + sudahDitindak.length;
  if (el.aiCountBelum) el.aiCountBelum.textContent = perluDitindak.length;
  if (el.aiCountSudah) el.aiCountSudah.textContent = sudahDitindak.length;

  if (el.aiFilterTabs) {
    const buttons = el.aiFilterTabs.querySelectorAll('[data-ai-filter]');
    buttons.forEach((btn) => {
      const isActive = btn.dataset.aiFilter === state.activeAiFilter;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }
}

export function renderAiEmptyBelumBox() {
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

export function renderAiCard(rekomendasi) {
  const item = rekomendasi.item;
  if (!item) return null;

  const template = document.getElementById('tmpl-ai-card');
  if (!template) return null;
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
    const btnBuang = document.createElement('button');
    btnBuang.type = 'button';
    btnBuang.dataset.buangItem = item.id;
    btnBuang.dataset.recId = rekomendasi.id;
    btnBuang.className = 'btn btn-danger h-9 px-4 text-[12.5px] ml-auto inline-flex items-center gap-1.5 font-semibold cursor-pointer';
    btnBuang.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/></svg> <span>Buang Barang</span>`;
    actions.appendChild(btnBuang);
  } else if (jenis === 'diskon') {
    const btnLabel = document.createElement('button');
    btnLabel.type = 'button';
    btnLabel.dataset.cetakLabel = rekomendasi.id;
    btnLabel.className = 'btn btn-outline h-9 px-3 text-[12px] inline-flex items-center gap-1.5 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 transition font-medium cursor-pointer';
    btnLabel.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><circle cx="7" cy="7" r=".5" fill="currentColor"/></svg> <span>Print Label</span>`;
    actions.appendChild(btnLabel);

    const btnVoucher = document.createElement('button');
    btnVoucher.type = 'button';
    btnVoucher.dataset.buatVoucher = rekomendasi.id;
    btnVoucher.className = 'btn bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 h-9 px-3.5 text-[12px] inline-flex items-center gap-1.5 font-semibold transition ml-auto cursor-pointer';
    btnVoucher.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg> <span>Print Kupon</span>`;
    actions.appendChild(btnVoucher);
  } else if (jenis === 'bundling') {
    const btnBundling = document.createElement('button');
    btnBundling.type = 'button';
    btnBundling.dataset.cetakBundling = rekomendasi.id;
    btnBundling.className = 'btn bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 h-9 px-3.5 text-[12.5px] ml-auto inline-flex items-center gap-1.5 font-semibold transition cursor-pointer';
    btnBundling.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/></svg> <span>Print Label Bundling</span>`;
    actions.appendChild(btnBundling);
  } else if (jenis === 'distribusi') {
    const btnDistribusi = document.createElement('button');
    btnDistribusi.type = 'button';
    btnDistribusi.dataset.terapkan = rekomendasi.id;
    btnDistribusi.className = 'btn btn-primary h-9 px-3.5 text-[12.5px] ml-auto font-semibold inline-flex items-center gap-1.5 cursor-pointer';
    btnDistribusi.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg> <span>Salurkan Pangan</span>`;
    actions.appendChild(btnDistribusi);
  } else {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.terapkan = rekomendasi.id;
    btn.className = 'btn btn-primary h-9 px-3.5 text-[13px] ml-auto font-semibold cursor-pointer';
    btn.textContent = 'Tandai Diterapkan';
    actions.appendChild(btn);
  }

  return clone;
}

export function renderAiGroup(judul, daftarRekomendasi) {
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

export function renderRekomendasi() {
  if (!el.aiList) return;
  el.aiList.innerHTML = '';
  updateAiFilterUI();

  const total = state.allRekomendasi.length;
  if (el.aiEmpty) el.aiEmpty.classList.toggle('hidden', total > 0);
  if (el.aiContainer) el.aiContainer.classList.toggle('hidden', total === 0);

  if (total === 0) return;

  const { perluDitindak, sudahDitindak } = getRekomendasiTampil();
  const fragment = document.createDocumentFragment();

  if (state.activeAiFilter === 'semua') {
    if (perluDitindak.length === 0 && sudahDitindak.length === 0) {
      fragment.appendChild(renderAiEmptyBelumBox());
    } else {
      const groupPerlu = renderAiGroup('Perlu Ditindak', perluDitindak);
      const groupSudah = renderAiGroup('Diterapkan', sudahDitindak);
      if (groupPerlu) fragment.appendChild(groupPerlu);
      if (groupSudah) fragment.appendChild(groupSudah);
    }
  } else if (state.activeAiFilter === 'belum') {
    if (perluDitindak.length > 0) {
      const groupPerlu = renderAiGroup('Perlu Ditindak', perluDitindak);
      if (groupPerlu) fragment.appendChild(groupPerlu);
    } else {
      fragment.appendChild(renderAiEmptyBelumBox());
    }
  } else if (state.activeAiFilter === 'sudah') {
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

export async function loadRekomendasi() {
  if (!el.aiLoading || !el.aiError) return;
  el.aiError.classList.add('hidden');
  el.aiLoading.classList.remove('hidden');
  try {
    const data = await window.fetchRekomendasi();
    state.allRekomendasi = (data || []).filter((r) => r && r.item);
    renderRekomendasi();
  } catch (err) {
    el.aiError.textContent = err.message || 'Gagal memuat rekomendasi AI.';
    el.aiError.classList.remove('hidden');
  } finally {
    el.aiLoading.classList.add('hidden');
  }
}

export async function requestRekomendasi(item, button) {
  if (state.generatingItemId) return;
  state.generatingItemId = item.id;
  button.disabled = true;
  const originalHtml = button.innerHTML;
  button.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" class="animate-spin" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>';

  try {
    const rekomendasi = await window.generateRekomendasi(item.id);
    if (el.aiError) el.aiError.classList.add('hidden');

    const sudahAda = state.allRekomendasi.some((r) => r.id === rekomendasi.id);
    if (sudahAda) {
      state.allRekomendasi = state.allRekomendasi.map((r) => (r.id === rekomendasi.id ? rekomendasi : r));
      showToast(`Rekomendasi untuk "${item.nama}" sudah ada, tidak dibuat ulang.`);
    } else {
      state.allRekomendasi = [rekomendasi, ...state.allRekomendasi];
      showToast(`Rekomendasi AI untuk "${item.nama}" berhasil dibuat.`);
    }
    renderRekomendasi();
  } catch (err) {
    if (el.aiError) {
      el.aiError.textContent = err.message || 'Gagal meminta rekomendasi AI.';
      el.aiError.classList.remove('hidden');
    }
  } finally {
    state.generatingItemId = null;
    button.disabled = false;
    button.innerHTML = originalHtml;
    applyFilters();
  }
}

/**
 * Setup Event Listeners untuk Panel AI
 */
export function initAiEvents() {
  if (el.aiFilterTabs) {
    el.aiFilterTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-ai-filter]');
      if (!btn) return;
      state.activeAiFilter = btn.dataset.aiFilter;
      renderRekomendasi();
    });
  }

  if (el.aiList) {
    el.aiList.addEventListener('click', async (e) => {
      // 1. Handler Cetak Label Rak (Diskon)
      const btnLabel = e.target.closest('[data-cetak-label]');
      if (btnLabel) {
        const id = Number(btnLabel.dataset.cetakLabel);
        const rec = state.allRekomendasi.find((r) => r.id === id);
        if (rec && rec.item) {
          openLabelModal(rec.item, rec, false);
        }
        return;
      }

      // 2. Handler Cetak Label Paket Bundling
      const btnBundling = e.target.closest('[data-cetak-bundling]');
      if (btnBundling) {
        const id = Number(btnBundling.dataset.cetakBundling);
        const rec = state.allRekomendasi.find((r) => r.id === id);
        if (rec && rec.item) {
          openLabelModal(rec.item, rec, true);
        }
        return;
      }

      // 3. Handler Buat Kupon Barcode
      const btnVoucher = e.target.closest('[data-buat-voucher]');
      if (btnVoucher) {
        const id = Number(btnVoucher.dataset.buatVoucher);
        const rec = state.allRekomendasi.find((r) => r.id === id);
        if (rec && rec.item) {
          openVoucherModal(rec.item, rec);
        }
        return;
      }

      // 4. Handler Tombol Buang Barang (dari saran AI)
      const btnBuang = e.target.closest('[data-buang-item]');
      if (btnBuang) {
        const itemId = Number(btnBuang.dataset.buangItem);
        const item = state.allItems.find((i) => i.id === itemId);
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
        const updated = await window.terapkanRekomendasi(id);
        state.allRekomendasi = state.allRekomendasi.map((r) => (r.id === id ? updated : r));
        renderRekomendasi();
        applyFilters();
        showToast('Rekomendasi ditandai sebagai diterapkan.');
      } catch (err) {
        showToast(err.message || 'Gagal memperbarui rekomendasi.');
        button.disabled = false;
      }
    });
  }
}
