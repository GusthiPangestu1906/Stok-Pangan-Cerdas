/**
 * Sistem Manajemen Stok Pangan Cerdas — Dashboard Orchestrator
 * Arsitektur Bersih (Clean Architecture) - Main Application Bootstrap Layer
 */

import { state } from './dashboard/state.js?v=1.0.5';
import { el } from './dashboard/elements.js?v=1.0.5';
import {
  renderTanggalHariIni,
  renderFilters,
  applyFilters,
  setupKpiFilterEvents,
  initItemsEvents,
  closeFormModal,
  closeDeleteModal,
} from './dashboard/items.js?v=1.0.5';
import { renderRekomendasi, initAiEvents } from './dashboard/ai.js?v=1.0.5';
import { initLabelsEvents, closeLabelModal } from './dashboard/labels.js?v=1.0.5';
import { initVouchersEvents, closeVoucherModal } from './dashboard/vouchers.js?v=1.0.5';
import { initScannerEvents, closeScanVoucherModal } from './dashboard/scanner.js?v=1.0.5';

// 1. Validasi Keamanan Otentikasi Pengguna
if (typeof window.getToken === 'function' && !window.getToken()) {
  window.location.href = 'login.html';
}

// 2. Global Keyboard Shortcut (Tutup Semua Modal dengan Tombol Escape)
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (el.modalForm && !el.modalForm.classList.contains('hidden')) closeFormModal();
  if (el.modalHapus && !el.modalHapus.classList.contains('hidden')) closeDeleteModal();
  if (el.modalLabelDiskon && !el.modalLabelDiskon.classList.contains('hidden')) closeLabelModal();
  if (el.modalVoucher && !el.modalVoucher.classList.contains('hidden')) closeVoucherModal();
  if (el.modalScanVoucher && !el.modalScanVoucher.classList.contains('hidden')) closeScanVoucherModal();
});

// 3. Tombol Logout Akun
if (el.btnLogout) {
  el.btnLogout.addEventListener('click', async () => {
    el.btnLogout.disabled = true;
    try {
      if (typeof window.logout === 'function') {
        await window.logout();
      }
    } finally {
      window.location.href = 'login.html';
    }
  });
}

// 4. Inisialisasi Event Submodul
initItemsEvents();
initAiEvents();
initLabelsEvents();
initVouchersEvents();
initScannerEvents();

// 5. Inisialisasi Alur Kerja Dashboard
async function init() {
  renderTanggalHariIni();

  if (el.loading) el.loading.classList.remove('hidden');
  try {
    const [me, items, rekomendasi] = await Promise.all([
      window.fetchMe(),
      window.fetchItems(),
      window.fetchRekomendasi(),
    ]);

    if (me && me.name && el.userName) {
      el.userName.textContent = me.name;
    }

    state.allItems = items || [];
    state.allRekomendasi = (rekomendasi || []).filter((r) => r && r.item);

    setupKpiFilterEvents();
    renderFilters();
    applyFilters();
    renderRekomendasi();
  } catch (err) {
    if (el.error) {
      el.error.textContent = err.message || 'Gagal memuat data dari server.';
      el.error.classList.remove('hidden');
    }
  } finally {
    if (el.loading) el.loading.classList.add('hidden');
    if (el.aiLoading) el.aiLoading.classList.add('hidden');
    if (state.allItems.length > 0 && el.itemsContainer) {
      el.itemsContainer.classList.remove('hidden');
    }
    if (el.aiContainer) el.aiContainer.classList.remove('hidden');
  }
}

// Jalankan bootstrap dashboard
init();
