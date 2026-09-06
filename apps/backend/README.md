# Stok Pangan Cerdas — Backend

Bagian backend dari project **Stok Pangan Cerdas** (TCC 2026, cabang Vibe
Code). Dibangun dengan Laravel sebagai **REST API murni** — tidak merender
tampilan apa pun lewat Blade, hanya menyediakan endpoint JSON di bawah
`/api` yang dikonsumsi oleh frontend Vanilla JS di folder `../frontend/`.

## Live API Endpoint

- **URL:** https://stok-pangan-cerdas-delta.vercel.app/api
- **Health Check:** https://stok-pangan-cerdas-delta.vercel.app/up

## Teknologi

Laravel 12 / 13, PHP 8.4, Neon Serverless PostgreSQL (AWS Singapore), Laravel Sanctum (autentikasi token), Google Gemini API (rekomendasi tindakan AI Insight Panel), dan runtime Vercel Serverless (`vercel-php`).

## Menjalankan Singkat (Lokal)

```bash
composer install
cp .env.example .env
php artisan key:generate
# isi DB_* dan GEMINI_API_KEY di .env
php artisan migrate:fresh --seed
php artisan serve --port=8000
```

## Deployment ke Vercel Serverless

1. Konfigurasi runtime serverless diatur melalui `vercel.json` dan entrypoint `api/index.php`.
2. Database terhubung ke Neon PostgreSQL (`sslmode=require`).
3. Deploy menggunakan Vercel CLI atau GitHub push ke repository fork.

## Dokumentasi Lengkap

Cara menjalankan detail, kredensial admin demo, daftar endpoint API, alur penggunaan aplikasi, penjelasan deteksi risiko rule-based vs AI generatif, dan seluruh dokumentasi lainnya ada di **README di root project** (`../README.md`) — bukan di sini.
