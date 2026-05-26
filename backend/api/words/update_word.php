<?php
require_once '../conn.php';
require_once '../auth_middleware.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    exit(json_encode(['status' => 'error', 'message' => 'Sadece POST veya PUT istekleri kabul edilir.']));
}

$userData = authenticate();
$userId = $userData['userId'];

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

if (empty($input['wordId'])) {
    http_response_code(400);
    exit(json_encode(['status' => 'error', 'message' => 'wordId zorunludur.']));
}

try {
    // Kelimenin kullanıcıya ait olduğunu kontrol et
    $stmtCheck = $pdo->prepare("SELECT AddedById FROM Words WHERE Id = ?");
    $stmtCheck->execute([$input['wordId']]);
    $word = $stmtCheck->fetch();

    if (!$word) {
        http_response_code(404);
        exit(json_encode(['status' => 'error', 'message' => 'Kelime bulunamadı.']));
    }

    if ($word['AddedById'] != $userId) {
        http_response_code(403);
        exit(json_encode(['status' => 'error', 'message' => 'Sadece kendi eklediğiniz kelimeleri güncelleyebilirsiniz.']));
    }

    // Kullanıcının dillerini al
    $stmtUser = $pdo->prepare("SELECT NativeLangId, CurrentTargetLangId FROM Users WHERE Id = ?");
    $stmtUser->execute([$userId]);
    $userLangs = $stmtUser->fetch();
    $nativeLangId = $userLangs['NativeLangId'] ?? 1;
    $targetLangId = $userLangs['CurrentTargetLangId'] ?? 2;

    $pdo->beginTransaction();

    // 1. Words tablosunu güncelle
    $updateWords = [];
    $paramsWords = [];
    if (isset($input['wordCategory'])) { $updateWords[] = "CategoryId = ?"; $paramsWords[] = $input['wordCategory']; }

    // Resim güncellemesi
    if (isset($_FILES['wordPicture']) && $_FILES['wordPicture']['error'] == 0) {
        $uploadDir = '../uploads/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        $filename = time() . '_' . basename($_FILES['wordPicture']['name']);
        $targetFilePath = $uploadDir . $filename;
        if (move_uploaded_file($_FILES['wordPicture']['tmp_name'], $targetFilePath)) {
            $updateWords[] = "Picture = ?";
            $paramsWords[] = 'uploads/' . $filename;
        }
    } else if (isset($input['removePicture']) && $input['removePicture'] == '1') {
        $updateWords[] = "Picture = NULL";
    } else if (isset($input['wordPicture']) && is_string($input['wordPicture'])) {
        $updateWords[] = "Picture = ?";
        $paramsWords[] = $input['wordPicture'];
    }

    if (!empty($updateWords)) {
        $paramsWords[] = $input['wordId'];
        $stmt = $pdo->prepare("UPDATE Words SET " . implode(", ", $updateWords) . " WHERE Id = ?");
        $stmt->execute($paramsWords);
    }

    // 2. WordTranslations (Hedef & Ana Dil - Level ve WordType ikisi için de ortak)
    $updateTrans = [];
    $paramsTrans = [];
    if (isset($input['wordLevel'])) { $updateTrans[] = "Level = ?"; $paramsTrans[] = $input['wordLevel']; }
    if (isset($input['wordType'])) { $updateTrans[] = "WordType = ?"; $paramsTrans[] = $input['wordType']; }

    if (!empty($updateTrans)) {
        $tempParams = $paramsTrans;
        $tempParams[] = $input['wordId'];
        $stmtTrans = $pdo->prepare("UPDATE WordTranslations SET " . implode(", ", $updateTrans) . " WHERE WordId = ?");
        $stmtTrans->execute($tempParams);
    }

    // Hedef Dil spesifik
    if (isset($input['mainWord']) || isset($input['wordPronunciation'])) {
        $upEn = []; $pEn = [];
        if (isset($input['mainWord'])) { $upEn[] = "Translation = ?"; $pEn[] = trim($input['mainWord']); }
        if (isset($input['wordPronunciation'])) { $upEn[] = "Pronunciation = ?"; $pEn[] = $input['wordPronunciation']; }
        $pEn[] = $input['wordId'];
        $pEn[] = $targetLangId;
        $pdo->prepare("UPDATE WordTranslations SET " . implode(", ", $upEn) . " WHERE WordId = ? AND LangId = ?")->execute($pEn);
    }

    // Ana Dil spesifik
    if (isset($input['targetWord'])) {
        $pdo->prepare("UPDATE WordTranslations SET Translation = ? WHERE WordId = ? AND LangId = ?")->execute([trim($input['targetWord']), $input['wordId'], $nativeLangId]);
    }

    // 4. WordSamples
    // Frontend'den 'sentences' (JSON string) gelebilir
    if (isset($input['sentences']) || isset($input['wordSentence'])) {
        $sentences = [];
        if (!empty($input['sentences'])) {
            $sentences = is_string($input['sentences']) ? json_decode($input['sentences'], true) : $input['sentences'];
        } else if (!empty($input['wordSentence'])) {
            $sentences[] = [
                'target' => $input['wordSentence'],
                'native' => $input['wordSentenceTurkish'] ?? ''
            ];
        }

        // Eski cümleleri sil (Basitlik için temizleyip yeniden ekliyoruz)
        $pdo->prepare("DELETE FROM WordSamples WHERE WordId = ? AND TargetLangId = ?")->execute([$input['wordId'], $targetLangId]);

        if (!empty($sentences)) {
            $stmtSample = $pdo->prepare("INSERT INTO WordSamples (WordId, TargetLangId, NativeLangId, SampleText, TranslatedText) VALUES (?, ?, ?, ?, ?)");
            foreach ($sentences as $s) {
                if (!empty($s['target'])) {
                    $stmtSample->execute([$input['wordId'], $targetLangId, $nativeLangId, trim($s['target']), $s['native'] ?? null]);
                }
            }
        }
    }

    $pdo->commit();
    echo json_encode(['status' => 'success', 'message' => 'Kelime başarıyla güncellendi.']);
} catch (\PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Sunucu hatası: ' . $e->getMessage()]);
}
