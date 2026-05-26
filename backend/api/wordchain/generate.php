<?php
require_once '../conn.php';
require_once '../auth_middleware.php';

define('CONTENT_TYPE_JSON', 'Content-Type: application/json; charset=utf-8');
header(CONTENT_TYPE_JSON);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['status' => 'error', 'message' => 'Only POST requests are allowed.']));
}

$userData = authenticate();
$userId = $userData['userId'];

// Helper function to find a valid chain using backtracking
function findValidChain($words, $targetLength = 5) {
    if (empty($words)) {
        return null;
    }

    $backtrack = function ($current, $remaining, $goal) use (&$backtrack) {
        if (count($current) === $goal) {
            return $current;
        }

        foreach ($remaining as $index => $word) {
            $lastWord = strtolower(trim(end($current)));
            $nextWord = strtolower(trim($word));
            if (substr($lastWord, -1) === substr($nextWord, 0, 1)) {
                $newRemaining = $remaining;
                array_splice($newRemaining, $index, 1);
                $res = $backtrack(array_merge($current, [$word]), $newRemaining, $goal);
                if ($res) {
                    return $res;
                }
            }
        }
        return null;
    };

    foreach ($words as $index => $word) {
        $remaining = $words;
        array_splice($remaining, $index, 1);
        $res = $backtrack([$word], $remaining, count($words) < $targetLength ? count($words) : $targetLength);
        if ($res) {
            return $res;
        }
    }
    return null;
}

function verifyUserWords($pdo, $userId, $words) {
    $placeholders = implode(',', array_fill(0, count($words), '?'));
    $sql = "SELECT wt.Translation
            FROM WordTranslations wt
            JOIN UserWords uw ON wt.WordId = uw.WordId
            WHERE uw.UserId = ? AND wt.Translation IN ($placeholders)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(array_merge([$userId], $words));
    $foundWords = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $lowerFound = array_map('strtolower', $foundWords);
    $missingWords = [];
    foreach ($words as $word) {
        if (!in_array(strtolower($word), $lowerFound)) {
            $missingWords[] = $word;
        }
    }

    if (!empty($missingWords)) {
        http_response_code(400);
        exit(json_encode(['status' => 'error', 'message' => 'Bazı kelimeler listenizde bulunamadı: ' . implode(', ', $missingWords)]));
    }
}

// Get user language settings
$stmtUser = $pdo->prepare("SELECT NativeLangId, CurrentTargetLangId FROM Users WHERE Id = ?");
$stmtUser->execute([$userId]);
$userSettings = $stmtUser->fetch();
$nativeLangId = $userSettings['NativeLangId'] ?? 1;
$targetLangId = $userSettings['CurrentTargetLangId'] ?? 2;

$input = json_decode(file_get_contents('php://input'), true);
$inputWords = isset($input['words']) ? array_filter($input['words']) : [];

$validChain = findValidChain($inputWords, count($inputWords));

