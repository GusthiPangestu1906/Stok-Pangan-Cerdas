<?php

namespace App\Modules\Inventory\Enums;

/**
 * Backed Enum yang merepresentasikan status risiko kesegaran barang inventaris.
 * Menerapkan pola OOP First-Class Citizens dengan method domain enkapsulasi.
 */
enum ItemStatus: string
{
    case AMAN = 'aman';
    case BERISIKO = 'berisiko';
    case KRITIS = 'kritis';

    /**
     * Pabrik objek (Static Factory Method) untuk menentukan status berdasarkan sisa hari umur simpan.
     */
    public static function fromSisaHari(int $sisaHari): self
    {
        return match (true) {
            $sisaHari <= 2 => self::KRITIS,
            $sisaHari <= 5 => self::BERISIKO,
            default => self::AMAN,
        };
    }

    /**
     * Label manusiawi untuk UI / Laporan.
     */
    public function label(): string
    {
        return match ($this) {
            self::AMAN => 'Aman',
            self::BERISIKO => 'Berisiko Kadaluarsa',
            self::KRITIS => 'Kritis (Segera Tindak)',
        };
    }

    /**
     * Kelas visual badge kompatibel styling design system.
     */
    public function badgeClass(): string
    {
        return match ($this) {
            self::AMAN => 'badge-aman',
            self::BERISIKO => 'badge-berisiko',
            self::KRITIS => 'badge-kritis',
        };
    }

    /**
     * Memeriksa apakah barang memerlukan tindakan intervensi / penyelamatan.
     */
    public function butuhTindakan(): bool
    {
        return $this !== self::AMAN;
    }
}
