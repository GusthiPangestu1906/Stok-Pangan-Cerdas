<?php

namespace App\Services;

use App\Models\Item;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class GeminiInsightService
{
    private readonly string $apiKey;

    private readonly string $model;

    public function __construct(?string $apiKey = null, ?string $model = null)
    {
        $this->apiKey = $apiKey ?: (string) config('services.gemini.key');
        $this->model = $model ?: (string) config('services.gemini.model');
    }

    /**
     * Minta rekomendasi tindakan dari Gemini untuk satu barang berisiko/kritis.
     *
     * @return array{jenis_saran: string, isi_saran: string}
     */
    public function buatRekomendasi(Item $item): array
    {
        if (! $this->apiKey) {
            Log::error('GEMINI_API_KEY belum diatur di .env');

            throw new RuntimeException('Layanan AI belum dikonfigurasi. Hubungi pengelola sistem.');
        }

        $sudahKadaluarsa = $item->sisa_hari < 0;
        $prompt = $this->buildPrompt($item, $sudahKadaluarsa);

        $enumSaran = $sudahKadaluarsa
            ? ['Pemusnahan']
            : ['Diskon', 'Distribusi', 'Bundling'];

        $retryableStatusCodes = [429, 500, 503];

        try {
            $response = Http::timeout(12)
                ->withHeader('x-goog-api-key', $this->apiKey)
                ->retry([1000, 2000], when: function ($exception, $request) use ($retryableStatusCodes, $item) {
                    $bolehRetry = $exception instanceof ConnectionException
                        || ($exception instanceof RequestException
                            && in_array($exception->response->status(), $retryableStatusCodes, true));

                    if ($bolehRetry) {
                        Log::warning('Gemini API request gagal, mencoba ulang', [
                            'item_id' => $item->id,
                            'status' => $exception instanceof RequestException ? $exception->response->status() : 'connection_error',
                        ]);
                    }

                    return $bolehRetry;
                }, throw: false)
                ->post("https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent", [
                    'contents' => [
                        ['parts' => [['text' => $prompt]]],
                    ],
                    'generationConfig' => [
                        'temperature' => 0.4,
                        'responseMimeType' => 'application/json',
                        'responseSchema' => [
                            'type' => 'OBJECT',
                            'properties' => [
                                'jenis_saran' => [
                                    'type' => 'STRING',
                                    'enum' => $enumSaran,
                                ],
                                'isi_saran' => ['type' => 'STRING'],
                            ],
                            'required' => ['jenis_saran', 'isi_saran'],
                        ],
                    ],
                ]);
        } catch (ConnectionException $e) {
            Log::error('Gemini API tidak dapat dihubungi setelah beberapa percobaan', [
                'item_id' => $item->id,
                'error' => $e->getMessage(),
            ]);

            throw new RuntimeException('Layanan AI sedang tidak dapat dihubungi. Coba lagi beberapa saat.');
        }

        if ($response->failed()) {
            Log::error('Gemini API request failed', [
                'item_id' => $item->id,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            throw new RuntimeException('Layanan AI sedang tidak dapat dihubungi. Coba lagi beberapa saat.');
        }

        $text = $response->json('candidates.0.content.parts.0.text');

        if (! $text) {
            Log::error('Gemini API response missing recommendation text', [
                'item_id' => $item->id,
                'body' => $response->body(),
            ]);

            throw new RuntimeException('Layanan AI tidak memberikan rekomendasi. Coba lagi beberapa saat.');
        }

        $parsed = json_decode($text, true);

        if (! is_array($parsed) || ! isset($parsed['jenis_saran'], $parsed['isi_saran'])) {
            Log::error('Gemini API response format unexpected', [
                'item_id' => $item->id,
                'text' => $text,
            ]);

            throw new RuntimeException('Layanan AI memberikan respons yang tidak sesuai format. Coba lagi beberapa saat.');
        }

        return [
            'jenis_saran' => $parsed['jenis_saran'],
            'isi_saran' => $parsed['isi_saran'],
        ];
    }

    private function buildPrompt(Item $item, bool $sudahKadaluarsa): string
    {
        $statusLabel = match ($item->status) {
            'kritis' => 'Kritis (akan kadaluarsa dalam 2 hari atau kurang, atau sudah lewat)',
            'berisiko' => 'Berisiko (akan kadaluarsa dalam 3-5 hari)',
            default => 'Aman',
        };

        $instruksiSaran = $sudahKadaluarsa
            ? <<<INSTRUKSI
                PENTING — Barang ini SUDAH LEWAT tanggal kadaluarsa (sisa hari negatif). Barang seperti ini TIDAK LAYAK dijual, didiskon, didistribusikan, atau dibundling dengan produk lain karena berisiko terhadap keamanan pangan.
                Satu-satunya jenis_saran yang boleh kamu berikan adalah "Pemusnahan". Isi_saran harus menginstruksikan pemusnahan/pembuangan barang secara aman sesuai prosedur kebersihan gudang, TANPA menyarankan penjualan dalam bentuk apa pun.
                INSTRUKSI
            : <<<INSTRUKSI
                Pilih SATU jenis saran yang paling tepat: "Diskon", "Distribusi", atau "Bundling".
                - Diskon: barang dijual dengan potongan harga agar cepat terjual sebelum kadaluarsa.
                - Distribusi: barang didistribusikan/disumbangkan ke pihak lain (mitra, dapur umum, dsb) sebelum kadaluarsa.
                - Bundling: barang digabung dengan produk lain menjadi satu paket jual agar lebih menarik dan cepat laku.
                INSTRUKSI;

        return <<<PROMPT
            Kamu adalah asisten AI untuk sistem manajemen stok pangan koperasi/UMKM bernama "Stok Pangan Cerdas".
            Tugasmu: memberi SATU rekomendasi tindakan konkret dalam Bahasa Indonesia untuk barang berikut.

            Data barang:
            - Nama: {$item->nama}
            - Kategori: {$item->kategori}
            - Jumlah stok: {$item->jumlah_stok} unit
            - Tanggal masuk: {$item->tanggal_masuk->toDateString()}
            - Estimasi umur simpan: {$item->estimasi_umur_simpan_hari} hari
            - Sisa hari sebelum kadaluarsa: {$item->sisa_hari} hari
            - Status risiko: {$statusLabel}

            {$instruksiSaran}

            Tulis isi_saran sebagai 1-2 kalimat singkat, praktis, dan actionable dalam Bahasa Indonesia — sebutkan jenis barang dan alasan singkat berdasarkan data di atas. Jangan gunakan format markdown.
            PROMPT;
    }
}
