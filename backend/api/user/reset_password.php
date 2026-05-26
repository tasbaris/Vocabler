<?php
require_once '../conn.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['status' => 'error', 'message' => 'Sadece POST istekleri kabul edilir.']));
}

$input = json_decode(file_get_contents('php://input'), true);

if (empty($input['token']) || empty($input['newPassword'])) {
    http_response_code(400);
    exit(json_encode(['status' => 'error', 'message' => 'Token ve yeni sifre alanlari zorunludur.']));
}

try {
    $stmt = $pdo->prepare("SELECT Id, UserId FROM PasswordResets WHERE ResetToken = ? AND IsUsed = 0 AND ExpiresAt >= NOW()");
    $stmt->execute([$input['token']]);
    $resetData = $stmt->fetch();

    if ($resetData) {
        $newHash = password_hash($input['newPassword'], PASSWORD_BCRYPT);

        // İşlemleri Transaction içinde yapıyoruz ki hata olursa geri alınsın
        $pdo->beginTransaction();

        $pdo->prepare("UPDATE Users SET PasswordHash = ? WHERE Id = ?")->execute([$newHash, $resetData['UserId']]);
        $pdo->prepare("UPDATE PasswordResets SET IsUsed = 1 WHERE Id = ?")->execute([$resetData['Id']]);

        $pdo->commit();

        echo json_encode(['status' => 'success', 'message' => 'Sifreniz basariyla sifirlandi.']);
    } else {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Gecersiz veya suresi dolmus token.']);
    }
} catch (\PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Sunucu hatasi.']);
}
