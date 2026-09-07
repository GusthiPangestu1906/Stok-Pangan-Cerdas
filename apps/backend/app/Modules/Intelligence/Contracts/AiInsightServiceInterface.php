<?php

namespace App\Modules\Intelligence\Contracts;

use App\Modules\Inventory\Models\Item;

/**
 * Interface untuk abstraksi layanan rekomendasi AI (Dependency Inversion Principle).
 * Memungkinkan penggantian implementasi (misal Gemini, OpenAI, Claude, atau Mock untuk testing)
 * tanpa mengubah controller atau consumer domain lainnya.
 */
interface AiInsightServiceInterface
{
    /**
     * Buat rekomendasi tindakan penyelamatan pangan untuk item tertentu.
     *
     * @return array{jenis_saran: string, isi_saran: string}
     */
    public function buatRekomendasi(Item $item): array;
}
