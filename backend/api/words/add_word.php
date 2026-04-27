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

if (empty($input['wordEnglish']) || empty($input['wordTurkish']) || empty($input['wordLevel']) || empty($input['wordCategory']) || empty($input['wordType'])) {
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

    // 1. Words tablosuna ekle
    $stmt = $pdo->prepare("INSERT INTO Words (Level, CategoryId, Picture, AddedById, Active) VALUES (?, ?, ?, ?, 1)");
    $stmt->execute([$input['wordLevel'], $input['wordCategory'], $picture, $userId]);
    
    $wordId = $pdo->lastInsertId();

    // 2. WordTranslations tablosuna İngilizce ekle (LangId = 2)
    $stmtEn = $pdo->prepare("INSERT INTO WordTranslations (WordId, LangId, WordType, Translation, Pronunciation) VALUES (?, 2, ?, ?, ?)");
    $stmtEn->execute([$wordId, $input['wordType'], trim($input['wordEnglish']), $input['wordPronunciation'] ?? null]);

    // 3. WordTranslations tablosuna Türkçe ekle (LangId = 1)
    $stmtTr = $pdo->prepare("INSERT INTO WordTranslations (WordId, LangId, WordType, Translation, Pronunciation) VALUES (?, 1, ?, ?, ?)");
    $stmtTr->execute([$wordId, $input['wordType'], trim($input['wordTurkish']), null]); 

    // 4. Örnek cümle varsa WordSamples'a ekle (İngilizce örnek, LangId = 2)
    if (!empty($input['wordSentence'])) {
        $stmtSample = $pdo->prepare("INSERT INTO WordSamples (WordId, LangId, SampleText) VALUES (?, 2, ?)");
        $stmtSample->execute([$wordId, trim($input['wordSentence'])]);
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