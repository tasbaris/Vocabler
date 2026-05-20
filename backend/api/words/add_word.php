<?php
require_once '../conn.php';
require_once '../auth_middleware.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['status' => 'error', 'message' => 'Sadece POST istekleri kabul edilir.']));
}

$userData = authenticate();
$userId = $userData['userId'];

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

if (empty($input['mainWord']) || empty($input['targetWord']) || empty($input['wordLevel']) || empty($input['wordCategory']) || empty($input['wordType'])) {
    http_response_code(400);
    exit(json_encode(['status' => 'error', 'message' => 'Gerekli alanlar eksik.']));
}

try {
    $pdo->beginTransaction();

    $picture = null;
    if (isset($_FILES['wordPicture']) && $_FILES['wordPicture']['error'] == 0) {
        $uploadDir = '../uploads/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        $filename = time() . '_' . basename($_FILES['wordPicture']['name']);
        $targetFilePath = $uploadDir . $filename;
        if (move_uploaded_file($_FILES['wordPicture']['tmp_name'], $targetFilePath)) {
            $picture = 'uploads/' . $filename;
        }
    } else if (isset($input['wordPicture']) && is_string($input['wordPicture'])) {
        $picture = $input['wordPicture'];
    }

    // Kullanıcının dillerini al
    $stmtUser = $pdo->prepare("SELECT NativeLangId, CurrentTargetLangId FROM Users WHERE Id = ?");
    $stmtUser->execute([$userId]);
    $userLangs = $stmtUser->fetch();
    $nativeLangId = $userLangs['NativeLangId'] ?? 1;
    $targetLangId = $userLangs['CurrentTargetLangId'] ?? 2;

    // 1. Words tablosuna ekle
    $stmt = $pdo->prepare("INSERT INTO Words (CategoryId, Picture, AddedById, Active) VALUES (?, ?, ?, 1)");
    $stmt->execute([$input['wordCategory'], $picture, $userId]);
    
    $wordId = $pdo->lastInsertId();

    // 2. WordTranslations tablosuna Hedef Dil ekle
    $stmtTarget = $pdo->prepare("INSERT INTO WordTranslations (WordId, LangId, Level, WordType, Translation, Pronunciation) VALUES (?, ?, ?, ?, ?, ?)");
    $stmtTarget->execute([$wordId, $targetLangId, $input['wordLevel'], $input['wordType'], trim($input['mainWord']), $input['wordPronunciation'] ?? null]);

    // 3. WordTranslations tablosuna Ana Dil ekle
    $stmtNative = $pdo->prepare("INSERT INTO WordTranslations (WordId, LangId, Level, WordType, Translation, Pronunciation) VALUES (?, ?, ?, ?, ?, ?)");
    $stmtNative->execute([$wordId, $nativeLangId, $input['wordLevel'], $input['wordType'], trim($input['targetWord']), null]); 

    // 4. Örnek cümle varsa WordSamples'a ekle (Hedef Dil örnek)
    if (!empty($input['wordSentence'])) {
        $stmtSample = $pdo->prepare("INSERT INTO WordSamples (WordId, LangId, SampleText, TranslatedText) VALUES (?, ?, ?, ?)");
        $stmtSample->execute([$wordId, $targetLangId, trim($input['wordSentence']), $input['wordSentenceTurkish'] ?? null]);
    }

    $pdo->commit();
    echo json_encode(['status' => 'success', 'message' => 'Kelime başarıyla eklendi.', 'wordId' => $wordId]);
} catch (\PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Sunucu hatası: ' . $e->getMessage()]);
}
?>