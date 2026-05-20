<?php
require_once '../conn.php';
require_once '../auth_middleware.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['status' => 'error', 'message' => 'Sadece POST kabul edilir.']));
}

$userData = authenticate();
$userId = $userData['userId'];
$input = json_decode(file_get_contents('php://input'), true);

$wordIds = $input['wordIds'] ?? [];

if (empty($wordIds) || !is_array($wordIds)) {
    http_response_code(400);
    exit(json_encode(['status' => 'error', 'message' => 'Silinecek kelime ID leri bulunamadı.']));
}

try {
    $pdo->beginTransaction();
    
    // Güvenli silme: Sadece bu kullanıcının listesinde (UserWords) olanları sil (abonelik iptali gibi).
    // Eğer kelimeyi bizzat kendisi eklediyse ve başka abonesi yoksa tamamen silinebilir, 
    // ama şimdilik SRS listesinden (UserWords) çıkarmak yeterlidir.
    $placeholders = implode(',', array_fill(0, count($wordIds), '?'));
    $params = array_merge([$userId], $wordIds);

    $stmt = $pdo->prepare("DELETE FROM UserWords WHERE UserId = ? AND WordId IN ($placeholders)");
    $stmt->execute($params);

    $pdo->commit();

    echo json_encode(['status' => 'success', 'message' => 'Seçilen kelimeler listeden çıkarıldı.']);
} catch (\PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Veritabanı hatası: ' . $e->getMessage()]);
}
?>
