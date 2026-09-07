<?php

namespace App\Modules\Intelligence\Enums;

/**
 * Backed Enum untuk kategori rekomendasi tindakan dari AI / Kasir / Sistem.
 */
enum JenisSaran: string
{
    case DISKON = 'Diskon';
    case DISTRIBUSI = 'Distribusi';
    case BUNDLING = 'Bundling';
    case DIBUANG = 'Dibuang';

    /**
     * Deskripsi ringkas tujuan tindakan.
     */
    public function deskripsi(): string
    {
        return match ($this) {
            self::DISKON => 'Pemberian potongan harga dinamis untuk mempercepat perputaran barang',
            self::DISTRIBUSI => 'Penyaluran ke mitra sosial / bank pangan sebelum masa simpan berakhir',
            self::BUNDLING => 'Penggabungan paket hemat dengan komoditas berputar cepat',
            self::DIBUANG => 'Pencatatan pemusnahan barang yang telah melewati batas aman konsumsi',
        };
    }

    /**
     * Memeriksa apakah tindakan ini merupakan upaya penyelamatan pangan (food rescue).
     */
    public function isFoodRescue(): bool
    {
        return $this !== self::DIBUANG;
    }
}
