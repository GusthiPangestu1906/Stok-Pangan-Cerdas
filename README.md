# Stok Pangan Cerdas

Sistem manajemen stok pangan untuk koperasi/UMKM dengan fitur AI Expiry &
Spoilage Predictor. Dibuat untuk Trunodjoyo Creative Competition (TCC) 2026,
cabang Vibe Code.

## Masalah yang diselesaikan

Koperasi dan UMKM pangan skala kecil-menengah sering merugi karena barang
yang cepat basi — sayur, buah, olahan susu, roti — baru diketahui mendekati
kadaluarsa setelah terlambat. Akibatnya barang itu terbuang begitu saja,
padahal kalau diketahui lebih awal, barang tersebut masih bisa diselamatkan
lewat diskon, distribusi ke mitra, atau dibundling dengan produk lain.
Masalahnya bukan kekurangan data (admin biasanya sudah tahu tanggal masuk
dan estimasi umur simpan tiap barang), melainkan tidak ada sistem yang
secara aktif menghitung risiko itu dan mengingatkan admin sebelum terlambat.

Stok Pangan Cerdas mengatasi ini dengan dua lapis: **deteksi risiko
rule-based** yang menghitung status setiap barang secara real-time, dan
**AI generatif** yang memberi saran tindakan konkret begitu ada barang yang
mulai berisiko.

## Alur penggunaan aplikasi

1. **Admin login** di `login.html` menggunakan email dan kata sandi yang
   sudah terdaftar. Sistem menerbitkan token (Sanctum) yang dipakai untuk
   semua permintaan berikutnya.
2. **Admin membuka Dashboard** (`index.html`) dan langsung melihat ringkasan
   stok: total barang, dan jumlah barang per status risiko (Aman/Berisiko/
   Kritis), masing-masing dengan kode warna hijau/kuning/merah. Admin bisa
   memfilter daftar barang per kategori atau status, atau mencari nama
   barang tertentu.
3. **Admin menambah, mengubah, atau menghapus barang** lewat form di
   Dashboard. Setiap kali barang ditambah/diubah, status risikonya langsung
   terhitung ulang otomatis — tidak perlu tombol "hitung ulang" terpisah.
4. **Untuk barang berstatus Berisiko atau Kritis**, admin bisa menekan
   tombol "Minta Saran AI". Sistem mengirim data barang itu ke Gemini API
   dan menampilkan rekomendasi tindakan (Diskon/Distribusi/Bundling, atau
   Pemusnahan khusus barang yang sudah lewat kadaluarsa) di AI Insight
   Panel, lengkap dengan alasannya dalam Bahasa Indonesia.
5. **Setelah tindakan itu benar-benar dijalankan di gudang**, admin
   menekan "Tandai Diterapkan" pada rekomendasi tersebut.
6. **Admin membuka halaman Riwayat** (`riwayat.html`) untuk melihat rekap:
   berapa banyak tindakan yang sudah diambil, berapa unit barang yang
   berhasil diselamatkan versus yang terpaksa dimusnahkan, dan daftar
   lengkap setiap tindakan beserta waktunya.
7. **Admin logout** kapan saja lewat tombol "Keluar" di header, yang
   mencabut token aktif di server.

## Arsitektur

- **Backend** — Laravel (PHP), REST API murni. Tidak merender HTML apa pun,
  hanya menyediakan endpoint JSON di bawah `/api`.
- **Frontend** — Vanilla JS + Tailwind CSS (lewat CDN), file statis terpisah
  yang memanggil backend lewat `fetch()`.
- **Database** — PostgreSQL.
- **Autentikasi** — Laravel Sanctum, mode *personal access token* (bukan SPA
  cookie/session), karena frontend dan backend adalah dua deployment terpisah
  yang beda origin (frontend di Vercel, backend di Railway).

### Teknologi & versi

