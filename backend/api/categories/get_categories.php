<?php
require_once '../conn.php';
require_once '../auth_middleware.php';

header('Content-Type: application/json');

// Sadece giriş yapmış kullanıcılar görebilir
$userData = authenticate();
$userId = $userData['userId'];

try {
    // Kategori listesini getirirken, kullanıcının o kategoriden kelimesi olup olmadığını da kontrol et
    $stmt = $pdo->prepare("
        SELECT c.*, 
        (SELECT COUNT(*) FROM UserWords uw JOIN Words w ON uw.WordId = w.Id WHERE uw.UserId = ? AND w.CategoryId = c.Id) as UserWordCount
        FROM Categories c 
        WHERE c.Active = 1 
        ORDER BY c.CategoryName ASC
    ");
    $stmt->execute([$userId]);
    $categories = $stmt->fetchAll();
    echo json_encode(['status' => 'success', 'data' => $categories]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Veritabanı hatası: ' . $e->getMessage()]);
}
?>