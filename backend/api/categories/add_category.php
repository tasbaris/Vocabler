<?php
require_once '../conn.php';
require_once '../auth_middleware.php';

header('Content-Type: application/json');

$userData = authenticate();

$input = json_decode(file_get_contents('php://input'), true);

if (empty($input['categoryName'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Kategori adı boş olamaz.']);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO Categories (CategoryName, Active) VALUES (?, 1)");
    $stmt->execute([$input['categoryName']]);
    echo json_encode(['status' => 'success', 'message' => 'Kategori başarıyla eklendi.', 'id' => $pdo->lastInsertId()]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Kategori eklenirken hata oluştu.']);
}
