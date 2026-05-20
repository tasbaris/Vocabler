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
    echo json_encode(['status' => 'success', 'message' => 'Kullanici bilgileri ve ayarlar guncellendi.']);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Sunucu hatasi.']);
}
?>