<?php
require_once '../conn.php';
require_once '../auth_middleware.php';

header('Content-Type: application/json; charset=utf-8');

$userData = authenticate();
$userId = $userData['userId'];

try {
    // 1. Önce günlük kelime ID'lerini alıyoruz
    $stmt = $pdo->prepare("CALL sp_GetDailyWords(?)");
    $stmt->execute([$userId]);
    $rawWords = $stmt->fetchAll();

    // ÖNEMLİ: CALL işleminden sonra dönen result set'i kapatıyoruz ki
    // "Cannot execute queries while there are pending result sets" hatası almayalım.
    $stmt->closeCursor();

    $quizWords = [];
    if (!empty($rawWords)) {
        foreach ($rawWords as $row) {
            // Her kelime için detayları (çeviriler ve örnekler) çek
            $stmtDetails = $pdo->prepare("
                SELECT
                    wt_target.Translation as TargetWord,
                    wt_target.Pronunciation,
                    wt_target.WordType,
                    wt_target.Level,
                    wt_native.Translation as SourceWord,
                    ws.SampleText as SampleSentence,
                    ws.TranslatedText as SampleTranslation,
                    w.Picture
                FROM Words w
                LEFT JOIN WordTranslations wt_target ON w.Id = wt_target.WordId AND wt_target.LangId = :t1
                LEFT JOIN WordTranslations wt_native ON w.Id = wt_native.WordId AND wt_native.LangId = :n1
                LEFT JOIN WordSamples ws ON w.Id = ws.WordId AND ws.LangId = :t2
                WHERE w.Id = :wordId
            ");
            $stmtDetails->execute([
                't1' => $row['TargetLangId'],
                'n1' => $row['SourceLangId'],
                't2' => $row['TargetLangId'],
                'wordId' => $row['WordId']
            ]);
            $details = $stmtDetails->fetch();

            if ($details) {
                $details['WordId'] = $row['WordId'];
                $quizWords[] = $details;
            }
            $stmtDetails->closeCursor();
        }
    }

    echo json_encode(['status' => 'success', 'data' => $quizWords]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Veritabanı hatası: ' . $e->getMessage()]);
}
