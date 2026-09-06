# Stok Pangan Cerdas — Frontend

Bagian frontend dari project **Stok Pangan Cerdas** (TCC 2026, cabang Vibe
Code). Dibangun dengan **Vanilla JavaScript + Tailwind CSS** (lewat CDN) —
file statis murni yang memanggil backend Laravel di `../backend/` lewat
`fetch()`. Tidak ada proses build atau bundler.

## Live Demo

- **Domain Utama:** https://stok-pangan-cerdas.web.app
- **Domain Cadangan:** https://stok-pangan-cerdas.firebaseapp.com

## Halaman

- `login.html` — Login admin.
- `index.html` — Dashboard Stok: ringkasan, filter, CRUD barang, AI Insight Panel, Kupon Kasir.
- `riwayat.html` — Riwayat tindakan & statistik barang terselamatkan.

Logika tiap halaman ada di `assets/js/` (`login.js`, `dashboard.js`, `riwayat.js`).
Konfigurasi target API diatur di `assets/js/config.js`, sementara `assets/js/api.js` bertindak sebagai klien HTTP bersama dan penanganan token autentikasi.

## Menjalankan Singkat (Lokal)

```bash
python -m http.server 5500
```

Buka `http://127.0.0.1:5500/login.html`. Secara otomatis sistem mengarah ke `http://127.0.0.1:8000/api` saat diakses lokal.

## Deployment ke Google Firebase Hosting

Deployment frontend dilakukan melalui Firebase CLI:

```bash
firebase login
firebase deploy --only hosting
```

## Dokumentasi Lengkap

Alur penggunaan aplikasi, kredensial admin demo, dan seluruh dokumentasi lainnya ada di **README di root project** (`../README.md`) — bukan di sini.
