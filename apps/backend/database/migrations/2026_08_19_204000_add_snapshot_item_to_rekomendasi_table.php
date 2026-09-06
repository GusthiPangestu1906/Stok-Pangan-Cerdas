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
            $table->string('nama_item')->nullable()->after('item_id');
            $table->string('kategori_item')->nullable()->after('nama_item');
        });

        // Backfill data lama dari relasi item
        Rekomendasi::with('item')
            ->get()
            ->each(function (Rekomendasi $rekomendasi) {
                if ($rekomendasi->item) {
                    $rekomendasi->update([
                        'nama_item' => $rekomendasi->item->nama,
                        'kategori_item' => $rekomendasi->item->kategori,
                    ]);
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rekomendasi', function (Blueprint $table) {
            $table->dropColumn(['nama_item', 'kategori_item']);
        });
    }
};
