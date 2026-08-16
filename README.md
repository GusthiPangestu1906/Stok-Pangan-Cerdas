# Stok Pangan Cerdas

Sistem manajemen stok pangan untuk koperasi/UMKM dengan fitur AI Expiry &
Spoilage Predictor. Dibuat untuk Trunodjoyo Creative Competition (TCC) 2026,
cabang Vibe Code.

## Coba langsung

| | |
|---|---|
| **Aplikasi (frontend)** | https://stok-pangan-cerdas.vercel.app |
| **API (backend)** | https://stok-pangan-cerdas-production.up.railway.app/api |
| **Repositori** | https://github.com/HammamFais/Stok-Pangan-Cerdas |

**Akun admin demo:**

```
Email    : admin@koperasipangan.id
Password : admin123
```

Seluruh halaman berada di balik login — tidak ada endpoint API yang bisa
diakses tanpa token, kecuali `/api/login` itu sendiri.

> **Catatan tentang fitur AI:** rekomendasi AI memakai Gemini API tingkat
> gratis, dengan kuota gabungan sekitar 80 permintaan per hari (lihat
> [Rantai fallback model](#rantai-fallback-model--ketahanan-terhadap-keterbatasan-kuota)).
> Kalau muncul pesan *"Kuota harian layanan AI sudah habis"*, itu perilaku
> yang memang dirancang — bukan kerusakan — dan kuotanya pulih keesokan
> harinya. Fitur lain (CRUD, filter, riwayat, statistik) tetap berjalan
> normal tanpa bergantung pada kuota tersebut.

## Identitas peserta

| | |
|---|---|
| **Kompetisi** | Trunodjoyo Creative Competition (TCC) 2026 |
| **Cabang lomba** | Vibe Code |
| **Sub tema** | Web Application Development |
| **Kategori** | Tim |
| **Ketua tim** | Gusthi Pangestu (3124600098) |
| **Anggota** | Hammam Hidayatullah (3124600096) |
| **Asal instansi** | Politeknik Elektronika Negeri Surabaya (PENS) |
| **Judul karya** | Stok Pangan Cerdas |

## Daftar isi

- [Coba langsung](#coba-langsung)
- [Identitas peserta](#identitas-peserta)
- [Masalah yang diselesaikan](#masalah-yang-diselesaikan)
- [Alur penggunaan aplikasi](#alur-penggunaan-aplikasi)
- [Arsitektur](#arsitektur)
  - [Teknologi & versi](#teknologi--versi)
  - [Struktur folder](#struktur-folder)
- [Deteksi risiko rule-based](#deteksi-risiko-rule-based)
- [AI generatif](#ai-generatif)
  - [Rantai fallback model & ketahanan terhadap keterbatasan kuota](#rantai-fallback-model--ketahanan-terhadap-keterbatasan-kuota)
  - [Bagian mana rule-based, bagian mana AI generatif](#bagian-mana-rule-based-bagian-mana-ai-generatif)
  - [Prompt utama AI Insight Panel](#prompt-utama-ai-insight-panel)
  - [Kenapa pakai Structured Output](#kenapa-pakai-structured-output-responseschema-bukan-parsing-teks-bebas)
- [Perhitungan skalabilitas](#perhitungan-skalabilitas)
- [Menjalankan project (lokal)](#menjalankan-project-lokal)
- [Kredensial admin demo](#kredensial-admin-demo)
- [Daftar endpoint API](#daftar-endpoint-api)
- [Struktur fitur per fase](#struktur-fitur-per-fase)
- [Batasan yang diketahui](#batasan-yang-diketahui)
- [Tentang folder `design-reference/`](#tentang-folder-design-reference)
- [Catatan keamanan](#catatan-keamanan)

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
- **Model utama yang dikonfigurasi:** alias `gemini-flash-latest` (lihat
  `GEMINI_MODEL` di `.env` / `config/services.php`). Alias ini dipakai
  karena API key yang tersedia saat pengembangan tidak memiliki akses ke
  model versi tetap (mis. `gemini-2.5-flash`).
- **Model konkret yang benar-benar di-resolve** (dicek lewat field
  `modelVersion` pada respons `generateContent`, per 14 Agustus 2026):
  **`gemini-3.7-flash`**. Model ini sudah berubah dua kali selama
  pengembangan (dari `gemini-3.6-flash` beberapa hari sebelumnya) — bukti
  nyata bahwa alias ini memang bergerak. Karena ini alias, Google bisa
  mengubah resolusinya kapan saja tanpa pemberitahuan — cek ulang sebelum
  presentasi final kalau butuh kepastian model yang sedang aktif.
- **Rantai model cadangan:** `GEMINI_MODEL_FALLBACKS` di `.env` /
  `config/services.php`, daftar model dipisah koma yang dicoba
  **berurutan** hanya saat model sebelumnya kena HTTP 429 (kuota habis).
  Urutan default: `gemini-3.6-flash` → `gemini-3.5-flash` →
  `gemini-3.5-flash-lite`. Lihat bagian
  [Rantai fallback model & ketahanan terhadap keterbatasan kuota](#rantai-fallback-model--ketahanan-terhadap-keterbatasan-kuota)
  di bawah untuk alasan urutan ini dan cara kerjanya.
- **Tujuan pemakaian:** AI generatif **hanya** dipakai di satu tempat — AI
  Insight Panel, untuk menghasilkan rekomendasi tindakan (bahasa Indonesia)
  atas barang yang berstatus Berisiko atau Kritis.
- **Kode:** `backend/app/Services/GeminiInsightService.php`.
- **Batasan kuota (free tier):** akun Gemini yang dipakai selama
  pengembangan berada di tingkat gratis, dengan batas **20 permintaan
  `generateContent` per hari per model konkret**. Karena setiap model
  dalam rantai (model utama + 3 cadangan) adalah model konkret yang
  berbeda, total kuota gabungan yang tersedia untuk fitur AI Insight
  adalah **sekitar 80 permintaan per hari**, bukan 20. Kuota ini dibagi
  bersama oleh semua orang yang memakai key yang sama — admin yang login,
  siapa pun yang mencoba aplikasi, dan juri saat menilai, semuanya menarik
  dari kuota harian yang sama. Kuota harian pulih otomatis keesokan
  harinya (waktu Pasifik, sesuai zona waktu Google), bukan setelah jeda
  beberapa menit. Untuk deployment produksi jangka panjang, ini perlu
  di-upgrade ke tingkat berbayar Gemini API atau diberi kuota yang lebih
  besar.

### Rantai fallback model & ketahanan terhadap keterbatasan kuota

Karena kuota free tier Gemini terpisah per model, `GeminiInsightService`
mencoba **rantai model secara berurutan** supaya satu model kehabisan
kuota tidak langsung mematikan fitur AI Insight:

1. **Permintaan pertama** selalu ke model utama (`GEMINI_MODEL`,
   `gemini-flash-latest`).
2. **Kalau model itu membalas 429** (kuota habis), aplikasi **langsung**
   (tanpa jeda tambahan, karena 429 memang tidak di-retry — lihat tabel
   di bawah) mencoba model berikutnya dalam `GEMINI_MODEL_FALLBACKS`.
3. **Proses ini berulang** sampai salah satu model berhasil, atau seluruh
   rantai habis dicoba.
4. **Kalau semua model dalam rantai membalas 429**, barulah aplikasi
   menyerah dan menampilkan pesan kuota habis ke user.

**Kenapa urutan rantainya seperti ini** (`gemini-3.6-flash` →
`gemini-3.5-flash` → `gemini-3.5-flash-lite`): diuji langsung dengan
prompt yang sama persis untuk barang Tomat Segar (8 unit, sisa 1 hari).
`gemini-3.6-flash` dan `gemini-3.5-flash` sama-sama menghasilkan
rekomendasi yang spesifik dan memakai data barang (menyebut "8 unit
Tomat Segar", tanggal kadaluarsa). `gemini-3.5-flash-lite` menghasilkan
rekomendasi yang lebih generik (cuma menyebut "tomat" tanpa jumlah unit,
dan sesekali agak rancu antara `jenis_saran` dan isi sarannya) — tetap
masuk akal dan berbahasa Indonesia yang benar, tapi kualitasnya di bawah
dua model sebelumnya. Karena itu model dengan kualitas terbaik selalu
dicoba lebih dulu, dan model paling sederhana jadi upaya terakhir sebelum
benar-benar menampilkan pesan kuota habis — lebih baik rekomendasi yang
agak generik daripada tidak ada rekomendasi sama sekali.

**Kenapa `gemini-flash-lite-latest` dan `gemini-3.1-flash-lite` sengaja
TIDAK dimasukkan ke rantai:** `gemini-flash-lite-latest` ternyata adalah
**alias yang resolve ke model konkret yang sama** dengan
`gemini-3.5-flash-lite` yang sudah ada di rantai — karena kuota dihitung
per model konkret (bukan per nama/alias yang dipakai memanggilnya),
memasukkan keduanya tidak menambah kuota sama sekali, cuma alias ganda
untuk kuota yang sama. `gemini-3.1-flash-lite` adalah generasi lebih lama
yang kualitas outputnya diperkirakan di bawah `gemini-3.5-flash-lite`,
jadi tidak menambah nilai sebagai upaya terakhir dalam rantai.

Strategi retry dan fallback ini sengaja dipisah berdasarkan jenis
kegagalan, karena masing-masing butuh respons yang berbeda:

| Status | Perlakuan | Alasan |
|---|---|---|
| 500, 503, kegagalan koneksi | Retry ke **model yang sama**, maksimal 3 percobaan, jeda 1 detik lalu 2 detik | Biasanya gangguan sementara di sisi Google yang pulih sendiri dalam hitungan detik |
| 429 (kuota habis) | **Tidak** di-retry di model yang sama; langsung dicoba ke **model berikutnya dalam rantai** | Kalau yang habis adalah kuota harian, menunggu beberapa detik tidak menolong — kuota baru pulih besok. Tapi model lain punya kuota terpisah, jadi ada peluang nyata untuk berhasil |
| 400, 401, 403, 404 | Gagal cepat, tidak ada retry maupun fallback | Masalah permintaan atau kredensial yang tidak akan berubah walau modelnya diganti |

Rantai model dibersihkan dari duplikat sebelum dicoba (`array_unique`) —
kalau model utama juga tercantum di `GEMINI_MODEL_FALLBACKS`, atau ada
nama model yang berulang di daftar cadangan, model itu hanya dicoba
sekali. Nilai kosong akibat koma berlebih di `.env` juga dilewati.

Setiap kali rantai berpindah model, tercatat `Log::warning()` dengan
`item_id`, model yang gagal, dan model berikutnya yang dicoba — supaya
bisa dipantau seberapa sering tiap model kehabisan kuota di pemakaian
nyata.

**Perkiraan waktu tunggu terburuk:** kalau seluruh rantai (4 model) kena
429 secara berurutan, itu tidak menambah waktu berarti karena 429 tidak
pernah di-retry — murni 4 kali panggilan cepat. Kasus yang benar-benar
paling lambat adalah kombinasi: beberapa model di awal rantai kena 429
(cepat), lalu satu model mengalami gangguan 503 dan menghabiskan seluruh
jatah retry-nya (3 percobaan × timeout 12 detik + jeda 1s+2s = maksimal
~39 detik) sebelum akhirnya berhasil atau gagal total di model itu.
Skenario ekstrem teoretis (3 model kena 429 dengan request lambat,
ditambah 1 model kena 503 penuh) bisa mendekati ~75 detik, meski ini
sangat tidak mungkin terjadi dalam praktik karena 429 biasanya dibalas
instan oleh Google, bukan mendekati batas timeout.

Ini bagian dari jawaban untuk pertanyaan skalabilitas/ketahanan: aplikasi
tidak bergantung pada satu titik kegagalan Gemini API, atau bahkan satu
model. Gangguan sementara ditangani lewat retry ke model yang sama, dan
keterbatasan kuota free tier ditangani lewat rantai fallback ke model
lain dengan kuota terpisah — dua mekanisme berbeda untuk dua jenis
masalah yang berbeda pula.

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
- **Retry otomatis untuk gangguan sementara, dan rantai fallback model
  untuk keterbatasan kuota — dua mekanisme berbeda untuk dua jenis
  kegagalan.** Panggilan ke Gemini API memakai `Http::retry()` —
  mengulang otomatis (maksimal 3 kali percobaan, jeda 1 detik lalu 2
  detik) ke model yang sama khusus untuk status 500/503 dan kegagalan
  koneksi, karena kegagalan semacam itu biasanya sementara. Status 429
  (kuota habis) sengaja **tidak** diulang di model yang sama — kuota
  harian baru pulih besok, bukan dalam hitungan detik — tapi karena kuota
  free tier Gemini ternyata terpisah per model, aplikasi langsung mencoba
  model berikutnya dalam rantai (total 4 model, ~80 permintaan/hari
  gabungan) yang kuotanya belum tentu ikut habis. Detail lengkap strategi
  ini ada di bagian
  [Rantai fallback model & ketahanan terhadap keterbatasan kuota](#rantai-fallback-model--ketahanan-terhadap-keterbatasan-kuota).

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

## Batasan yang diketahui

Batasan berikut disebutkan secara terbuka karena semuanya adalah
konsekuensi sadar dari keputusan teknis yang diambil, bukan hal yang
terlewat.

- **Kuota AI terbatas (±80 permintaan/hari).** Gemini API tingkat gratis
  membatasi 20 permintaan per hari per model. Aplikasi menyiasatinya dengan
  rantai empat model sehingga total menjadi sekitar 80, tapi tetap ada
  batasnya. Untuk pemakaian produksi sesungguhnya, ini perlu di-upgrade ke
  tingkat berbayar. Fitur non-AI tidak terpengaruh sama sekali.
- **Deployment memakai tingkat gratis.** Backend (Railway) dan database
  PostgreSQL berjalan di paket percobaan dengan batas kredit dan waktu
  aktif. Aplikasi bisa berhenti melayani permintaan kalau kredit habis.
- **Belum ada pengujian otomatis.** Seluruh verifikasi dilakukan manual —
  lewat pengujian langsung di browser dan pemanggilan endpoint API
  satu per satu, termasuk simulasi kegagalan Gemini memakai `Http::fake()`
  untuk membuktikan perilaku retry dan fallback. Menambahkan *feature test*
  Laravel adalah langkah lanjutan yang wajar untuk project ini.
- **Satu peran pengguna saja.** Aplikasi dirancang untuk satu admin
  koperasi. Belum ada pembedaan hak akses (misalnya admin vs staf gudang),
  kategori.
- **Estimasi umur simpan diisi manual.** Angka umur simpan tiap barang
  dimasukkan admin, bukan diprediksi sistem. Ini keputusan yang disengaja:
  batasan lomba melarang penggunaan machine learning custom, dan admin
  koperasi umumnya sudah mengetahui angka ini dari pemasok.

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
