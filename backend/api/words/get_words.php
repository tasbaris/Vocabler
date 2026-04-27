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
    $sql = "
        SELECT 
            w.Id, w.Level, w.CategoryId, w.Picture, w.AddedById,
            wt_en.Translation as EnglishTranslation, wt_en.Pronunciation, wt_en.WordType,
            wt_tr.Translation as TurkishTranslation,
            ws.SampleText as SampleSentence
        FROM Words w
        LEFT JOIN WordTranslations wt_en ON w.Id = wt_en.WordId AND wt_en.LangId = 2
        LEFT JOIN WordTranslations wt_tr ON w.Id = wt_tr.WordId AND wt_tr.LangId = 1
        LEFT JOIN WordSamples ws ON w.Id = ws.WordId AND ws.LangId = 2
        WHERE w.Active = 1
        ORDER BY w.Id DESC
    ";
    
    $stmt = $pdo->query($sql);
    $words = $stmt->fetchAll();
    
    echo json_encode(['status' => 'success', 'words' => $words]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Sunucu hatası: ' . $e->getMessage()]);
}
?>