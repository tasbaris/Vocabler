<?php
require_once '../conn.php';
require_once '../auth_middleware.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['status' => 'error', 'message' => 'Sadece POST istekleri kabul edilir.']));
}

// Token doğrulama (kullanıcı giriş yapmış mı?)
$userData = authenticate();

// JWT state-less olduğu için sunucu tarafında yapılabilecek en iyi şey
// (blacklist mekanizması yoksa) istemciye token'ı silmesini söylemektir.
// İstenirse buraya veritabanında loglama eklenebilir.

echo json_encode([
    'status' => 'success',
    'message' => 'Başarıyla çıkış yapıldı. Lütfen istemci tarafındaki tokeni silin.'
]);
