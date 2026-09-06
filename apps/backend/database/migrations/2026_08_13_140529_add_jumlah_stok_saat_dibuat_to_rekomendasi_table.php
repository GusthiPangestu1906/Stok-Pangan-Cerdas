<?php

use App\Models\Rekomendasi;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('rekomendasi', function (Blueprint $table) {
            $table->unsignedInteger('jumlah_stok_saat_dibuat')->nullable()->after('status_item_saat_dibuat');
        });

        // Backfill data lama: isi dengan jumlah_stok item saat ini, karena
        // snapshot asli tidak pernah dicatat sebelum kolom ini ada.
        Rekomendasi::with('item')
            ->whereNull('jumlah_stok_saat_dibuat')
            ->get()
            ->each(function (Rekomendasi $rekomendasi) {
                $rekomendasi->update([
                    'jumlah_stok_saat_dibuat' => $rekomendasi->item?->jumlah_stok ?? 0,
                ]);
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rekomendasi', function (Blueprint $table) {
            $table->dropColumn('jumlah_stok_saat_dibuat');
        });
    }
};
