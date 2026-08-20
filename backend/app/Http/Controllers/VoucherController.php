<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\Rekomendasi;
use App\Models\Voucher;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class VoucherController extends Controller
{
    /**
     * Daftar voucher. Mendukung filter ?status=aktif.
     */
    public function index(Request $request)
    {
        $vouchers = Voucher::query()
            ->with(['item', 'rekomendasi'])
            ->when($request->query('status'), fn ($query, $status) => $query->where('status', $status))
            ->latest()
            ->get();

        return response()->json([
            'data' => $vouchers,
        ]);
    }

    /**
     * Terbitkan voucher baru. Kode digenerate di backend, tidak pernah
     * dipercaya dari input frontend. Setiap kupon sekali pakai (kuota=1);
     * parameter "jumlah" mengontrol berapa lembar/kode berbeda dibuat
     * sekaligus, supaya N salinan cetak = N kode unik, bukan 1 kode
     * digandakan tampilannya.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'item_id' => ['nullable', 'exists:items,id'],
            'rekomendasi_id' => ['nullable', 'exists:rekomendasi,id'],
            'judul' => ['required', 'string', 'max:255'],
            'target' => ['nullable', 'string', 'max:255'],
            'tipe' => ['required', 'in:persen,nominal'],
            'nilai' => ['required', 'integer', 'min:1'],
            'harga_normal' => ['nullable', 'integer', 'min:0'],
            'min_belanja' => ['nullable', 'integer', 'min:0'],
            'jumlah' => ['nullable', 'integer', 'min:1', 'max:50'],
            'berlaku_sampai' => ['required', 'date'],
        ]);

        $item = $validated['item_id'] ? Item::find($validated['item_id']) : null;
        $jumlah = $validated['jumlah'] ?? 1;

        $vouchers = DB::transaction(function () use ($validated, $item, $jumlah) {
            $kodeTerpakaiDiBatch = [];
            $hasil = [];

            for ($i = 0; $i < $jumlah; $i++) {
                $kode = $this->generateKodeUnik($item?->nama ?? 'SPC', $kodeTerpakaiDiBatch);
                $kodeTerpakaiDiBatch[] = $kode;

                $hasil[] = Voucher::create([
                    'kode' => $kode,
                    'item_id' => $item?->id,
                    'rekomendasi_id' => $validated['rekomendasi_id'] ?? null,
                    'nama_item' => $item?->nama,
                    'kategori_item' => $item?->kategori,
                    'judul' => $validated['judul'],
                    'target' => $validated['target'] ?? null,
                    'diskon_persen' => $validated['tipe'] === 'persen' ? $validated['nilai'] : null,
                    'diskon_nominal' => $validated['tipe'] === 'nominal' ? $validated['nilai'] : null,
                    'harga_normal' => $validated['harga_normal'] ?? null,
                    'min_belanja' => $validated['min_belanja'] ?? 0,
                    'kuota' => 1,
                    'terpakai' => 0,
                    'berlaku_sampai' => $validated['berlaku_sampai'],
                    'status' => 'aktif',
                ]);
            }

            return $hasil;
        });

        $loaded = collect($vouchers)->each->load(['item', 'rekomendasi']);

        return response()->json([
            'data' => $loaded,
        ], 201);
    }

    /**
     * Periksa validitas kode voucher secara berurutan: ada, aktif, belum
     * kadaluarsa, kuota tersisa. Tidak menaikkan pemakaian — itu tugas
     * endpoint klaim.
     */
    public function validasi(Request $request)
    {
        $validated = $request->validate([
            'kode' => ['required', 'string'],
        ]);

        $kode = strtoupper(trim($validated['kode']));
        $voucher = Voucher::where('kode', $kode)->first();

        if (! $voucher) {
            return response()->json([
                'message' => "Kode voucher \"{$kode}\" tidak ditemukan.",
            ], 404);
        }

        if ($voucher->status !== 'aktif') {
            return response()->json([
                'message' => "Voucher ini berstatus \"{$voucher->status}\", tidak bisa dipakai.",
            ], 422);
        }

        if ($voucher->sudah_kadaluarsa) {
            return response()->json([
                'message' => 'Voucher ini sudah lewat masa berlaku.',
            ], 422);
        }

        if ($voucher->sisa_kuota <= 0) {
            return response()->json([
                'message' => 'Kuota voucher ini sudah habis.',
            ], 422);
        }

        return response()->json([
            'data' => $voucher->load(['item', 'rekomendasi']),
        ]);
    }

    /**
     * Klaim voucher: naikkan pemakaian setelah memeriksa ulang SEMUA syarat
     * di backend (jangan percaya validasi yang sudah dilakukan frontend).
     * Klaim yang berhasil dicatat ke Riwayat sebagai tindakan "Diskon" yang
     * sudah diterapkan, supaya statistik penyelamatan ikut bergerak.
     */
    public function klaim(Voucher $voucher)
    {
        if ($voucher->status !== 'aktif') {
            return response()->json([
                'message' => "Voucher ini berstatus \"{$voucher->status}\", tidak bisa diklaim.",
            ], 422);
        }

        if ($voucher->sudah_kadaluarsa) {
            return response()->json([
                'message' => 'Voucher ini sudah lewat masa berlaku.',
            ], 422);
        }

        if ($voucher->sisa_kuota <= 0) {
            return response()->json([
                'message' => 'Kuota voucher ini sudah habis.',
            ], 422);
        }

        $voucher->terpakai += 1;
        if ($voucher->terpakai >= $voucher->kuota) {
            $voucher->status = 'habis';
        }
        $voucher->save();

        $namaBarang = $voucher->item?->nama ?? $voucher->nama_item ?? $voucher->target ?? $voucher->judul;

        Rekomendasi::create([
            'item_id' => $voucher->item_id,
            // Voucher kategori (item_id null) tidak punya nama_item snapshot,
            // jadi pakai target/judul kupon supaya Riwayat tidak jatuh ke
            // fallback "(barang dihapus)" milik getNamaBarangAttribute().
            'nama_item' => $voucher->nama_item ?? $voucher->item?->nama ?? $voucher->target ?? $voucher->judul,
            'kategori_item' => $voucher->kategori_item ?? $voucher->item?->kategori,
            'jenis_saran' => 'Diskon',
            'isi_saran' => "Voucher \"{$voucher->kode}\" ({$voucher->judul}) diklaim di kasir untuk {$namaBarang}.",
            'status_item_saat_dibuat' => $voucher->item?->status ?? 'berisiko',
            // Sengaja 0, BUKAN bug: sistem kasir hanya memvalidasi kode,
            // tidak mencatat kuantitas transaksi. jumlah_stok item adalah
            // sisa stok gudang, bukan jumlah yang dibeli, jadi tidak valid
            // dipakai sebagai unit terselamatkan. Klaim tetap tercatat
            // sebagai tindakan (jumlah_tindakan, per_jenis) tapi sengaja
            // tidak menyumbang ke unit_terselamatkan.
            'jumlah_stok_saat_dibuat' => 0,
            'diterapkan' => true,
            'diterapkan_at' => now(),
        ]);

        return response()->json([
            'data' => $voucher->load(['item', 'rekomendasi']),
        ]);
    }

    /**
     * $kodeTerpakaiDiBatch menampung kode yang baru saja dibuat dalam
     * batch store() yang sama tapi belum ter-commit ke DB, supaya cetak
     * N kupon sekaligus tidak menghasilkan kode kembar antar sesama
     * kupon baru (bukan cuma dicek terhadap yang sudah ada di database).
     */
    private function generateKodeUnik(string $namaSumber, array $kodeTerpakaiDiBatch = []): string
    {
        $prefix = Str::upper(Str::limit(preg_replace('/[^a-zA-Z]/', '', $namaSumber), 3, '')) ?: 'SPC';
        $prefix = str_pad($prefix, 3, 'X');

        do {
            $angka = str_pad((string) random_int(0, 99999), 5, '0', STR_PAD_LEFT);
            $kode = "VCHR-{$prefix}-{$angka}";
        } while (in_array($kode, $kodeTerpakaiDiBatch, true) || Voucher::where('kode', $kode)->exists());

        return $kode;
    }
}