| Komponen | Versi |
|---|---|
| PHP | 8.4.14 |
| Laravel Framework | 13.25.0 |
| Laravel Sanctum | 4.3.3 |
| PostgreSQL | 17.4 |
| Tailwind CSS | via CDN (`cdn.tailwindcss.com`, selalu versi terbaru) |
| Google Gemini API | lihat bagian [AI generatif](#ai-generatif) |

### Struktur folder

```
TCC 2026/
├── backend/                     Laravel — REST API murni
│   ├── app/
│   │   ├── Http/Controllers/    ItemController, RekomendasiController,
│   │   │                        RiwayatController, AuthController
│   │   ├── Http/Requests/       Validasi form (StoreItemRequest, dll.)
│   │   ├── Models/              Item, Rekomendasi, User
│   │   └── Services/            GeminiInsightService (pemanggil Gemini API)
│   ├── database/
│   │   ├── migrations/          Skema tabel: items, rekomendasi,
│   │   │                        personal_access_tokens, dll.
│   │   └── seeders/              ItemSeeder (13 barang contoh), DatabaseSeeder
│   │                             (akun admin demo)
│   └── routes/api.php           Semua endpoint /api
├── frontend/                    Vanilla JS + Tailwind, file statis
│   ├── index.html               Dashboard Stok
│   ├── riwayat.html             Riwayat & Statistik
│   ├── login.html               Halaman login admin
│   └── assets/
│       ├── js/                  api.js (klien HTTP + auth), dashboard.js,
│       │                        riwayat.js, login.js
│       └── img/                 Aset gambar (logo TCC 2026, dll.)
├── design-reference/             Referensi visual saja — lihat bagian
│                                 "Tentang folder design-reference/" di bawah
├── CLAUDE.md                    Spesifikasi & batasan teknis project
└── README.md                    Berkas ini
```

## Deteksi risiko rule-based

Status risiko setiap barang dihitung **murni dengan kalkulasi tanggal**,
tanpa machine learning atau AI dalam bentuk apa pun di bagian ini.

**Rumus:**

```
sisa_hari = tanggal_masuk + estimasi_umur_simpan_hari - hari_ini
```

**Ambang batas status:**

| Status | Syarat | Warna |
|---|---|---|
| Kritis | `sisa_hari <= 2` | Merah |
| Berisiko | `sisa_hari <= 5` (dan `> 2`) | Kuning |
| Aman | `sisa_hari > 5` | Hijau |

Perhitungan ini terjadi **on-the-fly** setiap kali data barang diminta
(lihat `Item::sisaHari()` dan `Item::status()` di
`backend/app/Models/Item.php`) — bukan nilai yang disimpan dan bisa basi di
database, dan bukan hasil training model apa pun. Kalau tanggal hari ini
berubah, status ikut berubah otomatis tanpa perlu proses tambahan.

## AI generatif

- **Provider:** Google Gemini API.
- **Model yang dikonfigurasi:** alias `gemini-flash-latest` (lihat
  `GEMINI_MODEL` di `.env` / `config/services.php`). Alias ini dipakai
  karena API key yang tersedia saat pengembangan tidak memiliki akses ke
  model versi tetap (mis. `gemini-2.5-flash`).
- **Model konkret yang benar-benar di-resolve** (dicek lewat field
  `modelVersion` pada respons `generateContent`, per 13 Agustus 2026):
  **`gemini-3.6-flash`**. Karena ini alias, Google bisa mengubah resolusinya
  kapan saja tanpa pemberitahuan — cek ulang sebelum presentasi final kalau
  butuh kepastian model yang sedang aktif.
- **Tujuan pemakaian:** AI generatif **hanya** dipakai di satu tempat — AI
  Insight Panel, untuk menghasilkan rekomendasi tindakan (bahasa Indonesia)
  atas barang yang berstatus Berisiko atau Kritis.
- **Kode:** `backend/app/Services/GeminiInsightService.php`.

### Bagian mana rule-based, bagian mana AI generatif

Ini poin yang wajib bisa dijelaskan saat presentasi (sesuai CLAUDE.md):

| Bagian | Cara kerja |
|---|---|
| Status risiko barang (Aman/Berisiko/Kritis) | **Rule-based**, murni kalkulasi tanggal: `tanggal_masuk + estimasi_umur_simpan_hari - hari_ini`. Lihat `Item::sisaHari()` dan `Item::status()` di `backend/app/Models/Item.php`. Tidak ada AI/ML yang terlibat sama sekali di bagian ini. |
| Rekomendasi tindakan (AI Insight Panel) | **AI generatif (Gemini)**. Backend mengirim data barang (nama, kategori, stok, sisa hari, status) ke Gemini API, dan Gemini mengembalikan JSON terstruktur berisi `jenis_saran` (Diskon/Distribusi/Bundling/Pemusnahan) dan `isi_saran` (kalimat rekomendasi). |
| Statistik & Riwayat | **Bukan AI** — murni agregasi data dari rekomendasi yang sudah ditandai "Diterapkan" oleh admin. |

### Prompt utama AI Insight Panel

Prompt lengkap ada di `GeminiInsightService::buildPrompt()`. Ringkasannya:

- AI diberi data barang lengkap (nama, kategori, stok, tanggal masuk,
  estimasi umur simpan, sisa hari, status risiko).
- **Kalau barang belum lewat kadaluarsa** (`sisa_hari >= 0`): AI diminta
  memilih satu dari tiga jenis saran — **Diskon**, **Distribusi**, atau
  **Bundling** — beserta alasan singkat.
- **Kalau barang sudah lewat kadaluarsa** (`sisa_hari < 0`): AI **hanya
  boleh** memberi saran **Pemusnahan**, tidak boleh menyarankan penjualan
  dalam bentuk apa pun. Pembatasan ini dipaksakan dua kali — lewat instruksi
  eksplisit di teks prompt, dan lewat `responseSchema` (Structured Output)
  yang membatasi `enum` jenis saran hanya berisi `"Pemusnahan"` saat kondisi
  ini terpenuhi. Ini alasan keamanan pangan: barang kadaluarsa tidak boleh
  dijual/didistribusikan dalam bentuk apa pun, jadi AI sengaja tidak diberi
  pilihan lain di kondisi ini — pembatasannya dipaksa di level struktur
  data, bukan cuma diharapkan lewat instruksi bahasa alami yang bisa saja
  diabaikan model.
- Respons diminta dalam format JSON terstruktur (`responseMimeType:
  application/json` + `responseSchema`) supaya hasilnya selalu bisa
  di-parse dengan aman, tanpa perlu regex/parsing teks bebas.

### Kenapa pakai Structured Output (`responseSchema`), bukan parsing teks bebas

Kalau AI dibiarkan menjawab dengan kalimat bebas, sistem harus menebak-nebak
lewat regex atau pencarian kata kunci untuk mengetahui jenis tindakan apa
yang disarankan — pendekatan yang rapuh dan gampang salah tafsir kalau
model menjawab dengan format yang sedikit berbeda dari biasanya. Dengan
`responseSchema`, kita memaksa Gemini mengembalikan JSON dengan struktur
dan `enum` yang sudah ditentukan di sisi kita (`jenis_saran` harus salah
satu dari nilai yang diizinkan, `isi_saran` harus string). Hasilnya:

- Backend bisa langsung `json_decode()` respons AI tanpa parsing tambahan.
- Frontend selalu tahu persis nilai `jenis_saran` yang mungkin muncul,
  sehingga badge warna dan logika UI bisa dibuat deterministik.
- Batasan bisnis (seperti larangan menjual barang kadaluarsa) bisa
  dipaksakan di level skema, bukan cuma diharapkan lewat instruksi bahasa
  alami di prompt.

## Perhitungan skalabilitas

- **Deteksi risiko tanpa job terjadwal.** Status Aman/Berisiko/Kritis
  dihitung on-the-fly setiap kali barang diminta (lihat bagian
  [Deteksi risiko rule-based](#deteksi-risiko-rule-based)), bukan lewat
  cron job atau background worker yang menghitung ulang seluruh stok secara
  berkala. Ini menghilangkan beban komputasi latar belakang sepenuhnya —
  semakin banyak barang tidak berarti semakin berat beban server saat idle,
  karena tidak ada proses yang jalan sampai memang ada permintaan.
- **Panggilan AI hanya terjadi atas permintaan eksplisit admin.** Gemini API
  tidak pernah dipanggil otomatis untuk semua barang berisiko sekaligus —
  admin harus menekan tombol "Minta Saran AI" untuk satu barang tertentu.
  Ini menjaga biaya panggilan API tetap terkendali dan proporsional dengan
  seberapa aktif admin memakai fitur ini, bukan tumbuh linear terhadap
  jumlah barang di gudang.
- **Snapshot data menjaga akurasi historis.** Statistik di halaman Riwayat
  (unit terselamatkan/terbuang) dihitung dari kolom
  `jumlah_stok_saat_dibuat` yang dicatat saat rekomendasi dibuat, bukan dari
  nilai stok barang yang bisa berubah kapan saja. Ini mencegah angka
  statistik "berubah sendiri" di masa lalu hanya karena admin mengedit stok
  barang di masa sekarang — riwayat tetap akurat walau data barangnya terus
  berubah, bahkan kalau barangnya sudah dihapus sekalipun (kolom `item_id`
  di tabel rekomendasi memakai `nullOnDelete`, bukan `cascadeOnDelete`).

Catatan mengenai skema data: satu barang boleh punya lebih dari satu
riwayat tindakan seiring waktu (misalnya sebagian stoknya didiskon lebih
dulu, sisanya baru dimusnahkan belakangan) — ini keputusan desain yang
disengaja, bukan bug, karena mencerminkan kondisi nyata di gudang.

## Menjalankan project (lokal)

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Isi kredensial database PostgreSQL di `.env` (`DB_DATABASE`, `DB_USERNAME`,
`DB_PASSWORD`), lalu isi `GEMINI_API_KEY` (lihat bagian [AI generatif](#ai-generatif)
di atas).

```bash
php artisan migrate:fresh --seed
```

**Penting:** pakai `migrate:fresh --seed`, bukan `db:seed` saja. `db:seed`
akan menjalankan `ItemSeeder` di atas data yang sudah ada dan menduplikasi
13 barang contoh setiap kali dijalankan ulang. `migrate:fresh --seed`
mengosongkan database dulu sebelum seeding, jadi datanya selalu bersih.

```bash
php artisan serve --port=8000
```

Backend berjalan di `http://127.0.0.1:8000`, endpoint API di
`http://127.0.0.1:8000/api`.

### Frontend

```bash
cd frontend
python -m http.server 5500
```

Buka `http://127.0.0.1:5500/login.html` di browser.

`assets/js/api.js` otomatis mengarah ke `http://127.0.0.1:8000/api` saat
diakses dari `localhost`/`127.0.0.1`. Untuk deployment produksi, ganti
placeholder `REPLACE_WITH_RAILWAY_URL` di file itu dengan URL backend Railway
yang sebenarnya.

## Kredensial admin demo

```
Email    : admin@koperasipangan.id
Password : admin123
```

Seluruh halaman dashboard (Dashboard & Riwayat) berada di balik login —
tidak ada endpoint API yang bisa diakses tanpa token, kecuali `/api/login`
itu sendiri.

## Daftar endpoint API

Semua endpoint diawali `/api`. Kecuali `POST /login`, semua endpoint di
bawah wajib header `Authorization: Bearer <token>` (login wall penuh).

**Auth**

| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/login` | Login admin, mengembalikan personal access token (Sanctum). Endpoint publik, tidak butuh token. |
| POST | `/logout` | Mencabut token yang sedang dipakai. |
| GET | `/me` | Data admin yang sedang login. |

**Items**

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/items` | Daftar barang. Mendukung filter `?kategori=` dan `?status=`. |
| POST | `/items` | Tambah barang baru. |
| GET | `/items/{item}` | Detail satu barang. |
| PUT/PATCH | `/items/{item}` | Ubah data barang. |
| DELETE | `/items/{item}` | Hapus barang. |

**Rekomendasi (AI Insight)**

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/rekomendasi` | Daftar seluruh rekomendasi AI. |
| POST | `/items/{item}/rekomendasi` | Minta Gemini membuatkan rekomendasi baru untuk barang tersebut. Ditolak (422) kalau status barang Aman. |
| PATCH | `/rekomendasi/{rekomendasi}/terapkan` | Tandai satu rekomendasi sebagai sudah diterapkan. |

**Riwayat**

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/riwayat` | Daftar rekomendasi yang sudah diterapkan (jadi riwayat tindakan), diurutkan terbaru. |
| GET | `/riwayat/statistik` | Ringkasan angka: jumlah tindakan, unit terselamatkan/terbuang, rincian per jenis tindakan. |

## Struktur fitur per fase

- **Fase 1** — Dashboard stok, ringkasan, kode warna risiko, filter.
- **Fase 2** — CRUD barang, AI Insight Panel.
- **Fase 3** — Riwayat & statistik barang terselamatkan, autentikasi admin
  (Sanctum token-based).

## Tentang folder `design-reference/`

Folder ini berisi berkas ekspor dari Claude Design (`.dc.html` + JS
pendukung) yang dipakai sebagai **referensi visual saja** — palet warna,
tipografi, layout — saat membangun frontend. Isinya **bukan bagian dari
aplikasi yang berjalan**: tidak di-serve, tidak di-deploy, dan tidak
dipanggil oleh kode Vanilla JS/Tailwind di `frontend/`. Semua tampilan
aplikasi sesungguhnya dibangun dari nol mengikuti arsitektur di
`CLAUDE.md`, cuma terinspirasi gaya visualnya dari folder ini.

## Catatan keamanan

- `GEMINI_API_KEY` disimpan di `backend/.env` (masuk `.gitignore`, tidak
  pernah dikirim ke frontend). Semua panggilan ke Gemini API lewat backend
  sebagai proxy.
- Sebelum repo di-*publish* ke GitHub dan sebelum deploy ke Railway,
  `GEMINI_API_KEY` yang dipakai selama development **harus dirotasi ulang**
  dan diganti key baru khusus produksi.
