<?php
require_once '../conn.php';
require_once '../auth_middleware.php';

header('Content-Type: application/json; charset=utf-8');

$userData = authenticate();
$userId = $userData['userId'];

try {
    // 1. Get user preferences
    $stmtUser = $pdo->prepare("SELECT NativeLangId, CurrentTargetLangId, DailyWord FROM Users WHERE Id = ?");
    $stmtUser->execute([$userId]);
    $user = $stmtUser->fetch();

    if (!$user) {
        echo json_encode(['status' => 'error', 'message' => 'User not found.']);
        exit;
    }

    $nativeLangId = $user['NativeLangId'];
    $targetLangId = $user['CurrentTargetLangId'];

    // 2. Fetch words for today's quiz
    // This procedure now correctly returns ALL overdue reviews + remaining new words for the daily quota.
    $stmtSrs = $pdo->prepare("CALL sp_GetDailyWords(?)");
    $stmtSrs->execute([$userId]);
    $srsWords = $stmtSrs->fetchAll(PDO::FETCH_ASSOC);
    $stmtSrs->closeCursor();

    // 3. Check if quiz is already completed for today
    // If sp_GetDailyWords is empty AND the user has had some activity today, show quota reached.
    if (empty($srsWords)) {
        // Check if any word was learned today
        $stmtActivity = $pdo->prepare("SELECT COUNT(*) FROM UserWords WHERE UserId = ? AND DATE(LastLearnDate) = CURDATE()");
        $stmtActivity->execute([$userId]);
        $activityCount = (int)$stmtActivity->fetchColumn();

        if ($activityCount > 0) {
            $now = new DateTime();
            $tomorrow = new DateTime('tomorrow');
            $diff = $now->diff($tomorrow);

            echo json_encode([
                'status' => 'quota_reached',
                'message' => 'Bugünlük tüm kelimelerini tamamladın!',
                'countdown' => [
                    'hours' => $diff->h,
                    'minutes' => $diff->i,
                    'seconds' => $diff->s
                ]
            ]);
            exit;
        } else {
            echo json_encode([
                'status' => 'success',
                'data' => [],
                'message' => 'Şu an çalışacak yeni kelime yok. Kelime havuzuna yeni kelimeler ekleyebilirsin!'
            ]);
            exit;
        }
    }

    $questions = [];
    foreach ($srsWords as $row) {
        $wordId = $row['WordId'];
        $learnRank = (int)$row['LearnRank'];

        $stmtDetails = $pdo->prepare("
            SELECT w.Picture, wt_target.Translation as TargetWord, wt_native.Translation as NativeWord, wt_target.Level, wt_target.WordType,
                   COALESCE(
                       (SELECT SampleText FROM WordSamples WHERE WordId = w.Id AND TargetLangId = :tLang1 LIMIT 1),
                       (SELECT SampleText FROM WordSamples WHERE WordId = w.Id LIMIT 1)
                   ) as SampleText,
                   COALESCE(
                       (SELECT TranslatedText FROM WordSamples WHERE WordId = w.Id AND TargetLangId = :tLang2 LIMIT 1),
                       (SELECT TranslatedText FROM WordSamples WHERE WordId = w.Id LIMIT 1)
                   ) as TranslatedText
            FROM Words w
            INNER JOIN WordTranslations wt_target ON w.Id = wt_target.WordId AND wt_target.LangId = :tLang3
            INNER JOIN WordTranslations wt_native ON w.Id = wt_native.WordId AND wt_native.LangId = :nLang
            WHERE w.Id = :wordId
        ");
        $stmtDetails->execute([
            'tLang1' => $targetLangId,
            'tLang2' => $targetLangId,
            'tLang3' => $targetLangId,
            'nLang' => $nativeLangId,
            'wordId' => $wordId
        ]);
        $word = $stmtDetails->fetch(PDO::FETCH_ASSOC);

        if (!$word) {
            continue;
        }

        // Fetch language names for dynamic question text
        $stmtLangs = $pdo->prepare("SELECT Id, LangName FROM Languages WHERE Id IN (?, ?)");
        $stmtLangs->execute([$nativeLangId, $targetLangId]);
        $langNames = $stmtLangs->fetchAll(PDO::FETCH_KEY_PAIR);
        $targetLangName = $langNames[$targetLangId] ?? 'Target Language';
        $nativeLangName = $langNames[$nativeLangId] ?? 'Native Language';

        $type = 'Multiple Choice';
        if ($learnRank == 0) {
            $type = 'Flashcard';
        } elseif ($learnRank == 1 && !empty($word['Picture'])) {
            $type = 'Image';
        }

        $questionText = "";
        $imageUrl = null;
        $correctAnswer = "";
        $options = [];

        if ($type === 'Flashcard') {
            if (rand(0, 1)) {
                $questionText = $word['NativeWord'];
                $correctAnswer = $word['TargetWord'];
            } else {
                $questionText = $word['TargetWord'];
                $correctAnswer = $word['NativeWord'];
            }
            $imageUrl = $word['Picture'];
        } else {
            $isImageQuestion = ($type === 'Image');
            if ($isImageQuestion) {
                // Localized question text for image
                $questionText = ($nativeLangId == 1) ? "Bu görseldeki kelimenin $targetLangName karşılığı nedir?" : "What is the $targetLangName word for this image?";
                $imageUrl = $word['Picture'];
                $correctAnswer = $word['TargetWord'];
                $type = 'Multiple Choice';
            } else {
                if (rand(0, 1)) {
                    $questionText = $word['NativeWord'];
                    $prompt = ($nativeLangId == 1) ? "Bu kelimenin $targetLangName karşılığı nedir?" : "What is the $targetLangName word for this?";
                    $correctAnswer = $word['TargetWord'];
                } else {
                    $questionText = $word['TargetWord'];
                    $prompt = ($nativeLangId == 1) ? "Bu kelimenin $nativeLangName karşılığı nedir?" : "What is the $nativeLangName word for this?";
                    $correctAnswer = $word['NativeWord'];
                }
                $questionText = "<small class='opacity-50 d-block mb-2' style='font-size: 0.9rem;'>$prompt</small> " . $questionText;
            }

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
        }

        $questions[] = [
            'Id' => $wordId,
            'WordId' => $wordId,
            'QuestionType' => $type,
            'QuestionText' => $questionText,
            'ImageUrl' => $imageUrl,
            'Options' => $options,
            'CorrectAnswer' => $correctAnswer,
            'Level' => $word['Level'],
            'Explanation' => $word['SampleText'] ?: "",
            'SampleTranslation' => $word['TranslatedText'] ?: "",
            'Pronunciation' => ''
        ];
    }

    echo json_encode([
        'status' => 'success',
        'data' => $questions
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
