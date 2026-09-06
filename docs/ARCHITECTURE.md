# Panduan Arsitektur: Monolitik Semi-Microservice (Modular Monolith)

Dokumentasi arsitektur perangkat lunak untuk sistem **Stok Pangan Cerdas**, dikembangkan untuk **Trunodjoyo Creative Competition (TCC) 2026**, cabang **Vibe Code** (Web Application Development).

---

## 1. Ikhtisar Arsitektur

Sistem dirancang dengan pola **Modular Monolith (Semi-Microservice / Domain-Driven Monorepo)**:

```text
Lomba TCC-26/
├── apps/                         # Aplikasi yang dapat dideploy
│   ├── backend/                  # Modular Laravel REST API (Vercel Serverless)
│   │   ├── app/
│   │   │   ├── Modules/          # <--- Domain Bounded Contexts
│   │   │   │   ├── Auth/         # Autentikasi Sanctum & Token Management
│   │   │   │   ├── Inventory/    # Manajemen Stok, Kategori & Deteksi Risiko
│   │   │   │   ├── Intelligence/ # Integrasi Gemini AI Insight Service
│   │   │   │   ├── Voucher/      # Kupon Diskon, Barcode & Validasi Kasir
│   │   │   │   └── Analytics/    # Audit Trail, Riwayat & Statistik
│   │   │   └── Shared/           # Base Controller & Service Utilities
│   │   ├── bootstrap/
│   │   ├── config/
│   │   ├── database/
│   │   ├── resources/openapi/    # Skema OpenAPI modular per domain
│   │   ├── api/index.php         # Entrypoint Vercel Serverless
│   │   └── vercel.json
│   │
│   └── frontend/                 # Client UI SPA (Firebase Hosting)
│       ├── assets/
│       │   ├── css/              # main.css
│       │   └── js/
│       │       ├── api.js, config.js, component-loader.js
│       │       └── dashboard/    # Sub-modul fungsional Clean Architecture
│       │           ├── items-render.js  (Render tabel & kartu)
│       │           ├── items-filter.js  (Filter & KPI summary)
│       │           ├── items-modal.js   (Modal form & events)
│       │           ├── items.js         (Facade orchestrator)
│       │           ├── ai.js, vouchers.js, scanner.js, labels.js, urgent.js
│       ├── components/           # Reusable HTML Component Templates
│       ├── index.html            # Dashboard Stok
│       ├── inventaris.html       # Manajemen Inventaris
│       ├── riwayat.html          # Riwayat & Statistik
│       ├── login.html            # Halaman Login
│       └── firebase.json
│
├── docs/                         # Spesifikasi & Dokumentasi Lomba
│   ├── openapi.json              # Swagger / API Spec
│   ├── deskripsi-karya.html      # Berkas submission TCC-26
│   └── ARCHITECTURE.md           # Dokumen arsitektur ini
│
└── README.md                     # Dokumentasi Utama Monorepo
```

---

## 2. Karakteristik & Bounded Contexts

| Modul Domain | Tanggung Jawab Utama | Clean Architecture Actions / Services |
|---|---|---|
| **Auth** | Autentikasi admin, penerbitan personal access token Sanctum | `AuthController`, `LoginRequest` |
| **Inventory** | Master komoditas pangan, status kesegaran, kalkulasi hari kadaluarsa | `DeleteItemWithAuditAction`, `ItemController` |
| **Intelligence** | Rekomendasi tindakan penyelamatan pangan via Google Gemini | `GeminiInsightService` (Structured Output Schema) |
| **Voucher** | Penerbitan kupon, generator barcode Code-39, simulasi kasir | `GenerateVoucherBatchAction`, `ValidateVoucherAction`, `ClaimVoucherAction` |
| **Analytics** | Agregasi data makanan terselamatkan vs terbuang, ringkasan publik | `RiwayatController`, `RingkasanPublikController` |

---

## 3. Keunggulan Teknis untuk Lomba TCC-26

1. **Microservice-Ready**: Tiap modul memiliki rute, controller, service, dan use case terisolasi. Kapan pun dibutuhkan, modul AI atau Voucher dapat di-extract menjadi microservice terpisah.
2. **Skinny Controllers**: Controller murni bertindak sebagai HTTP adapter; seluruh logika transaksi ditangani Use Cases (Actions).
3. **No Code Bloat**: Seluruh file kode berada di bawah batas standar kualitas industri (< 310 baris).
4. **Deployability Tinggi**: Tetap dapat dideploy ke Vercel Serverless dan Firebase Hosting dengan performa optimal tanpa overhead latensi jaringan antar-service.
