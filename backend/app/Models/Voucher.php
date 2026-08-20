<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class Voucher extends Model
{
    protected $fillable = [
        'kode',
        'item_id',
        'rekomendasi_id',
        'nama_item',
        'kategori_item',
        'judul',
        'target',
        'diskon_persen',
        'diskon_nominal',
        'harga_normal',
        'min_belanja',
        'kuota',
        'terpakai',
        'berlaku_sampai',
        'status',
    ];

    protected $casts = [
        'berlaku_sampai' => 'date',
    ];

    protected $appends = [
        'sisa_kuota',
        'sudah_kadaluarsa',
        'tipe',
        'nilai',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function rekomendasi(): BelongsTo
    {
        return $this->belongsTo(Rekomendasi::class);
    }

    protected function sisaKuota(): Attribute
    {
        return Attribute::get(fn () => max(0, $this->kuota - $this->terpakai));
    }

    protected function sudahKadaluarsa(): Attribute
    {
        return Attribute::get(fn () => $this->berlaku_sampai->lt(Carbon::today()));
    }

    /**
     * Bentuk 'tipe' + 'nilai' dipertahankan sebagai accessor supaya frontend
     * yang sudah dibangun (modal terbit voucher, simulator kasir) tidak
     * perlu diubah — cukup dua kolom diskon_persen/diskon_nominal yang
     * jadi sumber kebenaran di database.
     */
    protected function tipe(): Attribute
    {
        return Attribute::get(fn () => $this->diskon_persen !== null ? 'persen' : 'nominal');
    }

    protected function nilai(): Attribute
    {
        return Attribute::get(fn () => $this->diskon_persen ?? $this->diskon_nominal ?? 0);
    }
}
