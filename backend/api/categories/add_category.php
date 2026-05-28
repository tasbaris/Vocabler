<?php
require_once '../conn.php';
require_once '../auth_middleware.php';

header('Content-Type: application/json');

$userData = authenticate();
$userId = $userData['userId'];

$input = json_decode(file_get_contents('php://input'), true);

if (empty($input['categoryName'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Kategori adı boş olamaz.']);
    exit;
}

try {
    $pdo->beginTransaction();
    
    // 1. Kategoriyi oluştur
    $stmt = $pdo->prepare("INSERT INTO Categories (CategoryName, Active) VALUES (?, 1)");
    $stmt->execute([$input['categoryName']]);
    $categoryId = $pdo->lastInsertId();

    // 2. Kullanıcıyı bu kategoriye otomatik abone et (sp_AssignWordsToUser ile varsa kelimeleri çek)
    // Not: Yeni kategoride henüz kelime olmayabilir, ancak ileride eklendiğinde sistemin tutarlı olması için
    // Kullanıcının dillerini al
    $userStmt = $pdo->prepare("SELECT CurrentTargetLangId FROM Users WHERE Id = ?");
    $userStmt->execute([$userId]);
    $user = $userStmt->fetch();

    if ($user) {
        $targetLangId = $user['CurrentTargetLangId'];
        $stmtAssign = $pdo->prepare("CALL sp_AssignWordsToUser(?, ?, ?, ?)");
        $stmtAssign->execute([$userId, $categoryId, $targetLangId, 50]);
    }

    $pdo->commit();
    echo json_encode(['status' => 'success', 'message' => 'Kategori başarıyla eklendi.', 'id' => $categoryId]);
} catch (\PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Kategori eklenirken hata oluştu: ' . $e->getMessage()]);
}
