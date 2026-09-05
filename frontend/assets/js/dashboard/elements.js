/**
 * Cache Elemen DOM Dashboard
 * Arsitektur Bersih (Clean Architecture) - UI Elements Layer
 */

export const el = {
  // Waktu & Identitas Pengguna
  tanggalHariIni: document.getElementById('tanggal-hari-ini'),
  userName: document.getElementById('user-name'),
  btnLogout: document.getElementById('btn-logout'),

  // Header & Filter Inventaris
  jumlahTampil: document.getElementById('jumlah-tampil'),
  chipFilters: document.getElementById('chip-filters'),
  filterKategori: document.getElementById('filter-kategori'),
  cari: document.getElementById('filter-cari'),
  resetFilter: document.getElementById('reset-filter'),

  // State Tampilan Inventaris
  loading: document.getElementById('state-loading'),
  error: document.getElementById('state-error'),
  empty: document.getElementById('state-empty'),
  itemsContainer: document.getElementById('items-container'),
  tableBody: document.getElementById('items-table-body'),
  cards: document.getElementById('items-cards'),

  // KPI Summary
  summaryTotal: document.getElementById('summary-total'),
  summaryTotalStok: document.getElementById('summary-total-stok'),
  summaryAman: document.getElementById('summary-aman'),
  summaryBerisiko: document.getElementById('summary-berisiko'),
  summaryKritis: document.getElementById('summary-kritis'),

  // Aksi Cepat Tambah Barang
  btnTambah: document.getElementById('btn-tambah'),
  btnTambahFab: document.getElementById('btn-tambah-fab'),

  // Modal Form Tambah / Edit Barang
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

  // Modal Hapus Barang
  modalHapus: document.getElementById('modal-hapus'),
  modalHapusText: document.getElementById('modal-hapus-text'),
  modalHapusConfirm: document.getElementById('modal-hapus-confirm'),
  modalHapusCancel: document.getElementById('modal-hapus-cancel'),

  // Notifikasi Toast
  toast: document.getElementById('toast'),

  // Panel AI Copilot
  aiLoading: document.getElementById('ai-loading'),
  aiError: document.getElementById('ai-error'),
  aiEmpty: document.getElementById('ai-empty'),
  aiContainer: document.getElementById('ai-container'),
  aiList: document.getElementById('ai-list'),
  aiFilterTabs: document.getElementById('ai-filter-tabs'),
  aiCountSemua: document.getElementById('ai-count-semua'),
  aiCountBelum: document.getElementById('ai-count-belum'),
  aiCountSudah: document.getElementById('ai-count-sudah'),

  // Modal Stiker Label Diskon Rak
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

  // Navigasi & Modal Kupon Kasir
  btnNavScanVoucher: document.getElementById('btn-nav-scan-voucher'),
  btnMobileScanVoucher: document.getElementById('btn-mobile-scan-voucher'),
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
  printableVouchersArea: document.getElementById('printable-vouchers-area'),

  // Modal Simulator Kasir (Scan Voucher)
  modalScanVoucher: document.getElementById('modal-scan-voucher'),
  modalScanClose: document.getElementById('modal-scan-close'),
  modalScanCloseBtn: document.getElementById('modal-scan-close-btn'),
  scanInputKode: document.getElementById('scan-input-kode'),
  scanInputBelanja: document.getElementById('scan-input-belanja'),
  btnDoScan: document.getElementById('btn-do-scan'),
  scanQuickVouchers: document.getElementById('scan-quick-vouchers'),
  btnKasirCreateVoucher: document.getElementById('btn-kasir-create-voucher'),
  scanResultContainer: document.getElementById('scan-result-container'),
  btnScanCamera: document.getElementById('btn-scan-camera'),
  btnScanCameraClose: document.getElementById('btn-scan-camera-close'),
  scanCameraWrap: document.getElementById('scan-camera-wrap'),
  scanCameraVideo: document.getElementById('scan-camera-video'),
  scanCameraStatus: document.getElementById('scan-camera-status'),
};
