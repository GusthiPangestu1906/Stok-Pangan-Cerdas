<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@koperasipangan.id'],
            [
                'name' => 'Admin Koperasi',
                'password' => Hash::make('admin123'),
            ]
        );

        $this->call(ItemSeeder::class);
        $this->call(RekomendasiDemoSeeder::class);
    }
}
