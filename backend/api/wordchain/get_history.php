<?php
require_once '../conn.php';
require_once '../auth_middleware.php';

header('Content-Type: application/json; charset=utf-8');

$userData = authenticate();
$userId = $userData['userId'];

try {
    $stmt = $pdo->prepare("
        SELECT Id, StoryText, ImageUrl, Words, CreatedAt
        FROM Stories
        WHERE UserId = ?
        ORDER BY CreatedAt DESC
    ");
    $stmt->execute([$userId]);
    $stories = $stmt->fetchAll();

    echo json_encode([
        'status' => 'success',
        'stories' => $stories
    ]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Veritabanı hatası: ' . $e->getMessage()]);
}
