<?php
require_once '../conn.php';
require_once '../auth_middleware.php';

$userData = authenticate();
$userId = $userData['userId'];

$data = json_decode(file_get_contents("php://input"), true);
$categoryId = $data['categoryId'] ?? null;
$limit = $data['limit'] ?? 50; // Varsayılan olarak 50 kelime ekle

if (!$categoryId) {
    echo json_encode(['status' => 'error', 'message' => 'Kategori ID gereklidir.']);
    exit;
}

try {
    // Kullanıcının hedef dilini al
    $userStmt = $pdo->prepare("SELECT CurrentTargetLangId FROM Users WHERE Id = ?");
    $userStmt->execute([$userId]);
    $user = $userStmt->fetch();
    
    if (!$user) {
        echo json_encode(['status' => 'error', 'message' => 'Kullanıcı bulunamadı.']);
        exit;
    }
    
    $targetLangId = $user['CurrentTargetLangId'];

    // sp_AssignWordsToUser(UserId, CategoryId, TargetLangId, Limit)
    $stmt = $pdo->prepare("CALL sp_AssignWordsToUser(?, ?, ?, ?)");
    $stmt->execute([$userId, $categoryId, $targetLangId, $limit]);

    echo json_encode([
        'status' => 'success', 
        'message' => 'Kategori başarıyla çalışma listene eklendi.'
    ]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Hata: ' . $e->getMessage()]);
}
?>