<?php
require_once '../conn.php';
require_once '../auth_middleware.php';

header('Content-Type: application/json; charset=utf-8');

$userData = authenticate();
$userId = $userData['userId'];
$length = isset($_GET['length']) ? (int)$_GET['length'] : 5;

try {
    $stmtUser = $pdo->prepare("SELECT CurrentTargetLangId FROM Users WHERE Id = ?");
    $stmtUser->execute([$userId]);
    $userLangs = $stmtUser->fetch();
    $targetLangId = $userLangs['CurrentTargetLangId'] ?? 2;

    $query = "
        SELECT wt_target.Translation as word, 
               ws.SampleText as sentence,
               c.CategoryName as category,
               wt_target.WordType as type
        FROM UserWords uw
        INNER JOIN Words w ON uw.WordId = w.Id
        INNER JOIN WordTranslations wt_target ON w.Id = wt_target.WordId AND wt_target.LangId = :langId
        LEFT JOIN Categories c ON w.CategoryId = c.Id
        LEFT JOIN WordSamples ws ON w.Id = ws.WordId AND ws.LangId = :langId2
        WHERE uw.UserId = :userId 
          AND CHAR_LENGTH(wt_target.Translation) = :length 
          AND w.Active = 1
        ORDER BY RAND()
        LIMIT 1
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([
        'langId' => $targetLangId, 
        'langId2' => $targetLangId, 
        'length' => $length, 
        'userId' => $userId
    ]);
    $result = $stmt->fetch();

    if (!$result) {
        // Fallback to general words
        $fallbackQuery = "
            SELECT wt_target.Translation as word, 
                   ws.SampleText as sentence,
                   c.CategoryName as category,
                   wt_target.WordType as type
            FROM WordTranslations wt_target
            INNER JOIN Words w ON wt_target.WordId = w.Id
            LEFT JOIN Categories c ON w.CategoryId = c.Id
            LEFT JOIN WordSamples ws ON w.Id = ws.WordId AND ws.LangId = :langId2
            WHERE wt_target.LangId = :langId 
              AND CHAR_LENGTH(wt_target.Translation) = :length 
              AND w.Active = 1
            ORDER BY RAND()
            LIMIT 1
        ";
        $stmtFallback = $pdo->prepare($fallbackQuery);
        $stmtFallback->execute([
            'langId' => $targetLangId, 
            'langId2' => $targetLangId, 
            'length' => $length
        ]);
        $result = $stmtFallback->fetch();
    }

    if ($result) {
        $word = strtoupper($result['word']);
        $hint = "";
        
        if (!empty($result['sentence'])) {
            // Replace the word in the sentence with underscores
            $pattern = "/\b" . preg_quote($result['word'], '/') . "\b/i";
            $hint = preg_replace($pattern, str_repeat("_", strlen($word)), $result['sentence']);
        } else {
            // Fallback hint using category and type
            $hint = "Kategori: " . ($result['category'] ?? "Genel") . " | Tür: " . ($result['type'] ?? "Bilinmiyor");
        }

        echo json_encode([
            'status' => 'success', 
            'word' => $word,
            'hint' => $hint
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Bu uzunlukta kelime bulunamadı.']);
    }
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Veritabanı hatası: ' . $e->getMessage()]);
}
?>