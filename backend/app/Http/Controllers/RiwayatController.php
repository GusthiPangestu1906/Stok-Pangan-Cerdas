<?php

namespace App\Http\Controllers;

use App\Models\Rekomendasi;

class RiwayatController extends Controller
{
    private const JENIS_TERSELAMATKAN = ['Diskon', 'Distribusi', 'Bundling'];

    private const JENIS_TERBUANG = ['Dibuang', 'Pemusnahan'];

    /**
     * Daftar riwayat tindakan — rekomendasi AI yang sudah ditandai diterapkan.
     */
    public function index()
    {
        $riwayat = Rekomendasi::query()
            ->with('item')
            ->where('diterapkan', true)
            ->orderByDesc('diterapkan_at')
            ->get();

        return response()->json([
            'data' => $riwayat,
        ]);
    }

    /**
     * Statistik barang terselamatkan vs terbuang, dihitung dari riwayat tindakan.
     */
    public function statistik()
    {
        $diterapkan = Rekomendasi::query()
            ->where('diterapkan', true)
            ->get();

        $terselamatkan = $diterapkan->whereIn('jenis_saran', self::JENIS_TERSELAMATKAN);
        $terbuang = $diterapkan->whereIn('jenis_saran', self::JENIS_TERBUANG);

        $perJenis = $diterapkan->groupBy(function ($r) {
            return $r->jenis_saran === 'Pemusnahan' ? 'Dibuang' : $r->jenis_saran;
        })->map->count();

        return response()->json([
            'data' => [
                'jumlah_tindakan' => $diterapkan->count(),
                'jumlah_terselamatkan' => $terselamatkan->count(),
                'jumlah_terbuang' => $terbuang->count(),
                'unit_terselamatkan' => $terselamatkan->sum('jumlah_stok_saat_dibuat'),
                'unit_terbuang' => $terbuang->sum('jumlah_stok_saat_dibuat'),
                'per_jenis' => $perJenis,
            ],
        ]);
    }
}
