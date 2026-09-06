<?php

namespace Tests\Feature;

use App\Modules\Auth\Models\User;
use App\Modules\Inventory\Models\Item;
use App\Modules\Intelligence\Models\Rekomendasi;
use App\Modules\Shared\Services\OpenApiSpecBuilder;
use App\Modules\Voucher\Models\Voucher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModularArchitectureTest extends TestCase
{
    use RefreshDatabase;

    public function test_api_gateway_health_endpoint(): void
    {
        $response = $this->getJson('/api');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Stok Pangan Cerdas API is running',
            ]);
    }

    public function test_ringkasan_publik_accessible_via_analytics_module(): void
    {
        $response = $this->getJson('/api/ringkasan-publik');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'total_barang',
                    'sorotan',
                ],
            ]);
    }

    public function test_modular_models_are_correctly_namespaced(): void
    {
        $this->assertTrue(class_exists(User::class));
        $this->assertTrue(class_exists(Item::class));
        $this->assertTrue(class_exists(Rekomendasi::class));
        $this->assertTrue(class_exists(Voucher::class));

        // Legacy compatibility classes
        $this->assertTrue(is_subclass_of(\App\Models\User::class, User::class));
        $this->assertTrue(is_subclass_of(\App\Models\Item::class, Item::class));
        $this->assertTrue(is_subclass_of(\App\Models\Rekomendasi::class, Rekomendasi::class));
        $this->assertTrue(is_subclass_of(\App\Models\Voucher::class, Voucher::class));
    }

    public function test_modular_openapi_builder_and_endpoint(): void
    {
        $spec = OpenApiSpecBuilder::build();
        $this->assertArrayHasKey('openapi', $spec);
        $this->assertArrayHasKey('paths', $spec);
        $this->assertArrayHasKey('components', $spec);
        $this->assertArrayHasKey('/api/login', $spec['paths']);
        $this->assertArrayHasKey('/api/items', $spec['paths']);
        $this->assertArrayHasKey('/api/vouchers', $spec['paths']);

        $response = $this->getJson('/api/openapi.json');
        $response->assertStatus(200)
            ->assertJsonPath('openapi', '3.0.3')
            ->assertJsonPath('info.title', 'Stok Pangan Cerdas API');
    }

    public function test_auth_and_inventory_module_end_to_end(): void
    {
        $user = User::create([
            'name' => 'Admin Test',
            'email' => 'admin@test.id',
            'password' => 'secret123',
        ]);

        $loginResponse = $this->postJson('/api/login', [
            'email' => 'admin@test.id',
            'password' => 'secret123',
        ]);

        $loginResponse->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'user' => ['id', 'name', 'email'],
                    'token',
                ],
            ]);

        $token = $loginResponse->json('data.token');

        // Test Inventory Module CRUD with Sanctum token
        $createItemResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/items', [
                'nama' => 'Beras Organik 5kg',
                'kategori' => 'Sembako',
                'tanggal_masuk' => now()->format('Y-m-d'),
                'estimasi_umur_simpan_hari' => 30,
                'jumlah_stok' => 50,
            ]);

        $createItemResponse->assertStatus(201)
            ->assertJsonPath('data.nama', 'Beras Organik 5kg');

        $itemId = $createItemResponse->json('data.id');

        $getItemResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/items/{$itemId}");

        $getItemResponse->assertStatus(200)
            ->assertJsonPath('data.status', 'aman');

        // Test Voucher Module with Sanctum token
        $createVoucherResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/vouchers', [
                'item_id' => $itemId,
                'judul' => 'Diskon Kilat Beras',
                'tipe' => 'persen',
                'nilai' => 20,
                'berlaku_sampai' => now()->addDays(7)->format('Y-m-d'),
            ]);

        $createVoucherResponse->assertStatus(201);
        $vouchers = $createVoucherResponse->json('data');
        $this->assertNotEmpty($vouchers);
        $voucherCode = $vouchers[0]['kode'];

        // Validate voucher via cashier endpoint
        $validateResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/vouchers/validasi', [
                'kode' => $voucherCode,
            ]);

        $validateResponse->assertStatus(200)
            ->assertJsonPath('data.kode', $voucherCode);
    }
}
