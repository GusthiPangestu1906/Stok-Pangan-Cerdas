/**
 * Modul Manajemen Inventaris (Items Orchestrator)
 * Arsitektur Bersih (Clean Architecture) - Facade & Public API Module
 *
 * Modul ini mengekspor kembali (re-exports) seluruh fungsionalitas dari sub-modul terisolasi:
 * - items-render.js : Render tabel, kartu mobile, status badge, progress bar, action buttons.
 * - items-filter.js : Filter kategori, pencarian teks, chip status, kartu KPI, dan ringkasan stok.
 * - items-modal.js  : Form tambah/edit barang, konfirmasi hapus, handling aksi klik, dan event listeners.
 */

// 1. Render Layer
export {
  getItemStatusInfo,
  hasRekomendasiAktif,
  renderActionButtons,
  renderTableRow,
  renderCard,
  renderItems,
} from './items-render.js';

// 2. Filter & Summary Layer
export {
  renderTanggalHariIni,
  renderSummary,
  setupKpiFilterEvents,
  renderFilters,
  applyFilters,
} from './items-filter.js';

// 3. Modal & Interaction Layer
export {
  openFormModal,
  closeFormModal,
  openDeleteModal,
  closeDeleteModal,
  handleActionClick,
  loadItems,
  initItemsEvents,
} from './items-modal.js';
