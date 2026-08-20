<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreItemRequest;
use App\Http\Requests\UpdateItemRequest;
use App\Models\Item;
use App\Models\Rekomendasi;
use Illuminate\Http\Request;

class ItemController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $items = Item::query()
            ->when($request->query('kategori'), fn ($query, $kategori) => $query->where('kategori', $kategori))
            ->orderBy('nama')
            ->get();

        if ($status = $request->query('status')) {
            $items = $items->filter(fn (Item $item) => $item->status === $status)->values();
        }

        return response()->json([
            'data' => $items,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreItemRequest $request)
    {
        $item = Item::create($request->validated());

        return response()->json([
            'data' => $item,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Item $item)
    {
        return response()->json([
            'data' => $item,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateItemRequest $request, Item $item)
    {
        $item->update($request->validated());

        return response()->json([
            'data' => $item,
        ]);
    }

    /**
     * Remove the specified resource from storage and log food waste to Riwayat.
     */
    public function destroy(Item $item)
    {
        // 1. Simpan snapshot nama & kategori pada rekomendasi lama yang sudah diterapkan
        Rekomendasi::where('item_id', $item->id)
            ->where('diterapkan', true)
            ->update([
                'nama_item' => $item->nama,
                'kategori_item' => $item->kategori,
            ]);

        // 2. Hapus rekomendasi pending/belum diterapkan untuk barang ini
        Rekomendasi::where('item_id', $item->id)
            ->where('diterapkan', false)
            ->delete();

        // 3. Catat log pembuangan barang (waste tracking) ke Riwayat jika barang memiliki stok
        if ($item->jumlah_stok > 0) {
            $isKadaluarsa = $item->sisa_hari < 0;
            $alasan = $isKadaluarsa
                ? "Pembersihan stok \"{$item->nama}\" sebanyak {$item->jumlah_stok} unit yang telah melewati masa kadaluarsa (dibuang/dimusnahkan)."
                : "Penghapusan stok \"{$item->nama}\" sebanyak {$item->jumlah_stok} unit dari sistem gudang (dibuang/dimusnahkan).";

            Rekomendasi::create([
                'item_id' => null,
                'nama_item' => $item->nama,
                'kategori_item' => $item->kategori,
                'jenis_saran' => 'Dibuang',
                'isi_saran' => $alasan,
                'status_item_saat_dibuat' => $item->status,
                'jumlah_stok_saat_dibuat' => $item->jumlah_stok,
                'diterapkan' => true,
                'diterapkan_at' => now(),
            ]);
        }

        $item->delete();

        return response()->json(null, 204);
    }
}
