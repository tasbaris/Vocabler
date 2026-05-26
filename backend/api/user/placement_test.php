<?php
require_once '../conn.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['status' => 'error', 'message' => 'Sadece POST kabul edilir.']));
}

$input = json_decode(file_get_contents('php://input'), true);

$correctCount = $input['correctCount'] ?? 0;
$totalQuestions = $input['totalQuestions'] ?? 10;
$userId = $input['userId'] ?? null;

if (!$userId) {
    http_response_code(400);
    exit(json_encode(['status' => 'error', 'message' => 'Kullanıcı ID gereklidir.']));
}

// Basit bir seviye belirleme algoritması
$percentage = ($correctCount / $totalQuestions) * 100;

if ($percentage < 30) {
    $level = 'A1';
} elseif ($percentage < 50) {
    $level = 'A2';
} elseif ($percentage < 70) {
    $level = 'B1';
} elseif ($percentage < 90) {
    $level = 'B2';
} else {
    $level = 'C1';
}

try {
    $stmt = $pdo->prepare("UPDATE Users SET Level = ? WHERE Id = ?");
    $stmt->execute([$level, $userId]);

    echo json_encode([
        'status' => 'success',
        'level' => $level,
        'message' => "Seviyeniz belirlendi: $level"
    ]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Veritabanı hatası: ' . $e->getMessage()]);
}
