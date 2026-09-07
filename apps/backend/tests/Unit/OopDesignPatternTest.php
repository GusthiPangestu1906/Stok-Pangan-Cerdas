<?php

namespace Tests\Unit;

use App\Modules\Intelligence\Contracts\AiInsightServiceInterface;
use App\Modules\Intelligence\Enums\JenisSaran;
use App\Modules\Intelligence\Services\GeminiInsightService;
use App\Modules\Inventory\Enums\ItemStatus;
use App\Modules\Inventory\Models\Item;
use Carbon\Carbon;
use Tests\TestCase;

class OopDesignPatternTest extends TestCase
{
    /**
     * Uji Dependency Inversion Principle (DIP):
     * Service Container dapat me-resolve interface AiInsightServiceInterface ke GeminiInsightService.
     */
    public function test_ai_insight_service_interface_bound_to_container(): void
    {
        $service = $this->app->make(AiInsightServiceInterface::class);

        $this->assertInstanceOf(AiInsightServiceInterface::class, $service);
        $this->assertInstanceOf(GeminiInsightService::class, $service);
    }

    /**
     * Uji Enkapsulasi Domain Logic pada ItemStatus Enum (Static Factory & Methods).
     */
    public function test_item_status_enum_factory_and_domain_methods(): void
    {
        // <= 2 hari -> Kritis
        $kritis = ItemStatus::fromSisaHari(1);
        $this->assertSame(ItemStatus::KRITIS, $kritis);
        $this->assertSame('kritis', $kritis->value);
        $this->assertTrue($kritis->butuhTindakan());
        $this->assertStringContainsString('Kritis', $kritis->label());

        // 3 - 5 hari -> Berisiko
        $berisiko = ItemStatus::fromSisaHari(4);
        $this->assertSame(ItemStatus::BERISIKO, $berisiko);
        $this->assertSame('berisiko', $berisiko->value);
        $this->assertTrue($berisiko->butuhTindakan());

        // > 5 hari -> Aman
        $aman = ItemStatus::fromSisaHari(10);
        $this->assertSame(ItemStatus::AMAN, $aman);
        $this->assertSame('aman', $aman->value);
        $this->assertFalse($aman->butuhTindakan());
    }

    /**
     * Uji Karakteristik Enum JenisSaran.
     */
    public function test_jenis_saran_enum_integrity(): void
    {
        $diskon = JenisSaran::DISKON;
        $this->assertSame('Diskon', $diskon->value);
        $this->assertTrue($diskon->isFoodRescue());

        $dibuang = JenisSaran::DIBUANG;
        $this->assertSame('Dibuang', $dibuang->value);
        $this->assertFalse($dibuang->isFoodRescue());
    }

    /**
     * Uji Integrasi Model Item dengan Enum ItemStatus.
     */
    public function test_item_model_integrates_status_enum(): void
    {
        $item = new Item([
            'nama' => 'Apel Fuji',
            'kategori' => 'Buah',
            'tanggal_masuk' => Carbon::today()->toDateString(),
            'estimasi_umur_simpan_hari' => 1, // sisa 1 hari -> kritis
            'jumlah_stok' => 10,
        ]);

        $this->assertSame('kritis', $item->status);
        $this->assertSame(ItemStatus::KRITIS, $item->status_enum);
        $this->assertTrue($item->status_enum->butuhTindakan());
    }
}
