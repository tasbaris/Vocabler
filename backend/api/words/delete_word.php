<?php
require_once '../conn.php';
require_once '../auth_middleware.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    exit(json_encode(['status' => 'error', 'message' => 'Sadece POST veya DELETE istekleri kabul edilir.']));
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
    // Kelimeyi kullanıcının kelime havuzundan (UserWords) çıkar
    $stmt = $pdo->prepare("DELETE FROM UserWords WHERE UserId = ? AND WordId = ?");
    $stmt->execute([$userId, $input['wordId']]);
    
    // Eğer kelimeyi bizzat kullanıcı oluşturmuşsa ve başka kimsede yoksa, kelimeyi Words tablosundan da silebiliriz (İsteğe bağlı temizlik).
    // Ancak standart bir "Listeden Çıkar" mantığı için UserWords'ten silmek yeterlidir.

    echo json_encode(['status' => 'success', 'message' => 'Kelime listenizden başarıyla çıkarıldı.']);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Sunucu hatası: ' . $e->getMessage()]);
}
?>