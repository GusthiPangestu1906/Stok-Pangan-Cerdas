<?php

// Prepare writable storage directory in /tmp for Vercel serverless environment
$storagePath = '/tmp/storage';
if (!is_dir($storagePath . '/framework/views')) {
    @mkdir($storagePath . '/framework/views', 0777, true);
    @mkdir($storagePath . '/framework/cache/data', 0777, true);
    @mkdir($storagePath . '/framework/sessions', 0777, true);
    @mkdir($storagePath . '/logs', 0777, true);
}
putenv('APP_STORAGE_PATH=' . $storagePath);
$_ENV['APP_STORAGE_PATH'] = $storagePath;

require __DIR__ . '/../public/index.php';
