<?php

namespace App\Modules\Inventory\Models;

use App\Modules\Intelligence\Models\Rekomendasi;
use Carbon\Carbon;
use Database\Factories\ItemFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Item extends Model
{
    /** @use HasFactory<ItemFactory> */
    use HasFactory;

    protected $fillable = [
        'nama',
        'kategori',
        'tanggal_masuk',
        'estimasi_umur_simpan_hari',
        'jumlah_stok',
    ];

    protected $casts = [
        'tanggal_masuk' => 'date',
    ];

    protected $appends = [
        'tanggal_kadaluarsa',
        'sisa_hari',
        'status',
    ];

    protected function tanggalKadaluarsa(): Attribute
    {
        return Attribute::get(
            fn () => $this->tanggal_masuk
                ->copy()
                ->addDays($this->estimasi_umur_simpan_hari)
                ->toDateString()
        );
    }

    protected function sisaHari(): Attribute
    {
        return Attribute::get(function () {
            $kadaluarsa = $this->tanggal_masuk->copy()->addDays($this->estimasi_umur_simpan_hari);

            return (int) Carbon::today()->diffInDays($kadaluarsa, false);
        });
    }

    protected function status(): Attribute
    {
        return Attribute::get(function () {
            $sisaHari = $this->sisa_hari;

            return match (true) {
                $sisaHari <= 2 => 'kritis',
                $sisaHari <= 5 => 'berisiko',
                default => 'aman',
            };
        });
    }

    public function rekomendasi(): HasMany
    {
        return $this->hasMany(Rekomendasi::class);
    }
}
