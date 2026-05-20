<?php
require_once '../conn.php';
require_once '../auth_middleware.php';

header('Content-Type: application/json; charset=utf-8');

$userData = authenticate();
$userId = $userData['userId'];
$mode = $_GET['mode'] ?? 'all'; 
$categoryId = $_GET['category'] ?? null;

try {
    $stmtUser = $pdo->prepare("SELECT NativeLangId, CurrentTargetLangId FROM Users WHERE Id = ?");
    $stmtUser->execute([$userId]);
    $userLangs = $stmtUser->fetch();
    $nativeLangId = $userLangs['NativeLangId'] ?? 1;
    $targetLangId = $userLangs['CurrentTargetLangId'] ?? 2;

    if ($mode === 'daily') {
        $stmt = $pdo->prepare("CALL sp_GetDailyWords(:userId)");
        $stmt->execute(['userId' => $userId]);
        $words = $stmt->fetchAll();
        echo json_encode(['status' => 'success', 'words' => $words]);
    } else {
        $query = "
            SELECT 
                w.Id, w.CategoryId, w.Picture, w.AddedById,
                wt_target.Translation as EnglishTranslation, wt_target.Pronunciation, wt_target.WordType, wt_target.Level,
                wt_native.Translation as TurkishTranslation,
                ws.SampleText as SampleSentence, ws.TranslatedText as SampleTranslation,
                uw.LearnRank, uw.Status as SRSStatus,
                c.CategoryName
            FROM Words w
            INNER JOIN UserWords uw ON w.Id = uw.WordId AND uw.UserId = :userId
            LEFT JOIN WordTranslations wt_target ON w.Id = wt_target.WordId AND wt_target.LangId = :t1
            LEFT JOIN WordTranslations wt_native ON w.Id = wt_native.WordId AND wt_native.LangId = :n1
            LEFT JOIN WordSamples ws ON w.Id = ws.WordId AND ws.LangId = :t2
            LEFT JOIN Categories c ON w.CategoryId = c.Id
            WHERE w.Active = 1
        ";
        
        $params = [
            'userId' => $userId,
            't1' => $targetLangId,
            'n1' => $nativeLangId,
            't2' => $targetLangId
        ];
        
        if ($categoryId) {
            $query .= " AND w.CategoryId = :categoryId";
            $params['categoryId'] = $categoryId;
        }
        
        $query .= " ORDER BY w.Id DESC";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $words = $stmt->fetchAll();
        echo json_encode(['status' => 'success', 'words' => $words]);
    }
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Veritabanı hatası: ' . $e->getMessage()]);
}
?>