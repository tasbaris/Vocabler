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
    } else if (isset($input['wordPicture']) && is_string($input['wordPicture'])) {
        $updateWords[] = "Picture = ?";
        $paramsWords[] = $input['wordPicture'];
    }
    
    if (!empty($updateWords)) {
        $paramsWords[] = $input['wordId'];
        $stmt = $pdo->prepare("UPDATE Words SET " . implode(", ", $updateWords) . " WHERE Id = ?");
        $stmt->execute($paramsWords);
    }

    // 2. WordTranslations (İngilizce & Türkçe - Level ve WordType ikisi için de ortak)
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

    // İngilizce spesifik
    if (isset($input['wordEnglish']) || isset($input['wordPronunciation'])) {
        $upEn = []; $pEn = [];
        if (isset($input['wordEnglish'])) { $upEn[] = "Translation = ?"; $pEn[] = trim($input['wordEnglish']); }
        if (isset($input['wordPronunciation'])) { $upEn[] = "Pronunciation = ?"; $pEn[] = $input['wordPronunciation']; }
        $pEn[] = $input['wordId'];
        $pdo->prepare("UPDATE WordTranslations SET " . implode(", ", $upEn) . " WHERE WordId = ? AND LangId = 2")->execute($pEn);
    }

    // Türkçe spesifik
    if (isset($input['wordTurkish'])) {
        $pdo->prepare("UPDATE WordTranslations SET Translation = ? WHERE WordId = ? AND LangId = 1")->execute([trim($input['wordTurkish']), $input['wordId']]);
    }

    // 4. WordSamples
    if (isset($input['wordSentence']) || isset($input['wordSentenceTurkish'])) {
        $stmtCheckSample = $pdo->prepare("SELECT Id FROM WordSamples WHERE WordId = ? AND LangId = 2");
        $stmtCheckSample->execute([$input['wordId']]);
        if ($stmtCheckSample->fetch()) {
            $upSamp = []; $pSamp = [];
            if (isset($input['wordSentence'])) { $upSamp[] = "SampleText = ?"; $pSamp[] = trim($input['wordSentence']); }
            if (isset($input['wordSentenceTurkish'])) { $upSamp[] = "TranslatedText = ?"; $pSamp[] = trim($input['wordSentenceTurkish']); }
            $pSamp[] = $input['wordId'];
            $pdo->prepare("UPDATE WordSamples SET " . implode(", ", $upSamp) . " WHERE WordId = ? AND LangId = 2")->execute($pSamp);
        } else {
            $stmtSample = $pdo->prepare("INSERT INTO WordSamples (WordId, LangId, SampleText, TranslatedText) VALUES (?, 2, ?, ?)");
            $stmtSample->execute([$input['wordId'], trim($input['wordSentence'] ?? ''), $input['wordSentenceTurkish'] ?? null]);
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
?>