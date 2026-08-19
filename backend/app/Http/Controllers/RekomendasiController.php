<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\Rekomendasi;
use App\Services\GeminiInsightService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
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

        // Cache sederhana: kalau item ini sudah punya rekomendasi yang dibuat
        // HARI INI dan item belum diedit sejak rekomendasi itu dibuat, sisa
        // hari & status barang pasti masih sama seperti saat rekomendasi
        // dibuat — jadi rekomendasi lama masih relevan dan panggilan ke
        // Gemini bisa dihindari sama sekali (menghemat kuota harian).
        $rekomendasiCache = Rekomendasi::query()
            ->where('item_id', $item->id)
            ->whereDate('created_at', Carbon::today())
            ->where('created_at', '>=', $item->updated_at)
            ->latest()
            ->first();

        if ($rekomendasiCache) {
            $rekomendasiCache->setAttribute('dari_cache', true);

            return response()->json([
                'data' => $rekomendasiCache->load('item'),
            ], 200);
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

        $rekomendasi->setAttribute('dari_cache', false);

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
