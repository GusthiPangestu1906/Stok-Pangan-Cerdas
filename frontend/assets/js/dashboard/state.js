/**
 * State Terpusat untuk Dashboard Sistem Manajemen Stok Pangan Cerdas
 * Arsitektur Bersih (Clean Architecture) - State Management Layer
 */

export const state = {
  // Data Koleksi Utama
  allItems: [],
  allRekomendasi: [],

  // Filter Aktif
  activeKategori: 'Semua',
  activeStatus: 'Semua',
  activeAiFilter: 'semua',

  // Penanda Status Aksi
  editingItemId: null,
  deletingItemId: null,
  generatingItemId: null,

  // Draft Data Modal Label Diskon Rak
  currentLabelData: {
    id: null,
    rekomendasiId: null,
    nama: '',
    kategori: '',
    kadaluarsa: '',
    sisaHari: 0,
    hargaAsli: 0,
    diskonPct: 30,
    tagline: '',
    qty: 4,
  },

  // Draft Data Modal Kupon Kasir
  currentVoucherData: {
    id: null,
    rekomendasiId: null,
    judul: '',
    target: 'Semua',
    kadaluarsa: '',
    tipe: 'persen',
    nilai: 30,
    minBelanja: 0,
    qty: 4,
    kode: '',
  },

  // Perangkat Pemindai Kamera Kasir
  scanCameraStream: null,
  scanCameraRafId: null,
  scanBarcodeDetector: null,
};