if (!$validChain || count($validChain) < 2) {
    try {
        $stmtAll = $pdo->prepare("
            SELECT wt.Translation
            FROM WordTranslations wt
            JOIN UserWords uw ON wt.WordId = uw.WordId
            WHERE uw.UserId = ? AND wt.LangId = ?
        ");
        $stmtAll->execute([$userId, $targetLangId]);
        $pool = $stmtAll->fetchAll(PDO::FETCH_COLUMN);
        shuffle($pool);

        $validChain = findValidChain($pool, 5);

        if (!$validChain) {
            http_response_code(400);
            exit(json_encode(['status' => 'error', 'message' => 'Kelime havuzunuzda geçerli bir zincir oluşturabilecek yeterli kelime (5 adet) bulunamadı.']));
        }
    } catch (PDOException $e) {
        http_response_code(500);
        exit(json_encode(['status' => 'error', 'message' => 'Pool search error: ' . $e->getMessage()]));
    }
}

$words = $validChain;
try {
    verifyUserWords($pdo, $userId, $words);
} catch (PDOException $e) {
    http_response_code(500);
    exit(json_encode(['status' => 'error', 'message' => 'Verification error: ' . $e->getMessage()]));
}

$wordsString = implode(', ', $words);

$stmtLang = $pdo->prepare("
    SELECT n.LangName as NativeLang, t.LangName as TargetLang
    FROM Users u
    LEFT JOIN Languages n ON u.NativeLangId = n.Id
    LEFT JOIN Languages t ON u.CurrentTargetLangId = t.Id
    WHERE u.Id = ?
");
$stmtLang->execute([$userId]);
$userLangs = $stmtLang->fetch();
$nativeLangName = $userLangs['NativeLang'] ?? 'Native Language';
$targetLangName = $userLangs['TargetLang'] ?? 'Target Language';

$wordMappings = [];
try {
    $placeholders = implode(',', array_fill(0, count($words), '?'));
    $sql = "SELECT wt_target.Translation as target_word, wt_native.Translation as native_word
            FROM WordTranslations wt_target
            JOIN WordTranslations wt_native ON wt_target.WordId = wt_native.WordId
            WHERE wt_target.LangId = ? AND wt_native.LangId = ? AND wt_target.Translation IN ($placeholders)";
    $stmtMap = $pdo->prepare($sql);
    $stmtMap->execute(array_merge([$targetLangId, $nativeLangId], $words));
    while ($row = $stmtMap->fetch()) {
        $wordMappings[$row['target_word']] = $row['native_word'];
    }
} catch (PDOException $e) {
    // Silent fail fallback
}

function generateGeminiStory($words, $wordMappings, $nativeLangName, $targetLangName) {
    $apiKey = getenv('GEMINI_API_KEY');
    if (!$apiKey) {
        return "Gemini API key is not configured in environment variables.";
    }
    $apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=" . $apiKey;

    $mappingInstructions = [];
    foreach ($words as $w) {
        $tr = $wordMappings[$w] ?? $w;
        $mappingInstructions[] = "\"$w\" ($targetLangName) means \"$tr\" ($nativeLangName)";
    }
    $mappingStr = implode(", ", $mappingInstructions);

    $prompt = "You are a creative storyteller. Write a very short and engaging story (max 100 words) in $nativeLangName. \n\n";
    $prompt .= "STORY LANGUAGE: The story MUST be written in $nativeLangName. \n";
    $prompt .= "WORD RULE: The story must naturally use the following $targetLangName words in this exact sequence: " . implode(", ", $words) . ". \n";
    $prompt .= "CONTEXT: To help you write the story in $nativeLangName, here are the translations: $mappingStr. \n";
    $prompt .= "FORMATTING RULE: Every $targetLangName word MUST be wrapped in a <span> tag without any classes or other attributes (e.g., <span>" . $words[0] . "</span>). \n";
    $prompt .= "The rest of the story must be in perfect $nativeLangName. Do not use bold (**) or any other markdown.";

    $data = [
        "contents" => [["parts" => [["text" => $prompt]]]],
        "generationConfig" => ["temperature" => 0.7, "maxOutputTokens" => 500, "topP" => 0.95, "topK" => 64]
    ];

    $ch = curl_init($apiUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_TIMEOUT => 30
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($httpCode === 200 && $response) {
        $result = json_decode($response, true);
        if (isset($result['candidates'][0]['content']['parts'][0]['text'])) {
            return trim($result['candidates'][0]['content']['parts'][0]['text']);
        }
    }
    return "Sorry, technical error (Code: $httpCode $curlError). Please try again.";
}

$storyText = generateGeminiStory($words, $wordMappings, $nativeLangName, $targetLangName);

$imageName = 'story_' . time() . '_' . $userId . '.jpg';
$uploadDir = '../uploads/stories/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}
$imagePath = $uploadDir . $imageName;

$pollinationsKey = getenv('POLLINATIONS_API_KEY');
$imagePrompt = urlencode("Digital art of " . implode(", ", $words) . ", atmospheric lighting, high quality");
$pollinationsUrl = "https://gen.pollinations.ai/image/" . $imagePrompt . "?width=512&height=512&nologo=true&seed=" . rand(1, 1000);

if ($pollinationsKey) {
    $pollinationsUrl .= "&key=" . $pollinationsKey;
}

$ch = curl_init($pollinationsUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_TIMEOUT => 20
]);
$imageContent = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$imageUrl = $pollinationsUrl;
if ($httpCode === 200 && $imageContent) {
    if (@file_put_contents($imagePath, $imageContent)) {
        $imageUrl = 'uploads/stories/' . $imageName;
    }
}

try {
    $pdo->beginTransaction();
    $stmt = $pdo->prepare("INSERT INTO Stories (UserId, StoryText, ImageUrl, Words) VALUES (:userId, :storyText, :imageUrl, :words)");
    $stmt->execute(['userId' => $userId, 'storyText' => $storyText, 'imageUrl' => $imageUrl, 'words' => $wordsString]);
    $storyId = $pdo->lastInsertId();
    $pdo->commit();

    if (ob_get_length()) {
        ob_clean();
    }
    header(CONTENT_TYPE_JSON);
    echo json_encode(['status' => 'success', 'data' => ['storyId' => $storyId, 'story' => $storyText, 'imageUrl' => $imageUrl, 'words' => $words, 'mappings' => $wordMappings]], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    if (ob_get_length()) {
        ob_clean();
    }
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
