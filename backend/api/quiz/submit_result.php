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

if (!isset($input['wordId']) || !isset($input['isCorrect'])) {
    http_response_code(400);
    exit(json_encode(['status' => 'error', 'message' => 'Eksik veri: wordId ve isCorrect gereklidir.']));
}

try {
    // sp_UpdateWordProgress(p_UserId, p_WordId, p_IsCorrect)
    $stmt = $pdo->prepare("CALL sp_UpdateWordProgress(?, ?, ?)");
    $isCorrect = $input['isCorrect'] ? 1 : 0;
    $stmt->execute([$userId, $input['wordId'], $isCorrect]);

    echo json_encode(['status' => 'success', 'message' => 'İlerleme kaydedildi.']);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Veritabanı hatası: ' . $e->getMessage()]);
}
