<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataFile = __DIR__ . '/data.json';

// Method GET: Ambil data dari data.json
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($dataFile)) {
        $content = file_get_contents($dataFile);
        echo $content;
    } else {
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'message' => 'File data.json tidak ditemukan.'
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// Method POST: Simpan update data ke data.json
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    
    if (empty($rawInput)) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Data input kosong.'
        ]);
        exit;
    }

    $decoded = json_decode($rawInput, true);
    if ($decoded === null && json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Format JSON tidak valid: ' . json_last_error_msg()
        ]);
        exit;
    }

    // Tulis data ke file dengan penguncian aman
    $saved = file_put_contents(
        $dataFile,
        json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        LOCK_EX
    );

    if ($saved !== false) {
        echo json_encode([
            'status' => 'success',
            'message' => 'Data berhasil disimpan ke server.'
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Gagal menulis file data.json. Periksa izin akses (permission 644/755/777) folder cPanel.'
        ]);
    }
    exit;
}

// Method selain GET dan POST tidak diizinkan
http_response_code(405);
echo json_encode([
    'status' => 'error',
    'message' => 'Metode request tidak diizinkan.'
]);
