<?php
require_once '../conn.php';
require_once '../auth_middleware.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['status' => 'error', 'message' => 'Sadece POST istekleri kabul edilir.']));
}

$userData = authenticate();
$input = json_decode(file_get_contents('php://input'), true);

if (empty($input['oldPassword']) || empty($input['newPassword'])) {
    http_response_code(400);
    exit(json_encode(['status' => 'error', 'message' => 'Eski ve yeni sifre alanlari zorunludur.']));
}

try {
    $stmt = $pdo->prepare("SELECT PasswordHash FROM Users WHERE Id = ?");
    $stmt->execute([$userData['userId']]);
    $currentHash = $stmt->fetchColumn();

    if ($currentHash && password_verify($input['oldPassword'], $currentHash)) {
        $newHash = password_hash($input['newPassword'], PASSWORD_BCRYPT);
        $pdo->prepare("UPDATE Users SET PasswordHash = ? WHERE Id = ?")->execute([$newHash, $userData['userId']]);

        echo json_encode(['status' => 'success', 'message' => 'Sifreniz basariyla degistirildi.']);
    } else {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Eski sifreniz hatali.']);
    }
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Sunucu hatasi.']);
}
