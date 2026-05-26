<?php
require_once '../conn.php';
require_once '../auth_middleware.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['status' => 'error', 'message' => 'Only POST requests are allowed.']));
}

$userData = authenticate();
$userId = $userData['userId'];

$input = json_decode(file_get_contents('php://input'), true);
$storyId = isset($input['storyId']) ? (int)$input['storyId'] : 0;

if ($storyId <= 0) {
    http_response_code(400);
    exit(json_encode(['status' => 'error', 'message' => 'Geçersiz hikaye ID.']));
}

try {
    // 1. Check if the story belongs to the user
    $stmt = $pdo->prepare("SELECT ImageUrl FROM Stories WHERE Id = ? AND UserId = ?");
    $stmt->execute([$storyId, $userId]);
    $story = $stmt->fetch();

    if (!$story) {
        http_response_code(403);
        exit(json_encode(['status' => 'error', 'message' => 'Bu hikayeyi silme yetkiniz yok veya hikaye bulunamadı.']));
    }

    // 2. Delete the story from database
    $stmt = $pdo->prepare("DELETE FROM Stories WHERE Id = ? AND UserId = ?");
    $stmt->execute([$storyId, $userId]);

    // 3. Optional: Delete the local image file if it exists
    $imageUrl = $story['ImageUrl'];
    if (strpos($imageUrl, 'uploads/stories/') !== false) {
        $filePath = '../../' . $imageUrl;
        if (file_exists($filePath)) {
            @unlink($filePath);
        }
    }

    echo json_encode(['status' => 'success', 'message' => 'Hikaye başarıyla silindi.']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Veritabanı hatası: ' . $e->getMessage()]);
}
