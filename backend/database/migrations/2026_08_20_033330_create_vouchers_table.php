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
        Schema::create('vouchers', function (Blueprint $table) {
            $table->id();
            $table->string('kode')->unique();
            $table->foreignId('item_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('rekomendasi_id')->nullable()->constrained('rekomendasi')->nullOnDelete();
            $table->string('nama_item')->nullable();
            $table->string('kategori_item')->nullable();
            $table->string('judul');
            $table->string('target')->nullable();
            $table->unsignedInteger('diskon_persen')->nullable();
            $table->unsignedInteger('diskon_nominal')->nullable();
            $table->unsignedInteger('harga_normal')->nullable();
            $table->unsignedInteger('min_belanja')->nullable()->default(0);
            $table->unsignedInteger('kuota');
            $table->unsignedInteger('terpakai')->default(0);
            $table->date('berlaku_sampai');
            $table->string('status')->default('aktif');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vouchers');
    }
};
