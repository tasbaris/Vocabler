<?php
require_once 'conn.php';

try {
    $pdo->beginTransaction();

    // 1. Tabloları temizle (Sırayla ilişkileri bozmadan)
    $pdo->exec("DELETE FROM WordSamples");
    $pdo->exec("DELETE FROM UserWords");
    $pdo->exec("DELETE FROM WordTranslations");
    $pdo->exec("DELETE FROM Questions");
    $pdo->exec("DELETE FROM Words");

    // 2. Kelimeleri yükle
    $wordsData = json_decode(file_get_contents('bulk_words.json'), true);

    // Words tablosu için hazırlık
    $stmtWord = $pdo->prepare("INSERT INTO Words (CategoryId, Active) VALUES (?, 1)");
    // WordTranslations için hazırlık
    $stmtTrans = $pdo->prepare("INSERT INTO WordTranslations (WordId, LangId, Level, WordType, Translation) VALUES (?, ?, ?, ?, ?)");
    // WordSamples için hazırlık
    $stmtSample = $pdo->prepare("INSERT INTO WordSamples (WordId, LangId, SampleText, TranslatedText) VALUES (?, ?, ?, ?)");

    foreach ($wordsData as $w) {
        $stmtWord->execute([$w['cat']]);
        $wordId = $pdo->lastInsertId();

        // İngilizce (LangId: 2)
        $stmtTrans->execute([$wordId, 2, $w['lvl'], $w['type'], $w['en']]);
        // Türkçe (LangId: 1)
        $stmtTrans->execute([$wordId, 1, $w['lvl'], $w['type'], $w['tr']]);

        // Örnek cümleler
        if (!empty($w['sentence'])) {
            $stmtSample->execute([$wordId, 2, $w['sentence'], $w['sentence_tr']]);
        }
    }

    // 3. Soruları yükle
    $questionsData = json_decode(file_get_contents('bulk_questions.json'), true);
    $stmtQ = $pdo->prepare("INSERT INTO Questions (WordId, SourceLangId, LangId, Level, QuestionType, QuestionText, Options, CorrectAnswer) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

    foreach ($questionsData as $q) {
        // WordId'yi kontrol et, eğer Words tablosunda yoksa NULL yap
        $checkStmt = $pdo->prepare("SELECT Id FROM Words WHERE Id = ?");
        $checkStmt->execute([$q['word_id']]);
        $exists = $checkStmt->fetch();
        $targetWordId = $exists ? $q['word_id'] : null;

        $stmtQ->execute([$targetWordId, 1, 2, 'A1', 'Multiple Choice', $q['question'], json_encode($q['options']), $q['answer']]);
    }

    $pdo->commit();
    echo "Başarıyla güncellendi.";
} catch (Exception $e) {
    $pdo->rollBack();
    echo "Hata: " . $e->getMessage();
}
