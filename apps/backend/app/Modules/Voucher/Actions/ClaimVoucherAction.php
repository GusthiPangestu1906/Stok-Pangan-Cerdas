<?php

namespace App\Modules\Voucher\Actions;

use App\Modules\Intelligence\Models\Rekomendasi;
use App\Modules\Voucher\Models\Voucher;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;

class ClaimVoucherAction
{
    public function __construct(
        private readonly ValidateVoucherAction $validator
    ) {}

    /**
     * Klaim voucher: re-validasi semua syarat di backend,
     * naikkan counter pemakaian, ubah status jadi habis jika kuota terpenuhi,
     * dan catat audit log tindakan Diskon di Riwayat.
     *
     * @throws HttpResponseException jika tidak valid
     */
    public function execute(Voucher $voucher, ?int $totalBelanja = null): Voucher
    {
        if ($voucher->status !== 'aktif') {
            throw new HttpResponseException(response()->json([
                'message' => "Voucher ini berstatus \"{$voucher->status}\", tidak bisa diklaim.",
            ], 422));
        }

        if ($voucher->sudah_kadaluarsa) {
            throw new HttpResponseException(response()->json([
                'message' => 'Voucher ini sudah lewat masa berlaku.',
            ], 422));
        }

        if ($voucher->sisa_kuota <= 0) {
            throw new HttpResponseException(response()->json([
                'message' => 'Kuota voucher ini sudah habis.',
            ], 422));
        }

        $pesanMinBelanja = $this->validator->cekMinBelanja($voucher, $totalBelanja);
        if ($pesanMinBelanja) {
            throw new HttpResponseException(response()->json([
                'message' => $pesanMinBelanja,
            ], 422));
        }

        return DB::transaction(function () use ($voucher) {
            $voucher->terpakai += 1;
            if ($voucher->terpakai >= $voucher->kuota) {
                $voucher->status = 'habis';
            }
            $voucher->save();

            $namaBarang = $voucher->item?->nama ?? $voucher->nama_item ?? $voucher->target ?? $voucher->judul;

            Rekomendasi::create([
                'item_id' => $voucher->item_id,
                'nama_item' => $voucher->nama_item ?? $voucher->item?->nama ?? $voucher->target ?? $voucher->judul,
                'kategori_item' => $voucher->kategori_item ?? $voucher->item?->kategori,
                'jenis_saran' => 'Diskon',
                'sumber' => 'kasir',
                'kode_voucher' => $voucher->kode,
                'isi_saran' => "Voucher \"{$voucher->kode}\" ({$voucher->judul}) diklaim di kasir untuk {$namaBarang}.",
                'status_item_saat_dibuat' => $voucher->item?->status ?? 'berisiko',
                'jumlah_stok_saat_dibuat' => 0,
                'diterapkan' => true,
                'diterapkan_at' => now(),
            ]);

            return $voucher;
        });
    }
}
