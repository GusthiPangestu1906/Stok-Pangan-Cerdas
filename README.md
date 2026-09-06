# Stok Pangan Cerdas — Monorepo

Sistem manajemen stok pangan untuk koperasi dan UMKM dengan fitur **AI Expiry & Spoilage Predictor**, dibangun untuk **Trunodjoyo Creative Competition (TCC) 2026**, cabang **Vibe Code** (Web Application Development).

---

## 🏛️ Struktur Monorepo (Modular Monolith)

Repositori ini menerapkan arsitektur **Monolitik Semi-Microservice (Modular Monolith)** dengan pembagian domain mandiri (*Bounded Contexts*):

```text
Lomba TCC-26/
├── apps/                         # Aplikasi yang dapat dideploy
│   ├── backend/                  # Modular Laravel REST API (Vercel Serverless)
│   │   ├── app/
│   │   │   ├── Modules/          # Domain Bounded Contexts (Auth, Inventory, Intelligence, Voucher, Analytics)
│   │   │   └── Shared/           # Shared Base Controllers & Services
│   │   ├── resources/openapi/    # Skema OpenAPI modular per domain
│   │   ├── api/index.php         # Entrypoint Vercel Serverless
│   │   └── vercel.json           # Konfigurasi deployment Vercel
│   │
│   └── frontend/                 # Client UI SPA (Firebase Hosting)
│       ├── assets/               # CSS, Gambar, & Modular JavaScript
│       ├── components/           # Reusable HTML Templates
│       ├── index.html            # Dashboard Stok
│       ├── inventaris.html       # Manajemen Inventaris
│       ├── riwayat.html          # Riwayat & Statistik
│       ├── login.html            # Halaman Login Admin
│       └── firebase.json         # Konfigurasi hosting Firebase
│
├── docs/                         # Spesifikasi & Dokumentasi Lomba
│   ├── openapi.json              # Swagger / API Spec lengkap
│   ├── deskripsi-karya.html      # Berkas submission TCC-26
│   └── ARCHITECTURE.md           # Panduan arsitektur modular & clean architecture
│
└── README.md                     # Dokumentasi Utama Monorepo
```

---

## 🚀 Panduan Menjalankan Lokal

### 1. Menjalankan Backend (Laravel)
```bash
cd apps/backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```
* Backend API berjalan di: `http://127.0.0.1:8000/api`
* Dokumentasi Swagger UI: `http://127.0.0.1:8000/docs`

### 2. Menjalankan Frontend
Frontend berupa SPA statis (HTML5, Vanilla JS, Tailwind CSS via CDN):
* Buka folder `apps/frontend/` dengan Live Server atau web server lokal favorit Anda.
* Konfigurasi endpoint API di [`apps/frontend/assets/js/config.js`](file:///c:/Users/Gusthi%20Pangestu/Documents/Lomba%20TCC-26/apps/frontend/assets/js/config.js).

---

## 🧪 Menjalankan Automated Tests
```bash
cd apps/backend
php artisan test
```

---

## 👥 Identitas Peserta (TCC-26)
* **Kompetisi**: Trunodjoyo Creative Competition (TCC) 2026
* **Cabang Lomba**: Vibe Code (Web Application Development)
* **Asal Instansi**: Politeknik Elektronika Negeri Surabaya (PENS)
* **Ketua Tim**: Gusthi Pangestu (3124600098)
* **Anggota Tim**: Hammam Hidayatullah (3124600096)
