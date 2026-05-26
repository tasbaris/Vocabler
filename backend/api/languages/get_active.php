<?php
require_once '../conn.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit(json_encode(['status' => 'error', 'message' => 'Sadece GET istekleri kabul edilir.']));
}

try {
    $stmt = $pdo->query("SELECT Id, LangCode, LangName FROM Languages WHERE Active = 1 ORDER BY LangName ASC");
    $languages = $stmt->fetchAll();

    echo json_encode(['status' => 'success', 'languages' => $languages]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Sunucu hatasi.']);
}
