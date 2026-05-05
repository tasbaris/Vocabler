<?php
require_once '../conn.php';
require_once '../auth_middleware.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['status' => 'error', 'message' => 'Sadece POST kabul edilir.']));
}

$userData = authenticate();
$userId = $userData['userId'];

$input = json_decode(file_get_contents('php://input'), true);
$wordId = isset($input['wordId']) ? (int)$input['wordId'] : null;
$isCorrect = isset($input['isCorrect']) ? (int)$input['isCorrect'] : null;

if ($wordId === null || $isCorrect === null) {
    http_response_code(400);
    exit(json_encode(['status' => 'error', 'message' => 'wordId ve isCorrect alanları zorunludur.']));
}

try {
    // Hocanın Story 3 algoritmasını çalıştıran procedure
    $stmt = $pdo->prepare("CALL sp_UpdateWordProgress(:userId, :wordId, :isCorrect)");
    $stmt->execute([
        'userId' => $userId,
        'wordId' => $wordId,
        'isCorrect' => $isCorrect
    ]);

    echo json_encode([
        'status' => 'success',
        'message' => 'İlerleme kaydedildi.'
    ]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Veritabanı hatası.']);
}
?>