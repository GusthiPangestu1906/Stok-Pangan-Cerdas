<?php

namespace App\Modules\Voucher\Actions;

use App\Modules\Voucher\Models\Voucher;
use Illuminate\Http\Exceptions\HttpResponseException;

class ValidateVoucherAction
{
    /**
     * Periksa validitas kode voucher secara berurutan:
     * 1. Ada di database
     * 2. Status 'aktif'
     * 3. Belum kadaluarsa
     * 4. Sisa kuota > 0
     * 5. Memenuhi syarat minimal belanja
     *
     * @throws HttpResponseException jika tidak valid
     */
    public function execute(string $kodeInput, ?int $totalBelanja = null): Voucher
    {
        $kode = strtoupper(trim($kodeInput));
        $voucher = Voucher::where('kode', $kode)->first();

        if (! $voucher) {
            throw new HttpResponseException(response()->json([
                'message' => "Kode voucher \"{$kode}\" tidak ditemukan.",
            ], 404));
        }

        if ($voucher->status !== 'aktif') {
            throw new HttpResponseException(response()->json([
                'message' => "Voucher ini berstatus \"{$voucher->status}\", tidak bisa dipakai.",
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

        $pesanMinBelanja = $this->cekMinBelanja($voucher, $totalBelanja);
        if ($pesanMinBelanja) {
            throw new HttpResponseException(response()->json([
                'message' => $pesanMinBelanja,
            ], 422));
        }

        return $voucher;
    }

    /**
     * Cek apakah total belanja memenuhi batas minimum kupon.
     */
    public function cekMinBelanja(Voucher $voucher, ?int $totalBelanja): ?string
    {
        if ($voucher->min_belanja <= 0) {
            return null;
        }

        $totalBelanja = $totalBelanja ?? 0;
        if ($totalBelanja >= $voucher->min_belanja) {
            return null;
        }

        $formatTotal = number_format($totalBelanja, 0, ',', '.');
        $formatMin = number_format($voucher->min_belanja, 0, ',', '.');

        return "Total belanja Rp {$formatTotal} belum memenuhi minimal Rp {$formatMin}.";
    }
}
