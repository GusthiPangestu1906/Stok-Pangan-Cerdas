<?php

namespace Database\Seeders;

use App\Models\Item;
use App\Models\Rekomendasi;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class RekomendasiDemoSeeder extends Seeder
{
    /**
     * Isi dua rekomendasi demo yang sudah diterapkan, untuk kondisi
     * halaman Riwayat & Statistik yang bersih dan siap demo.
     *
     * Teks isi_saran di bawah ini SENGAJA ditulis tetap (bukan memanggil
     * Gemini API) supaya seeding bisa jalan tanpa koneksi internet/API key,
     * dan data demo selalu konsisten setiap kali di-reset. Isinya diambil
     * apa adanya dari rekomendasi yang pernah benar-benar dihasilkan Gemini
     * selama pengembangan.
     */
    public function run(): void
    {
        $kejuSlice = Item::where('nama', 'Keju Slice')->first();
        $seladaSegar = Item::where('nama', 'Selada Segar')->first();

        if (! $kejuSlice || ! $seladaSegar) {
            $this->command?->warn('RekomendasiDemoSeeder dilewati: barang "Keju Slice" atau "Selada Segar" tidak ditemukan. Jalankan ItemSeeder terlebih dahulu.');

            return;
        }

        Rekomendasi::create([
            'item_id' => $kejuSlice->id,
            'jenis_saran' => 'Diskon',
            'isi_saran' => 'Berikan diskon 50% sampai 70% untuk 10 unit Keju Slice karena sisa masa simpan tinggal 1 hari agar segera habis terjual.',
            'status_item_saat_dibuat' => 'kritis',
            'jumlah_stok_saat_dibuat' => 10,
            'diterapkan' => true,
            'diterapkan_at' => Carbon::now()->subHours(4),
        ]);

        Rekomendasi::create([
            'item_id' => $seladaSegar->id,
            'jenis_saran' => 'Dibuang',
            'isi_saran' => 'Segera lakukan pembuangan 5 unit Selada Segar yang telah melewati masa kadaluarsa selama 1 hari demi menjaga keselamatan konsumen dan kebersihan gudang.',
            'status_item_saat_dibuat' => 'kritis',
            'jumlah_stok_saat_dibuat' => 5,
            'diterapkan' => true,
            'diterapkan_at' => Carbon::now()->subHours(1),
        ]);
    }
}
