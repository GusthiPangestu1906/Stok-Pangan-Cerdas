<?php

namespace App\Modules\Inventory\Requests\Concerns;

trait HasItemValidationMessages
{
    /**
     * Pesan validasi Bahasa Indonesia — antarmuka aplikasi wajib berbahasa Indonesia.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nama.required' => 'Nama barang wajib diisi.',
            'nama.string' => 'Nama barang harus berupa teks.',
            'nama.max' => 'Nama barang maksimal 255 karakter.',

            'kategori.required' => 'Kategori wajib diisi.',
            'kategori.string' => 'Kategori harus berupa teks.',
            'kategori.max' => 'Kategori maksimal 100 karakter.',

            'tanggal_masuk.required' => 'Tanggal masuk wajib diisi.',
            'tanggal_masuk.date' => 'Tanggal masuk harus berupa tanggal yang valid.',
            'tanggal_masuk.before_or_equal' => 'Tanggal masuk tidak boleh melebihi hari ini.',

            'estimasi_umur_simpan_hari.required' => 'Estimasi umur simpan wajib diisi.',
            'estimasi_umur_simpan_hari.integer' => 'Estimasi umur simpan harus berupa angka bulat.',
            'estimasi_umur_simpan_hari.min' => 'Estimasi umur simpan minimal 1 hari.',

            'jumlah_stok.required' => 'Jumlah stok wajib diisi.',
            'jumlah_stok.integer' => 'Jumlah stok harus berupa angka bulat.',
            'jumlah_stok.min' => 'Jumlah stok tidak boleh negatif.',
        ];
    }
}
