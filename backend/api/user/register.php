<?php
require_once '../conn.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Geçersiz istek yöntemi. Sadece POST istekleri kabul edilir.']);
    exit;
}

// JSON formatında gelen veriyi alıyoruz
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, TRUE);

// Gerekli alanların kontrolü
$requiredFields = ['name', 'surname', 'email', 'username', 'password'];
foreach ($requiredFields as $field) {
    if (!isset($input[$field]) || empty(trim($input[$field]))) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => "Eksik alan: $field zorunludur."]);
        exit;
    }
}

$name     = trim($input['name']);
$surname  = trim($input['surname']);
$email    = trim($input['email']);
$username = trim($input['username']);
$password = $input['password'];

// Opsiyonel dil bilgileri (Varsayılan olarak init.sql'deki gibi 1: Türkçe, 2: İngilizce atanabilir veya null bırakılabilir)
$nativeLangId = isset($input['nativeLangId']) ? (int)$input['nativeLangId'] : 1;
$currentTargetLangId = isset($input['targetLangId']) ? (int)$input['targetLangId'] : 2;
$dailyWord = isset($input['dailyWord']) ? (int)$input['dailyWord'] : 10;
$level = isset($input['level']) ? trim($input['level']) : 'A1';

try {
    // 1. E-posta veya Kullanıcı adının önceden alınıp alınmadığını kontrol ediyoruz
    $checkStmt = $pdo->prepare("SELECT Id FROM Users WHERE Email = :email OR UserName = :username");
    $checkStmt->execute(['email' => $email, 'username' => $username]);

    if ($checkStmt->fetch()) {
        http_response_code(409); // Conflict
        echo json_encode(['status' => 'error', 'message' => 'Bu e-posta adresi veya kullanıcı adı zaten kullanımda.']);
        exit;
    }

    // 2. Şifreyi güvenli bir şekilde hashliyoruz
    $passwordHash = password_hash($password, PASSWORD_BCRYPT);

    // 3. Kullanıcıyı veritabanına kaydediyoruz
    $sql = "INSERT INTO Users (Name, Surname, Email, UserName, PasswordHash, NativeLangId, CurrentTargetLangId, Level, DailyWord)
            VALUES (:name, :surname, :email, :username, :passwordHash, :nativeLangId, :targetLangId, :level, :dailyWord)";

    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute([
        'name'         => $name,
        'surname'      => $surname,
        'email'        => $email,
        'username'     => $username,
        'passwordHash' => $passwordHash,
        'nativeLangId' => $nativeLangId,
        'targetLangId' => $currentTargetLangId,
        'level'        => $level,
        'dailyWord'    => $dailyWord
    ]);

    if ($result) {
        http_response_code(201); // Created
        echo json_encode([
            'status' => 'success',
            'message' => 'Kayıt başarıyla tamamlandı.',
            'userId' => $pdo->lastInsertId()
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Kayıt sırasında bir hata oluştu.']);
    }

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Veritabanı hatası.', 'error' => $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Beklenmedik bir hata oluştu.', 'error' => $e->getMessage()]);
}
