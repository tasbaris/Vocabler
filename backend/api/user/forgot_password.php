<?php
require_once '../conn.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['status' => 'error', 'message' => 'Sadece POST istekleri kabul edilir.']));
}

$input = json_decode(file_get_contents('php://input'), true);

if (empty($input['email'])) {
    http_response_code(400);
    exit(json_encode(['status' => 'error', 'message' => 'E-posta adresi zorunludur.']));
}

try {
    $stmt = $pdo->prepare("SELECT Id FROM Users WHERE Email = ?");
    $stmt->execute([trim($input['email'])]);
    $userId = $stmt->fetchColumn();

    if ($userId) {
        $token = bin2hex(random_bytes(32));
        $pdo->prepare("INSERT INTO PasswordResets (UserId, ResetToken, ExpiresAt) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))")
            ->execute([$userId, $token]);
            
        echo json_encode([
            'status' => 'success', 
            'message' => 'Sifre sifirlama baglantisi e-posta adresinize gonderildi.', 
            'debug_token' => $token
        ]);
    } else {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Bu e-posta adresine ait kullanici bulunamadi.']);
    }
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Sunucu hatasi.']);
}
?>