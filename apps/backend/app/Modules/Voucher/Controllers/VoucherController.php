<?php

namespace App\Modules\Voucher\Controllers;

use App\Modules\Shared\Controllers\Controller;
use App\Modules\Voucher\Actions\ClaimVoucherAction;
use App\Modules\Voucher\Actions\GenerateVoucherBatchAction;
use App\Modules\Voucher\Actions\ValidateVoucherAction;
use App\Modules\Voucher\Models\Voucher;
use Illuminate\Http\Request;

class VoucherController extends Controller
{
    /**
     * Daftar voucher. Mendukung filter ?status=aktif.
     */
    public function index(Request $request)
    {
        $vouchers = Voucher::query()
            ->with(['item', 'rekomendasi'])
            ->when($request->query('status'), fn ($query, $status) => $query->where('status', $status))
            ->latest()
            ->get();

        return response()->json([
            'data' => $vouchers,
        ]);
    }

    /**
     * Terbitkan voucher baru via Use Case: GenerateVoucherBatchAction.
     */
    public function store(Request $request, GenerateVoucherBatchAction $action)
    {
        $validated = $request->validate([
            'item_id' => ['nullable', 'exists:items,id'],
            'rekomendasi_id' => ['nullable', 'exists:rekomendasi,id'],
            'judul' => ['required', 'string', 'max:255'],
            'target' => ['nullable', 'string', 'max:255'],
            'tipe' => ['required', 'in:persen,nominal'],
            'nilai' => ['required', 'integer', 'min:1'],
            'harga_normal' => ['nullable', 'integer', 'min:0'],
            'min_belanja' => ['nullable', 'integer', 'min:0'],
            'jumlah' => ['nullable', 'integer', 'min:1', 'max:50'],
            'berlaku_sampai' => ['required', 'date'],
        ]);

        $vouchers = $action->execute($validated);
        $loaded = collect($vouchers)->each->load(['item', 'rekomendasi']);

        return response()->json([
            'data' => $loaded,
        ], 201);
    }

    /**
     * Periksa validitas voucher via Use Case: ValidateVoucherAction.
     */
    public function validasi(Request $request, ValidateVoucherAction $action)
    {
        $validated = $request->validate([
            'kode' => ['required', 'string'],
            'total_belanja' => ['nullable', 'integer', 'min:0'],
        ]);

        $voucher = $action->execute($validated['kode'], $validated['total_belanja'] ?? null);

        return response()->json([
            'data' => $voucher->load(['item', 'rekomendasi']),
        ]);
    }

    /**
     * Klaim voucher di kasir via Use Case: ClaimVoucherAction.
     */
    public function klaim(Request $request, Voucher $voucher, ClaimVoucherAction $action)
    {
        $validated = $request->validate([
            'total_belanja' => ['nullable', 'integer', 'min:0'],
        ]);

        $claimed = $action->execute($voucher, $validated['total_belanja'] ?? null);

        return response()->json([
            'data' => $claimed->load(['item', 'rekomendasi']),
        ]);
    }
}
