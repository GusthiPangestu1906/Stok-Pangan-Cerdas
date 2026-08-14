<?php

namespace Database\Seeders;

use App\Models\Item;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class ItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $items = [
            // Aman (sisa hari > 5)
            ['nama' => 'Beras Premium 5kg', 'kategori' => 'Sembako', 'masuk' => 5, 'umur' => 90, 'stok' => 40],
            ['nama' => 'Minyak Goreng 1L', 'kategori' => 'Sembako', 'masuk' => 3, 'umur' => 180, 'stok' => 60],
            ['nama' => 'Telur Ayam 1kg', 'kategori' => 'Protein', 'masuk' => 1, 'umur' => 14, 'stok' => 25],
            ['nama' => 'Apel Fuji', 'kategori' => 'Buah', 'masuk' => 1, 'umur' => 10, 'stok' => 30],

            // Berisiko (sisa hari <= 5, > 2)
            ['nama' => 'Susu UHT 1L', 'kategori' => 'Olahan Susu', 'masuk' => 6, 'umur' => 10, 'stok' => 18],
            ['nama' => 'Roti Tawar', 'kategori' => 'Roti', 'masuk' => 2, 'umur' => 6, 'stok' => 15],
            ['nama' => 'Bayam Segar', 'kategori' => 'Sayur', 'masuk' => 1, 'umur' => 4, 'stok' => 12],
            ['nama' => 'Yogurt Cup', 'kategori' => 'Olahan Susu', 'masuk' => 4, 'umur' => 8, 'stok' => 20],

            // Kritis (sisa hari <= 2)
            ['nama' => 'Tomat Segar', 'kategori' => 'Sayur', 'masuk' => 3, 'umur' => 4, 'stok' => 8],
            ['nama' => 'Keju Slice', 'kategori' => 'Olahan Susu', 'masuk' => 5, 'umur' => 6, 'stok' => 10],
            ['nama' => 'Roti Sobek Coklat', 'kategori' => 'Roti', 'masuk' => 3, 'umur' => 4, 'stok' => 7],
            ['nama' => 'Pisang Cavendish', 'kategori' => 'Buah', 'masuk' => 4, 'umur' => 5, 'stok' => 22],

            // Sudah lewat estimasi (sisa hari negatif, tetap "kritis")
            ['nama' => 'Selada Segar', 'kategori' => 'Sayur', 'masuk' => 6, 'umur' => 5, 'stok' => 5],
        ];

        foreach ($items as $item) {
            Item::create([
                'nama' => $item['nama'],
                'kategori' => $item['kategori'],
                'tanggal_masuk' => Carbon::today()->subDays($item['masuk']),
                'estimasi_umur_simpan_hari' => $item['umur'],
                'jumlah_stok' => $item['stok'],
            ]);
        }
    }
}
