# Panduan Deployment: Supabase PostgreSQL & Render Cloud

Dokumen ini menjelaskan langkah-langkah lengkap untuk mengaitkan dan menjalankan **Stok Pangan Cerdas** menggunakan **Supabase (PostgreSQL Database)** dan **Render (Hosting Backend & Frontend)**.

---

## 🏗️ Arsitektur Sistem

- **Database**: Supabase PostgreSQL (Managed DB with SSL & Connection Pooler).
- **Backend**: Laravel 13 (PHP 8.4) berjalan di Render Web Service via Docker container.
- **Frontend**: HTML5, CSS3, & Vanilla JS dideploy sebagai Render Static Site (atau Vercel / GitHub Pages).

---

## 1. Persiapan Supabase (PostgreSQL)

1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan buat proyek baru (misal: `stok-pangan-cerdas`).
2. Tentukan **Database Password** yang kuat dan simpan password tersebut.
3. Setelah database siap, buka menu **Project Settings** (ikon gerigi) -> **Database**.
4. Gulir ke bagian **Connection string**:
   - Pilih tab **URI**.
   - Pilih mode **Session** (Port `5432`) untuk kompatibilitas penuh dengan migrasi Laravel ORM.
   - Salin URI tersebut, bentuknya menyerupai:
     ```text
     postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
     ```
   - Pastikan menambahkan parameter `?sslmode=require` di akhir string jika belum ada.

> 💡 **Tips Supabase**: Anda juga bisa menggunakan mode Direct Connection (`db.[PROJECT_REF].supabase.co:5432`). Jika menggunakan pooler, port `5432` (Session Mode) sangat disarankan untuk Laravel migrations.

---

## 2. Deploy ke Render

Repositori ini telah dilengkapi file `render.yaml` (Blueprint) dan `backend/Dockerfile` yang siap pakai.

### Opsi A: Menggunakan Render Blueprint (Otomatis / 1-Click)

1. Buka [Render Dashboard](https://dashboard.render.com/).
2. Klik tombol **New +** di pojok kanan atas, lalu pilih **Blueprint**.
3. Hubungkan repositori GitHub Anda: `https://github.com/GusthiPangestu1906/Stok-Pangan-Cerdas.git`.
4. Pilih branch **`develop`**.
5. Render akan otomatis membaca file `render.yaml` dan mendeteksi:
   - **`stok-pangan-cerdas-backend`** (Docker Web Service)
   - **`stok-pangan-cerdas-frontend`** (Static Site)
6. Masukkan nilai untuk environment variables yang diminta:
   - `DATABASE_URL`: Masukkan connection string Supabase Anda dari langkah 1.
   - `GEMINI_API_KEY`: Masukkan API key Google Gemini Anda.
7. Klik **Apply**. Render akan membangun container backend, menjalankan migrasi database otomatis, menjalankan seeder data awal, dan menyajikan frontend.

---

### Opsi B: Deploy Backend Secara Manual di Render

Jika ingin membuat layanan satu per satu secara manual:

1. Di Render Dashboard, klik **New +** -> **Web Service**.
2. Hubungkan repositori `Stok-Pangan-Cerdas`.
3. Isi konfigurasi dasar:
   - **Name**: `stok-pangan-cerdas-backend`
   - **Region**: Singapore (pilih yang terdekat dengan database Supabase)
   - **Branch**: `develop`
   - **Root Directory**: Biarkan kosong atau isi `backend`
   - **Runtime**: **Docker**
   - **Dockerfile Path**: `./backend/Dockerfile`
   - **Docker Context**: `./backend`
4. Di bagian **Environment Variables**, tambahkan:

| Key | Value | Catatan |
|---|---|---|
| `APP_NAME` | `Stok Pangan Cerdas` | |
| `APP_ENV` | `production` | |
| `APP_DEBUG` | `false` | |
| `APP_KEY` | *(Klik "Generate" di Render atau isi key base64)* | |
| `DB_CONNECTION` | `pgsql` | |
| `DB_SSLMODE` | `require` | Wajib untuk Supabase |
| `DATABASE_URL` | `postgresql://postgres.[REF]:[PASS]@[HOST]:5432/postgres?sslmode=require` | Dari Supabase |
| `GEMINI_API_KEY` | *(API key Gemini)* | Fitur AI Insight |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` | |
| `GEMINI_MODEL_FALLBACKS` | `gemini-3.1-flash-lite,gemini-3.6-flash` | |
| `RUN_MIGRATIONS` | `true` | Menjalankan `php artisan migrate --force` saat deploy |
| `RUN_SEEDER` | `true` | Menjalankan seeder data awal saat pertama kali deploy |

5. Di bagian **Advanced**:
   - **Health Check Path**: `/up`
6. Klik **Create Web Service**.

---

## 3. Menghubungkan Frontend ke Backend Render

Setelah backend selesai dideploy, Render akan memberikan URL publik, misalnya:
`https://stok-pangan-cerdas-backend.onrender.com`

Untuk mengarahkan frontend ke backend tersebut:

1. Buka file `frontend/assets/js/config.js`.
2. Ubah baris `API_BASE_URL` menjadi URL backend Render Anda ditambah `/api`:
   ```javascript
   window.SPC_CONFIG = {
     API_BASE_URL: 'https://stok-pangan-cerdas-backend.onrender.com/api'
   };
   ```
3. Commit dan push perubahan tersebut ke GitHub:
   ```bash
   git add frontend/assets/js/config.js
   git commit -m "chore: set production backend URL from Render"
   git push origin develop
   ```

*(Alternatif tanpa edit file: Pengguna juga bisa menyimpan URL di browser Console via `localStorage.setItem('spc_api_base_url', 'https://stok-pangan-cerdas-backend.onrender.com/api')`)*.

---

## 4. Akun Default & Pengujian

Setelah migrasi dan seeding berhasil dijalankan pada database Supabase, Anda dapat langsung login dengan akun bawaan:

- **Email**: `admin@koperasipangan.id`
- **Password**: `admin123`

### Pengujian Health Check
Buka di browser:
`https://[BACKEND-RENDER-URL]/up`
Jika response mengembalikan status HTTP `200 OK`, maka koneksi backend ke database Supabase dan server telah berjalan normal.
