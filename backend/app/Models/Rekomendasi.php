<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Rekomendasi extends Model
{
    protected $table = 'rekomendasi';

    protected $fillable = [
        'item_id',
        'jenis_saran',
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

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }
}
