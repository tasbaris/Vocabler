<?php
require_once '../conn.php';
require_once '../auth_middleware.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['status' => 'error', 'message' => 'Sadece POST veya PUT istekleri kabul edilir.']));
}

$userData = authenticate();
$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    http_response_code(400);
    exit(json_encode(['status' => 'error', 'message' => 'Gecersiz veri formati.']));
}

$allowed = [
    'name' => 'Name', 
    'surname' => 'Surname', 
    'dailyWord' => 'DailyWord', 
    'nativeLangId' => 'NativeLangId', 
    'targetLangId' => 'CurrentTargetLangId'
];

$updates = [];
$params = ['id' => $userData['userId']];

foreach ($allowed as $key => $column) {
    // Sadece gönderilen ve boş olmayan alanları güncellemeye dahil et
    if (isset($input[$key]) && $input[$key] !== '') {
        $updates[] = "$column = :$key";
        $params[$key] = is_string($input[$key]) ? trim($input[$key]) : $input[$key];
    }
}

if (empty($updates)) {
    http_response_code(400);
    exit(json_encode(['status' => 'error', 'message' => 'Guncellenecek gecerli alan bulunamadi.']));
}

try {
    $sql = "UPDATE Users SET " . implode(', ', $updates) . " WHERE Id = :id";
    $pdo->prepare($sql)->execute($params);
    echo json_encode(['status' => 'success', 'message' => 'Profil basariyla guncellendi.']);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Sunucu hatasi.']);
}
?>