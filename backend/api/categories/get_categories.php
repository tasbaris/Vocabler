<?php
require_once '../conn.php';
require_once '../auth_middleware.php';

header('Content-Type: application/json');

// Sadece giriş yapmış kullanıcılar görebilir
$userData = authenticate();

try {
    $stmt = $pdo->prepare("SELECT * FROM Categories WHERE Active = 1 ORDER BY CategoryName ASC");
    $stmt->execute();
    $categories = $stmt->fetchAll();
    echo json_encode(['status' => 'success', 'data' => $categories]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Veritabanı hatası: ' . $e->getMessage()]);
}
?>