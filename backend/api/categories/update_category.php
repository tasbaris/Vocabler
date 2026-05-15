<?php
require_once '../conn.php';
require_once '../auth_middleware.php';

header('Content-Type: application/json');

$userData = authenticate();

$input = json_decode(file_get_contents('php://input'), true);

if (empty($input['id']) || empty($input['categoryName'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Eksik parametre.']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE Categories SET CategoryName = ? WHERE Id = ?");
    $stmt->execute([$input['categoryName'], $input['id']]);
    echo json_encode(['status' => 'success', 'message' => 'Kategori güncellendi.']);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Güncelleme hatası.']);
}
?>