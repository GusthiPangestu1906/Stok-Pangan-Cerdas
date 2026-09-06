<?php

namespace App\Modules\Shared\Services;

class OpenApiSpecBuilder
{
    /**
     * Kompilasi modular OpenAPI specification menjadi satu struktur array utuh.
     *
     * @return array<string, mixed>
     */
    public static function build(): array
    {
        $baseDir = resource_path('openapi');

        $base = json_decode(file_get_contents($baseDir . '/base.json'), true) ?? [];
        $components = json_decode(file_get_contents($baseDir . '/components.json'), true) ?? [];

        $paths = [];
        $pathFiles = glob($baseDir . '/paths/*.json') ?: [];
        sort($pathFiles);

        foreach ($pathFiles as $file) {
            $domainPaths = json_decode(file_get_contents($file), true) ?? [];
            $paths = array_merge($paths, $domainPaths);
        }

        $base['paths'] = $paths;
        $base['components'] = $components;

        return $base;
    }

    /**
     * Tulis hasil kompilasi ke public/openapi.json agar siap disajikan statis/CDN.
     */
    public static function syncToPublic(): void
    {
        $spec = self::build();
        file_put_contents(
            public_path('openapi.json'),
            json_encode($spec, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
        );
    }
}
