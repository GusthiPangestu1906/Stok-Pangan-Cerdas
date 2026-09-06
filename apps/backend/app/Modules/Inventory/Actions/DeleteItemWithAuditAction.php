<?php

namespace App\Modules\Inventory\Actions;

use App\Modules\Intelligence\Models\Rekomendasi;
use App\Modules\Inventory\Models\Item;
use Illuminate\Support\Facades\DB;

class DeleteItemWithAuditAction
{
    /**
     * Hapus barang dari inventaris dan catat jejak audit (waste tracking):
     * 1. Update snapshot nama & kategori pada rekomendasi lama yang sudah diterapkan
     * 2. Hapus rekomendasi pending/belum diterapkan untuk barang ini
     * 3. Catat log pembuangan barang ke Riwayat jika barang memiliki sisa stok
     */
    public function execute(Item $item): void
    {
        DB::transaction(function () use ($item) {
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
        });
    }
}
