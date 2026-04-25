<?php
require_once '../conn.php';
require_once '../auth_middleware.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit(json_encode(['status' => 'error', 'message' => 'Sadece GET istekleri kabul edilir.']));
}

$userData = authenticate();

try {
    $stmt = $pdo->prepare("
        SELECT u.Id, u.Name, u.Surname, u.Email, u.UserName, u.DailyWord, u.StreakDays,
               n.LangName as NativeLanguage, t.LangName as TargetLanguage,
               u.NativeLangId, u.CurrentTargetLangId
        FROM Users u
        LEFT JOIN Languages n ON u.NativeLangId = n.Id
        LEFT JOIN Languages t ON u.CurrentTargetLangId = t.Id
        WHERE u.Id = ?
    ");
    $stmt->execute([$userData['userId']]);
    $user = $stmt->fetch();

    if ($user) {
        echo json_encode(['status' => 'success', 'user' => $user]);
    } else {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Kullanici bulunamadi.']);
    }
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Sunucu hatasi.']);
}
?>