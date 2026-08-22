<?php

namespace App\Http\Controllers;

use App\Models\Item;

class RingkasanPublikController extends Controller
{
    private const URUTAN_STATUS = ['kritis', 'berisiko', 'aman'];

    /**
     * Ringkasan gudang untuk halaman login (publik, tanpa autentikasi).
     * Permukaan data sengaja diminimalkan -- hanya total barang dan tiga
     * sorotan (satu per status) tanpa id, harga, atau field internal lain.
     */
    public function index()
    {
        $items = Item::all();

        if ($items->isEmpty()) {
            return response()->json([
                'data' => [
                    'total_barang' => 0,
                    'sorotan' => [],
                ],
            ]);
        }

        // Per status, urutkan dari sisa_hari paling kecil (paling mendesak)
        // ke paling besar -- baik untuk dipilih sebagai wakil status itu,
        // maupun sebagai cadangan pengisi slot status lain yang kosong.
        $terurutPerStatus = collect(self::URUTAN_STATUS)->mapWithKeys(function ($status) use ($items) {
            $terurut = $items->filter(fn ($item) => $item->status === $status)
                ->sortBy('sisa_hari')
                ->values();

            return [$status => $terurut];
        });

        $sorotan = collect();
        $terpakaiId = [];

        foreach (self::URUTAN_STATUS as $status) {
            $kandidat = $terurutPerStatus[$status]->first(fn ($item) => ! in_array($item->id, $terpakaiId, true));

            if ($kandidat) {
                $sorotan->push($kandidat);
                $terpakaiId[] = $kandidat->id;
            }
        }

        // Status yang kosong: isi slot dari sisa barang manapun (di luar
        // yang sudah terpakai), diurutkan paling mendesak dulu, supaya
        // tetap tiga baris selama total barang di database >= 3.
        if ($sorotan->count() < 3) {
            $cadangan = $items->filter(fn ($item) => ! in_array($item->id, $terpakaiId, true))
                ->sortBy('sisa_hari')
                ->values();

            foreach ($cadangan as $item) {
                if ($sorotan->count() >= 3) {
                    break;
                }
                $sorotan->push($item);
                $terpakaiId[] = $item->id;
            }
        }

        return response()->json([
            'data' => [
                'total_barang' => $items->count(),
                'sorotan' => $sorotan->map(fn ($item) => [
                    'nama' => $item->nama,
                    'kategori' => $item->kategori,
                    'jumlah_stok' => $item->jumlah_stok,
                    'sisa_hari' => $item->sisa_hari,
                    'status' => $item->status,
                ])->values(),
            ],
        ]);
    }
}
