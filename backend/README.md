# Stok Pangan Cerdas — Backend

Bagian backend dari project **Stok Pangan Cerdas** (TCC 2026, cabang Vibe
Code). Dibangun dengan Laravel sebagai **REST API murni** — tidak merender
tampilan apa pun lewat Blade, hanya menyediakan endpoint JSON di bawah
`/api` yang dikonsumsi oleh frontend Vanilla JS di folder `../frontend/`.

## Teknologi

Laravel 13, PHP 8.4, PostgreSQL, Laravel Sanctum (autentikasi token), dan
Google Gemini API (rekomendasi tindakan AI Insight Panel).

## Menjalankan singkat

```bash
composer install
cp .env.example .env
php artisan key:generate
# isi DB_* dan GEMINI_API_KEY di .env
php artisan migrate:fresh --seed
php artisan serve --port=8000
```

## Dokumentasi lengkap

Cara menjalankan detail, kredensial admin demo, daftar endpoint API, alur
penggunaan aplikasi, penjelasan deteksi risiko rule-based vs AI generatif,
dan seluruh dokumentasi lainnya ada di **README di root project**
(`../README.md`) — bukan di sini.
