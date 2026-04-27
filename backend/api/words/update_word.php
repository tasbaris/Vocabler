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
    if (isset($input['wordLevel'])) { $updateWords[] = "Level = ?"; $paramsWords[] = $input['wordLevel']; }
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

    // 2. WordTranslations (İngilizce)
    $updateEn = [];
    $paramsEn = [];
    if (isset($input['wordEnglish'])) { $updateEn[] = "Translation = ?"; $paramsEn[] = trim($input['wordEnglish']); }
    if (isset($input['wordType'])) { $updateEn[] = "WordType = ?"; $paramsEn[] = $input['wordType']; }
    if (isset($input['wordPronunciation'])) { $updateEn[] = "Pronunciation = ?"; $paramsEn[] = $input['wordPronunciation']; }
    
    if (!empty($updateEn)) {
        $paramsEn[] = $input['wordId'];
        $stmtEn = $pdo->prepare("UPDATE WordTranslations SET " . implode(", ", $updateEn) . " WHERE WordId = ? AND LangId = 2");
        $stmtEn->execute($paramsEn);
    }

    // 3. WordTranslations (Türkçe)
    $updateTr = [];
    $paramsTr = [];
    if (isset($input['wordTurkish'])) { $updateTr[] = "Translation = ?"; $paramsTr[] = trim($input['wordTurkish']); }
    if (isset($input['wordType'])) { $updateTr[] = "WordType = ?"; $paramsTr[] = $input['wordType']; }
    
    if (!empty($updateTr)) {
        $paramsTr[] = $input['wordId'];
        $stmtTr = $pdo->prepare("UPDATE WordTranslations SET " . implode(", ", $updateTr) . " WHERE WordId = ? AND LangId = 1");
        $stmtTr->execute($paramsTr);
    }

    // 4. WordSamples
    if (isset($input['wordSentence'])) {
        $stmtCheckSample = $pdo->prepare("SELECT Id FROM WordSamples WHERE WordId = ? AND LangId = 2");
        $stmtCheckSample->execute([$input['wordId']]);
        if ($stmtCheckSample->fetch()) {
            $stmtSample = $pdo->prepare("UPDATE WordSamples SET SampleText = ? WHERE WordId = ? AND LangId = 2");
            $stmtSample->execute([trim($input['wordSentence']), $input['wordId']]);
        } else {
            $stmtSample = $pdo->prepare("INSERT INTO WordSamples (WordId, LangId, SampleText) VALUES (?, 2, ?)");
            $stmtSample->execute([$input['wordId'], trim($input['wordSentence'])]);
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