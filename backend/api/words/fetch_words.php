<?php
require_once '../conn.php';
require_once '../auth_middleware.php';

header('Content-Type: application/json');

$userData = authenticate();
$userId = $userData['userId'];
$mode = $_GET['mode'] ?? 'all'; // 'all' (tüm liste) veya 'daily' (o günkü quiz)

try {
    if ($mode === 'daily') {
        // SRS algoritmasına göre o günkü kelimeler
        $stmt = $pdo->prepare("CALL sp_GetDailyWords(:userId)");
        $stmt->execute(['userId' => $userId]);
    } else {
        // Tüm kelime listesi (Genel Havuz)
        $stmt = $pdo->prepare("
            SELECT 
                w.Id, w.CategoryId, w.Picture, w.AddedById,
                wt_en.Translation as EnglishTranslation, wt_en.Pronunciation, wt_en.WordType, wt_en.Level,
                wt_tr.Translation as TurkishTranslation,
                ws.SampleText as SampleSentence, ws.TranslatedText as SampleTranslation
            FROM Words w
            LEFT JOIN WordTranslations wt_en ON w.Id = wt_en.WordId AND wt_en.LangId = 2
            LEFT JOIN WordTranslations wt_tr ON w.Id = wt_tr.WordId AND wt_tr.LangId = 1
            LEFT JOIN WordSamples ws ON w.Id = ws.WordId AND ws.LangId = 2
            WHERE w.Active = 1
            ORDER BY w.Id DESC
        ");
        $stmt->execute();
    }
    
    $words = $stmt->fetchAll();
    echo json_encode(['status' => 'success', 'data' => $words]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Sunucu hatası.']);
}
?>