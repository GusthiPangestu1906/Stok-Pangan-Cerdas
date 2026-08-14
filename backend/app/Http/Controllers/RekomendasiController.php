<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\Rekomendasi;
use App\Services\GeminiInsightService;
use Illuminate\Http\Request;
use RuntimeException;

class RekomendasiController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $rekomendasi = Rekomendasi::query()
            ->with('item')
            ->when($request->has('diterapkan'), fn ($query) => $query->where('diterapkan', $request->boolean('diterapkan')))
            ->latest()
            ->get();

        return response()->json([
            'data' => $rekomendasi,
        ]);
    }

    /**
     * Generate a new AI recommendation for the given item.
     */
    public function store(Item $item, GeminiInsightService $gemini)
    {
        if ($item->status === 'aman') {
            return response()->json([
                'message' => 'Barang berstatus Aman tidak memerlukan rekomendasi AI.',
            ], 422);
        }

        try {
            $hasil = $gemini->buatRekomendasi($item);
        } catch (RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 502);
        }

        $rekomendasi = Rekomendasi::create([
            'item_id' => $item->id,
            'jenis_saran' => $hasil['jenis_saran'],
            'isi_saran' => $hasil['isi_saran'],
            'status_item_saat_dibuat' => $item->status,
            'jumlah_stok_saat_dibuat' => $item->jumlah_stok,
        ]);

        return response()->json([
            'data' => $rekomendasi->load('item'),
        ], 201);
    }

    /**
     * Mark the given recommendation as applied.
     */
    public function terapkan(Rekomendasi $rekomendasi)
    {
        $rekomendasi->update([
            'diterapkan' => true,
            'diterapkan_at' => now(),
        ]);

        return response()->json([
            'data' => $rekomendasi->load('item'),
        ]);
    }
}
