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
            // Diisi langsung dari $voucher->kode saat klaim kupon (sumber=
            // 'kasir'), bukan diparsing dari isi_saran. Null untuk
            // rekomendasi AI biasa dan entri lama sebelum kolom ini ada.
            $table->string('kode_voucher')->nullable()->after('sumber');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rekomendasi', function (Blueprint $table) {
            $table->dropColumn('kode_voucher');
        });
    }
};
