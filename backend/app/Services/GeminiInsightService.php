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

    /** @var list<string> */
    private readonly array $modelFallbacks;

    /**
     * @param  list<string>|null  $modelFallbacks
     */
    public function __construct(?string $apiKey = null, ?string $model = null, ?array $modelFallbacks = null)
    {
        $this->apiKey = $apiKey ?: (string) config('services.gemini.key');
        $this->model = $model ?: (string) config('services.gemini.model');
        $this->modelFallbacks = $modelFallbacks ?? (array) config('services.gemini.model_fallbacks', []);
    }

    /**
     * Minta rekomendasi tindakan dari Gemini untuk satu barang berisiko/kritis.
     *
     * Kuota gratis Gemini dibatasi PER MODEL, bukan digabung. Kalau model
     * utama kena 429 (kuota habis), dicoba berurutan ke rantai model
     * cadangan yang kuotanya masing-masing terpisah — dari kualitas output
     * paling mendekati model utama ke yang paling sederhana — sebelum
     * benar-benar menyerah dan memberi tahu user bahwa kuota habis.
     *
     * @return array{jenis_saran: string, isi_saran: string}
     */
    public function buatRekomendasi(Item $item): array
    {
        if (! $this->apiKey) {
            Log::error('GEMINI_API_KEY belum diatur di .env');

            throw new RuntimeException('Layanan AI belum dikonfigurasi. Hubungi pengelola sistem.');
        }

        $cacheKey = 'gemini_insight_' . md5("{$item->nama}_{$item->kategori}_{$item->status}_{$item->sisa_hari}_{$item->jumlah_stok}");
        $cached = \Illuminate\Support\Facades\Cache::get($cacheKey);
        if ($cached && is_array($cached)) {
            Log::info('GeminiInsightService menggunakan cache persisten (0 token)', ['item_id' => $item->id]);
            return $cached;
        }

        $sudahKadaluarsa = $item->sisa_hari < 0;
        $prompt = $this->buildPrompt($item, $sudahKadaluarsa);

        // Rantai model yang dicoba untuk kasus 429
        $rantaiModel = array_values(array_unique([$this->model, ...$this->modelFallbacks]));

        $modelSebelumnya = null;
        $response = null;

        foreach ($rantaiModel as $model) {
            if ($modelSebelumnya !== null) {
                Log::warning('Gemini API kuota habis, berpindah ke model berikutnya dalam rantai', [
                    'item_id' => $item->id,
                    'model_gagal' => $modelSebelumnya,
                    'model_berikutnya' => $model,
                ]);
            }

            $response = $this->kirimKeGemini($model, $prompt, $sudahKadaluarsa, $item);

            if ($response->status() !== 429) {
                break;
            }

            $modelSebelumnya = $model;
        }

        $hasil = $this->parseResponse($response, $item, $rantaiModel);
        \Illuminate\Support\Facades\Cache::put($cacheKey, $hasil, now()->addDays(30));

        return $hasil;
    }

    private function kirimKeGemini(string $model, string $prompt, bool $sudahKadaluarsa, Item $item)
    {
        $enumSaran = $sudahKadaluarsa
            ? ['Dibuang']
            : ['Diskon', 'Distribusi', 'Bundling'];

        $retryableStatusCodes = [500, 503];

        try {
            return Http::withoutVerifying()
                ->timeout(25)
                ->withHeader('x-goog-api-key', $this->apiKey)
                ->retry([1000, 2000], when: function ($exception, $request) use ($retryableStatusCodes, $item, $model) {
                    $bolehRetry = $exception instanceof ConnectionException
                        || ($exception instanceof RequestException
                            && in_array($exception->response->status(), $retryableStatusCodes, true));

                    if ($bolehRetry) {
                        Log::warning('Gemini API request gagal, mencoba ulang', [
                            'item_id' => $item->id,
                            'model' => $model,
                            'status' => $exception instanceof RequestException ? $exception->response->status() : 'connection_error',
                        ]);
                    }

                    return $bolehRetry;
                }, throw: false)
                ->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent", [
                    'contents' => [
                        ['parts' => [['text' => $prompt]]],
                    ],
                    'generationConfig' => [
                        'temperature' => 0.3,
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
                'model' => $model,
                'error' => $e->getMessage(),
            ]);

            throw new RuntimeException('Layanan AI sedang tidak dapat dihubungi. Coba lagi beberapa saat.');
        }
    }

    /**
     * @param  list<string>  $rantaiModel
     */
    private function parseResponse($response, Item $item, array $rantaiModel = []): array
    {
        if ($response->status() === 429) {
            Log::error('Gemini API kuota habis di semua model yang dicoba', [
                'item_id' => $item->id,
                'rantai_model' => $rantaiModel,
                'body' => $response->body(),
            ]);

            throw new RuntimeException('Kuota harian layanan AI sudah habis. Fitur rekomendasi akan tersedia kembali besok.');
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
        $aturan = $sudahKadaluarsa
            ? 'Barang ini telah lewat tanggal kadaluarsa. Rekomendasikan jenis_saran "Dibuang" dengan instruksi pembuangan/pemusnahan yang aman.'
            : 'Pilih jenis_saran yang paling tepat: "Diskon", "Distribusi", atau "Bundling".';

        return <<<PROMPT
Sebagai asisten manajemen stok pangan, berikan 1 rekomendasi singkat (1-2 kalimat) dalam Bahasa Indonesia.
Data: {$item->nama} ({$item->kategori}), Stok: {$item->jumlah_stok} unit, Sisa masa simpan: {$item->sisa_hari} hari, Status: {$item->status}.
{$aturan}
PROMPT;
    }
}
