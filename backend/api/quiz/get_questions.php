<?php
require_once '../conn.php';
require_once '../auth_middleware.php';

header('Content-Type: application/json');

$userData = authenticate();
$userId = $userData['userId'];
$limit = $_GET['limit'] ?? 10;

try {
    // 1. Get user languages and level
    $stmtUser = $pdo->prepare("SELECT NativeLangId, CurrentTargetLangId FROM Users WHERE Id = ?");
    $stmtUser->execute([$userId]);
    $user = $stmtUser->fetch();
    
    if (!$user) {
        echo json_encode(['status' => 'error', 'message' => 'User not found.']);
        exit;
    }
    
    $nativeLangId = $user['NativeLangId'];
    $targetLangId = $user['CurrentTargetLangId'];

    // 2. Fetch questions from the Questions table matching user's languages
    // Sorunun dili (SourceLangId) kullanıcının ana dili olabilir, kelime dili (LangId) hedef dili olabilir veya tam tersi.
    // Şimdilik SourceLangId = NativeLangId, LangId = TargetLangId varsayıyoruz (veya her ikisini de kapsayabiliriz)
    $stmt = $pdo->prepare("
        SELECT Id, WordId, QuestionType, QuestionText, Options, CorrectAnswer, Explanation, ImageUrl 
        FROM Questions 
        WHERE (SourceLangId = ? AND LangId = ?) OR (SourceLangId = ? AND LangId = ?)
        ORDER BY RAND() 
        LIMIT ?
    ");
    $stmt->bindValue(1, $nativeLangId, PDO::PARAM_INT);
    $stmt->bindValue(2, $targetLangId, PDO::PARAM_INT);
    $stmt->bindValue(3, $targetLangId, PDO::PARAM_INT);
    $stmt->bindValue(4, $nativeLangId, PDO::PARAM_INT);
    $stmt->bindValue(5, (int)$limit, PDO::PARAM_INT);
    $stmt->execute();
    $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // If no specific questions, fallback to SRS generated questions logic or just return empty for now
    if (empty($questions)) {
         echo json_encode([
            'status' => 'success',
            'data' => [],
            'message' => 'No questions found for this level.'
        ]);
        exit;
    }

    // Decode JSON options
    foreach ($questions as &$q) {
        if ($q['Options']) {
            $q['Options'] = json_decode($q['Options'], true);
        }
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
