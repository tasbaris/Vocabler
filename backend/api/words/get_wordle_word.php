<?php
require_once '../conn.php';
require_once '../auth_middleware.php';

header('Content-Type: application/json; charset=utf-8');

$userData = authenticate();
$userId = $userData['userId'];

// If length is not provided, pick a random length between 4 and 7
if (!isset($_GET['length'])) {
    $lengths = [4, 5, 6, 7];
    $length = $lengths[array_rand($lengths)];
} else {
    $length = (int)$_GET['length'];
}

try {
    $stmtUser = $pdo->prepare("SELECT NativeLangId, CurrentTargetLangId FROM Users WHERE Id = ?");
    $stmtUser->execute([$userId]);
    $userLangs = $stmtUser->fetch();
    $nativeLangId = $userLangs['NativeLangId'] ?? 1;
    $targetLangId = $userLangs['CurrentTargetLangId'] ?? 2;

    $query = "
        SELECT wt_target.Translation as word,
               ws.SampleText as sentence,
               ws.TranslatedText as sentence_translated,
               c.CategoryName as category,
               wt_target.WordType as type
        FROM UserWords uw
        INNER JOIN Words w ON uw.WordId = w.Id
        INNER JOIN WordTranslations wt_target ON w.Id = wt_target.WordId AND wt_target.LangId = :targetLangId
        LEFT JOIN Categories c ON w.CategoryId = c.Id
        LEFT JOIN WordSamples ws ON w.Id = ws.WordId AND ws.TargetLangId = :targetLangId2 AND ws.NativeLangId = :nativeLangId
        WHERE uw.UserId = :userId
          AND CHAR_LENGTH(wt_target.Translation) = :length
          AND w.Active = 1
        ORDER BY RAND()
        LIMIT 1
    ";

    $params = [
        'targetLangId' => $targetLangId,
        'targetLangId2' => $targetLangId,
        'nativeLangId' => $nativeLangId,
        'length' => $length,
        'userId' => $userId
    ];

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $result = $stmt->fetch();

    if ($result) {
        $word = strtoupper($result['word']);

        $category = $result['category'] ?? "General";
        $type = $result['type'] ?? "Unknown";

        // Localize type if native language is Turkish
        if ($nativeLangId == 1) {
            $typeMap = [
                'Noun' => 'İsim',
                'Verb' => 'Fiil',
                'Adjective' => 'Sıfat',
                'Adj' => 'Sıfat',
                'Adverb' => 'Zarf',
                'Adv' => 'Zarf',
                'Conjunction' => 'Bağlaç',
                'Conj' => 'Bağlaç',
                'Phrase' => 'Kalıp'
            ];
            if (isset($typeMap[$type])) {
                $type = $typeMap[$type];
            }
        }

        // Final hint format as requested: Category|Type
        $hint = "$category|$type";

        echo json_encode([
            'status' => 'success',
            'word' => $word,
            'hint' => $hint
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'No word found for this length.']);
    }
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Veritabanı hatası: ' . $e->getMessage()]);
}
