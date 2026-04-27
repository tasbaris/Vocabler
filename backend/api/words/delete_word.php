<?php
require_once '../conn.php';
require_once '../auth_middleware.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    exit(json_encode(['status' => 'error', 'message' => 'Sadece POST veya DELETE istekleri kabul edilir.']));
}

$userData = authenticate();
$userId = $userData['userId'];

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

if (empty($input['wordId'])) {
    http_response_code(400);
    exit(json_encode(['status' => 'error', 'message' => 'wordId zorunludur.']));
}

try {
    // Kelimenin kullanıcıya ait olduğunu kontrol et
    $stmtCheck = $pdo->prepare("SELECT AddedById FROM Words WHERE Id = ?");
    $stmtCheck->execute([$input['wordId']]);
    $word = $stmtCheck->fetch();

    if (!$word) {
        http_response_code(404);
        exit(json_encode(['status' => 'error', 'message' => 'Kelime bulunamadı.']));
    }

    if ($word['AddedById'] != $userId) {
        http_response_code(403);
        exit(json_encode(['status' => 'error', 'message' => 'Sadece kendi eklediğiniz kelimeleri silebilirsiniz.']));
    }

    // ON DELETE CASCADE tanımlı olduğu için Words tablosundan silmek yeterli olacaktır.
    // Diğer tablolardaki ilişkili veriler de silinir.
    $stmt = $pdo->prepare("DELETE FROM Words WHERE Id = ?");
    $stmt->execute([$input['wordId']]);

    echo json_encode(['status' => 'success', 'message' => 'Kelime başarıyla silindi.']);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Sunucu hatası: ' . $e->getMessage()]);
}
?>