# Stok Pangan Cerdas — Frontend

Bagian frontend dari project **Stok Pangan Cerdas** (TCC 2026, cabang Vibe
Code). Dibangun dengan **Vanilla JavaScript + Tailwind CSS** (lewat CDN) —
file statis murni yang memanggil backend Laravel di `../backend/` lewat
`fetch()`. Tidak ada proses build atau bundler.

## Halaman

- `login.html` — Login admin.
- `index.html` — Dashboard Stok: ringkasan, filter, CRUD barang, AI
  Insight Panel.
- `riwayat.html` — Riwayat tindakan & statistik barang terselamatkan.

Logika tiap halaman ada di `assets/js/` (`login.js`, `dashboard.js`,
`riwayat.js`), sementara `assets/js/api.js` jadi klien HTTP bersama yang
juga menangani penyimpanan token autentikasi.

## Menjalankan singkat

```bash
python -m http.server 5500
```

Lalu buka `http://127.0.0.1:5500/login.html`. Pastikan backend sudah
berjalan di `http://127.0.0.1:8000` (lihat `../backend/README.md`).

## Dokumentasi lengkap

Alur penggunaan aplikasi, kredensial admin demo, dan seluruh dokumentasi
lainnya ada di **README di root project** (`../README.md`) — bukan di sini.
