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

$wordId = $input['wordId'] ?? null;
$questionId = $input['questionId'] ?? null;
$isCorrect = $input['isCorrect'] ?? null;

if (!$wordId && $questionId) {
    // Soru ID'sinden WordId'yi çekmeye çalış
    $stmt = $pdo->prepare("SELECT WordId FROM Questions WHERE Id = ?");
    $stmt->execute([$questionId]);
    $res = $stmt->fetch();
    $wordId = $res ? $res['WordId'] : null;
}

if (!$wordId || $isCorrect === null) {
    error_log("Failed progress update. WordId: $wordId, QuestionId: $questionId, IsCorrect: $isCorrect");
    http_response_code(400);
    exit(json_encode(['status' => 'error', 'message' => 'Eksik parametre (WordId bulunamadı).']));
}

try {
    // Kelimenin ilerlemesini güncelle
    error_log("Updating progress for User: $userId, Word: $wordId, Correct: " . ($isCorrect ? 1 : 0));
    $stmt = $pdo->prepare("CALL sp_UpdateWordProgress(?, ?, ?)");
    $stmt->execute([$userId, $wordId, $isCorrect ? 1 : 0]);
    
    echo json_encode(['status' => 'success']);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Veritabani hatasi: ' . $e->getMessage()]);
}
?>
