<?php
require_once '../conn.php';
require_once '../auth_middleware.php';

header('Content-Type: application/json; charset=utf-8');

$userData = authenticate();
$userId = $userData['userId'];
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;

try {
    // 1. Get user languages
    $stmtUser = $pdo->prepare("SELECT NativeLangId, CurrentTargetLangId FROM Users WHERE Id = ?");
    $stmtUser->execute([$userId]);
    $user = $stmtUser->fetch();
    
    if (!$user) {
        echo json_encode(['status' => 'error', 'message' => 'User not found.']);
        exit;
    }
    
    $nativeLangId = $user['NativeLangId'];
    $targetLangId = $user['CurrentTargetLangId'];

    // 2. Fetch words that need review according to SRS
    // sp_GetDailyWords returns words where NextReviewDate <= NOW or Status = 0
    $stmtSrs = $pdo->prepare("CALL sp_GetDailyWords(?)");
    $stmtSrs->execute([$userId]);
    $srsWords = $stmtSrs->fetchAll(PDO::FETCH_ASSOC);
    $stmtSrs->closeCursor();

    if (empty($srsWords)) {
        echo json_encode([
            'status' => 'success',
            'data' => [],
            'message' => 'Bugünlük tüm kelimelerini tamamladın!'
        ]);
        exit;
    }

    $questions = [];
    foreach ($srsWords as $row) {
        $wordId = $row['WordId'];

        // Fetch full details for the word
        $stmtDetails = $pdo->prepare("
            SELECT w.Picture, wt_target.Translation as TargetWord, wt_native.Translation as NativeWord, wt_target.Level, wt_target.WordType
            FROM Words w
            INNER JOIN WordTranslations wt_target ON w.Id = wt_target.WordId AND wt_target.LangId = :tLang
            INNER JOIN WordTranslations wt_native ON w.Id = wt_native.WordId AND wt_native.LangId = :nLang
            WHERE w.Id = :wordId
        ");
        $stmtDetails->execute([
            'tLang' => $targetLangId,
            'nLang' => $nativeLangId,
            'wordId' => $wordId
        ]);
        $word = $stmtDetails->fetch(PDO::FETCH_ASSOC);
        
        if (!$word) continue;

        // Create a question
        $type = (rand(0, 1) && !empty($word['Picture'])) ? 'Image' : 'Word';

        $questionText = "";
        $imageUrl = null;
        $correctAnswer = "";

        if ($type === 'Image') {
            $questionText = "Bu görseldeki kelime nedir?";
            $imageUrl = $word['Picture'];
            $correctAnswer = $word['TargetWord'];
        } else {
            // Randomly ask native -> target or target -> native
            if (rand(0, 1)) {
                $questionText = $word['NativeWord'];
                $correctAnswer = $word['TargetWord'];
            } else {
                $questionText = $word['TargetWord'];
                $correctAnswer = $word['NativeWord'];
            }
        }

        // Get distractors
        $stmtDist = $pdo->prepare("
            SELECT Translation 
            FROM WordTranslations 
            WHERE LangId = :langId AND Translation != :correct 
            ORDER BY RAND() 
            LIMIT 3
        ");
        $distLangId = ($correctAnswer === $word['NativeWord']) ? $nativeLangId : $targetLangId;
        $stmtDist->execute(['langId' => $distLangId, 'correct' => $correctAnswer]);
        $distractors = $stmtDist->fetchAll(PDO::FETCH_COLUMN);

        $options = array_merge([$correctAnswer], $distractors);
        shuffle($options);

        $questions[] = [
            'Id' => $wordId,
            'WordId' => $wordId,
            'QuestionType' => 'Multiple Choice',
            'QuestionText' => $questionText,
            'ImageUrl' => $imageUrl,
            'Options' => $options,
            'CorrectAnswer' => $correctAnswer,
            'Level' => $word['Level'],
            'Pronunciation' => '' // We can add this if available
        ];

        if (count($questions) >= $limit) break;
    }

    echo json_encode([
        'status' => 'success',
        'data' => $questions
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>