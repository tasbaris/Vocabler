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

// Güncellenebilecek alanların haritası (Hocanın Story 4 isteği dahil)
$allowed = [
    'name' => 'Name',
    'surname' => 'Surname',
    'dailyWord' => 'DailyWord',
    'level' => 'Level',
    'nativeLangId' => 'NativeLangId',
    'targetLangId' => 'CurrentTargetLangId'
];

$updates = [];
$params = ['id' => $userId];

foreach ($allowed as $key => $column) {
    if (isset($input[$key])) {
        $updates[] = "$column = :$key";
        $params[$key] = $input[$key];
    }
}

if (empty($updates)) {
    http_response_code(400);
    exit(json_encode(['status' => 'error', 'message' => 'Guncellenecek alan gonderilmedi.']));
}

try {
    $sql = "UPDATE Users SET " . implode(', ', $updates) . " WHERE Id = :id";
    $pdo->prepare($sql)->execute($params);

    // Fetch updated user data with joined LangCode
    $stmt = $pdo->prepare("
        SELECT u.*, l.LangCode as NativeLangCode 
        FROM Users u 
        LEFT JOIN Languages l ON u.NativeLangId = l.Id 
        WHERE u.Id = ?
    ");
    $stmt->execute([$userId]);
    $updatedUser = $stmt->fetch();
    unset($updatedUser['PasswordHash']);

    echo json_encode([
        'status' => 'success', 
        'message' => 'Kullanici bilgileri ve ayarlar guncellendi.',
        'user' => $updatedUser
    ]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Sunucu hatasi.']);
}
