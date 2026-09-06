<?php

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
            // 'ai' = rekomendasi AI biasa yang ditandai diterapkan admin,
            // 'kasir' = pencatatan otomatis dari klaim voucher di kasir.
            // Terpisah dari jenis_saran supaya statistik unit_terselamatkan
            // (yang mengelompokkan berdasar jenis_saran) tidak perlu diubah.
            $table->string('sumber')->default('ai')->after('jenis_saran');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rekomendasi', function (Blueprint $table) {
            $table->dropColumn('sumber');
        });
    }
};
