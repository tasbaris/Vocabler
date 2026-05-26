<?php
require_once '../conn.php';
require_once '../auth_middleware.php';

header('Content-Type: application/json');

$userData = authenticate();
$userId = $userData['userId'];

try {
    // 1. Temel Profil Bilgileri
    $stmtProfile = $pdo->prepare("
        SELECT u.Id, u.Name, u.Surname, u.Email, u.UserName, u.DailyWord, u.Level, u.StreakDays,
               n.LangName as NativeLanguage, t.LangName as TargetLanguage,
               u.NativeLangId, u.CurrentTargetLangId
        FROM Users u
        LEFT JOIN Languages n ON u.NativeLangId = n.Id
        LEFT JOIN Languages t ON u.CurrentTargetLangId = t.Id
        WHERE u.Id = ?
    ");
    $stmtProfile->execute([$userId]);
    $profile = $stmtProfile->fetch();

    // 2. Analiz Raporu (Kategori bazlı)
    $stmtStats = $pdo->prepare("CALL sp_GetUserStats(:userId)");
    $stmtStats->execute(['userId' => $userId]);
    $stats = $stmtStats->fetchAll();
    $stmtStats->closeCursor();

    // 3. Genel Özet İstatistikleri (Dashboard için)
    $stmtSummary = $pdo->prepare("CALL sp_GetDashboardSummary(?)");
    $stmtSummary->execute([$userId]);
    $summary = $stmtSummary->fetch();
    $stmtSummary->closeCursor();

    echo json_encode([
        'status' => 'success',
        'user' => $profile,
        'analysis' => $stats,
        'summary' => $summary
    ]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Veritabanı hatası: ' . $e->getMessage()]);
}
