<?php
require_once '../conn.php';
require_once '../auth_middleware.php';

header('Content-Type: application/json');

$userData = authenticate();

$input = json_decode(file_get_contents('php://input'), true);

if (empty($input['id'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'ID eksik.']);
    exit;
}

try {
    $stmt = $pdo->prepare("DELETE FROM Categories WHERE Id = ?");
    $stmt->execute([$input['id']]);
    echo json_encode(['status' => 'success', 'message' => 'Kategori silindi.']);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Silme hatası.']);
}
