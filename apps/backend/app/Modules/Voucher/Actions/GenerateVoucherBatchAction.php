<?php

namespace App\Modules\Voucher\Actions;

use App\Modules\Inventory\Models\Item;
use App\Modules\Voucher\Models\Voucher;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class GenerateVoucherBatchAction
{
    /**
     * Terbitkan voucher baru dalam batch transaksi.
     * Kode digenerate di backend dengan prefix nama item & angka acak 5 digit.
     *
     * @param  array<string, mixed>  $data
     * @return list<Voucher>
     */
    public function execute(array $data): array
    {
        $item = ! empty($data['item_id']) ? Item::find($data['item_id']) : null;
        $jumlah = $data['jumlah'] ?? 1;

        // Kupon untuk item/rekomendasi spesifik tidak masuk akal punya syarat belanja minimum
        $untukTargetSpesifik = $item !== null || ! empty($data['rekomendasi_id']);
        $minBelanja = $untukTargetSpesifik ? 0 : ($data['min_belanja'] ?? 0);

        return DB::transaction(function () use ($data, $item, $jumlah, $minBelanja) {
            $kodeTerpakaiDiBatch = [];
            $hasil = [];

            for ($i = 0; $i < $jumlah; $i++) {
                $kode = $this->generateKodeUnik($item?->nama ?? 'SPC', $kodeTerpakaiDiBatch);
                $kodeTerpakaiDiBatch[] = $kode;

                $hasil[] = Voucher::create([
                    'kode' => $kode,
                    'item_id' => $item?->id,
                    'rekomendasi_id' => $data['rekomendasi_id'] ?? null,
                    'nama_item' => $item?->nama,
                    'kategori_item' => $item?->kategori,
                    'judul' => $data['judul'],
                    'target' => $data['target'] ?? null,
                    'diskon_persen' => $data['tipe'] === 'persen' ? $data['nilai'] : null,
                    'diskon_nominal' => $data['tipe'] === 'nominal' ? $data['nilai'] : null,
                    'harga_normal' => $data['harga_normal'] ?? null,
                    'min_belanja' => $minBelanja,
                    'kuota' => 1,
                    'terpakai' => 0,
                    'berlaku_sampai' => $data['berlaku_sampai'],
                    'status' => 'aktif',
                ]);
            }

            return $hasil;
        });
    }

    /**
     * Generate kode unik voucher dengan prefix nama item + pad 'X' + 5 digit angka.
     *
     * @param  list<string>  $kodeTerpakaiDiBatch
     */
    public function generateKodeUnik(string $namaSumber, array $kodeTerpakaiDiBatch = []): string
    {
        $prefix = Str::upper(Str::limit(preg_replace('/[^a-zA-Z]/', '', $namaSumber), 3, '')) ?: 'SPC';
        $prefix = str_pad($prefix, 3, 'X');

        do {
            $angka = str_pad((string) random_int(0, 99999), 5, '0', STR_PAD_LEFT);
            $kode = "VCHR-{$prefix}-{$angka}";
        } while (in_array($kode, $kodeTerpakaiDiBatch, true) || Voucher::where('kode', $kode)->exists());

        return $kode;
    }
}
