<?php
require_once __DIR__ . '/../conn.php';

// Bu script sadece yerel olarak veya belirli bir yetkiyle çalıştırılmalıdır.
// Güvenlik için basit bir kontrol:
if (php_sapi_name() !== 'cli' && (!isset($_GET['key']) || $_GET['key'] !== 'import123')) {
    die("Yetkisiz erişim.");
}

$jsonFile = __DIR__ . '/../bulk_words.json';
if (!file_exists($jsonFile)) {
    die("JSON dosyası bulunamadı.");
}

$jsonData = file_get_contents($jsonFile);
$words = json_decode($jsonData, true);

if (!$words) {
    die("JSON formatı hatalı.");
}

$count = 0;
foreach ($words as $item) {
    try {
        $stmt = $pdo->prepare("CALL sp_AddGlobalWord(?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $item['en'],
            $item['tr'],
            $item['lvl'],
            $item['cat'],
            $item['type'],
            $item['sentence'],
            $item['sentence_tr'],
            $item['picture'] ?? null
        ]);
        $result = $stmt->fetch();
        if ($result) {
            echo "Eklendi: {$item['en']} (ID: {$result['WordId']})\n";
            $count++;
        }
        $stmt->closeCursor();
    } catch (Exception $e) {
        echo "Hata ({$item['en']}): " . $e->getMessage() . "\n";
    }
}

echo "\nToplam $count kelime başarıyla içe aktarıldı.\n";
