<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Rekomendasi extends Model
{
    protected $table = 'rekomendasi';

    protected $fillable = [
        'item_id',
        'nama_item',
        'kategori_item',
        'jenis_saran',
        'sumber',
        'kode_voucher',
        'isi_saran',
        'status_item_saat_dibuat',
        'jumlah_stok_saat_dibuat',
        'diterapkan',
        'diterapkan_at',
    ];

    protected $casts = [
        'diterapkan' => 'boolean',
        'diterapkan_at' => 'datetime',
    ];

    protected $appends = [
        'nama_barang',
        'kategori_barang',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function getNamaBarangAttribute(): string
    {
        return $this->item?->nama ?? $this->nama_item ?? '(barang dihapus)';
    }

    public function getKategoriBarangAttribute(): ?string
    {
        return $this->item?->kategori ?? $this->kategori_item;
    }
}
