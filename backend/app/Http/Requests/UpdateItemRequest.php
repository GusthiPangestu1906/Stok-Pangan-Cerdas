<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\HasItemValidationMessages;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateItemRequest extends FormRequest
{
    use HasItemValidationMessages;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nama' => ['sometimes', 'required', 'string', 'max:255'],
            'kategori' => ['sometimes', 'required', 'string', 'max:100'],
            'tanggal_masuk' => ['sometimes', 'required', 'date', 'before_or_equal:today'],
            'estimasi_umur_simpan_hari' => ['sometimes', 'required', 'integer', 'min:1'],
            'jumlah_stok' => ['sometimes', 'required', 'integer', 'min:0'],
        ];
    }
}
