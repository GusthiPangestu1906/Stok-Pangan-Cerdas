# Stok Pangan Cerdas — Frontend (Clean Architecture)

Bagian frontend dari project **Stok Pangan Cerdas** (TCC 2026, cabang Vibe Code). 
Telah direfaktor menggunakan prinsip **Clean Architecture** untuk memisahkan struktur, gaya, dan logika secara modular.

## 🛡️ Security & Deployment
- **Hybrid Demo Mode**: Menggunakan logika `SHOULD_USE_DEMO`. Aplikasi otomatis masuk Mode Demo jika dijalankan di `localhost` (untuk audit UI tanpa database), namun **wajib login** secara ketat jika di-deploy ke production.
- **Safe API Handling**: Data sensitif hanya diakses melalui header `Authorization` yang valid melalui `api.js`.

## 🚀 Quality & Architecture
- **Separation of Concerns**: 
  - **Struktur**: HTML5 murni dengan `<template>` tags.
  - **Gaya**: CSS terpusat di `assets/css/main.css` menggunakan Semantic Design System.
  - **Logika**: Vanilla JS modular di `assets/js/`.
- **Semantic Design System**: UI konsisten menggunakan utility classes seperti `.text-primary`, `.bg-surface`, `.card`, dan `.btn`.
- **Template-Based Rendering**: Menggunakan `cloneNode()` standar untuk rendering dinamis yang bersih, menggantikan injeksi string HTML di JavaScript.
- **Global Branding Sync**: Logo dan Footer disinkronkan di seluruh halaman (`index.html`, `login.html`, `riwayat.html`).

## 📂 Struktur Folder
- `index.html` & `riwayat.html`: Menggunakan HTML5 Templates untuk rendering.
- `assets/css/main.css`: Definisi komponen dan utility classes (Design System).
- `assets/js/dashboard.js` & `riwayat.js`: Logika aplikasi dengan dukungan Hybrid Mode.
- `assets/js/api.js`: Klien HTTP dan manajemen autentikasi.

## 🛠️ Menjalankan Lokal (Mode Demo)
Anda dapat langsung melihat UI dan fungsionalitas tanpa backend dengan menjalankan server statis:

```bash
python -m http.server 5500
```
Lalu buka `http://127.0.0.1:5500/index.html`.

---
**Branch:** `refactor-frontend-clean-architecture`  
**Status:** Refactor Complete & Verified.
