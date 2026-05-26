<?php
require_once '../conn.php';

// --- JWT Yardımcı Fonksiyonları ---
function base64UrlEncode($data) {
    return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
}

function generate_jwt($payload, $secret) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $base64UrlHeader = base64UrlEncode($header);
    $base64UrlPayload = base64UrlEncode(json_encode($payload));
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
    $base64UrlSignature = base64UrlEncode($signature);
    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}
// ----------------------------------

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Geçersiz istek yöntemi. Sadece POST istekleri kabul edilir.']);
    exit;
}

// JSON formatında gelen veriyi alıyoruz
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

$identifier = null;
if (isset($input['emailOrUsername'])) {
    $identifier = trim($input['emailOrUsername']);
} elseif (isset($input['email'])) {
    $identifier = trim($input['email']);
}

$password = $input['password'] ?? null;

if (!$identifier || !$password) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'E-posta/Kullanıcı adı ve şifre zorunludur.']);
    exit;
}

try {
    // Join with Languages to get the actual LangCode (tr, en etc.)
    $stmt = $pdo->prepare("
        SELECT u.Id, u.Name, u.Surname, u.Email, u.UserName, u.PasswordHash, u.DailyWord, u.Level, 
               u.NativeLangId, u.CurrentTargetLangId, u.StreakDays, u.Active,
               l.LangCode as NativeLangCode
        FROM Users u 
        LEFT JOIN Languages l ON u.NativeLangId = l.Id
        WHERE u.Email = :id1 OR u.UserName = :id2
    ");
    $stmt->execute(['id1' => $identifier, 'id2' => $identifier]);
    $user = $stmt->fetch();

    if ($user) {
        // Kullanıcı hesabı aktif mi diye kontrol ediyoruz
        if ($user['Active'] == 0) {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'Hesabınız pasif duruma getirilmiş. Lütfen yönetici ile iletişime geçin.']);
            exit;
        }

        // Gelen şifre ile veritabanındaki hashlenmiş şifreyi karşılaştırıyoruz
        if (password_verify($password, $user['PasswordHash'])) {
            // Güvenlik için şifre hash'ini cevap nesnesinden siliyoruz
            unset($user['PasswordHash']);

            // --- JWT Token Oluşturma ---
            $secret_key = "vocabler_super_secret_key_2026!"; // İleride bunu çevre değişkenlerine (.env) taşımanız daha güvenli olur.
            $issuedAt = time();
            $expirationTime = $issuedAt + (60 * 60 * 24); // Token 24 saat geçerli olacak

            $payload = [
                'iat' => $issuedAt,
                'exp' => $expirationTime,
                'iss' => 'vocabler_api', // İstek yapan kaynak (issuer)
                'data' => [
                    'userId' => $user['Id'],
                    'email'  => $user['Email']
                ]
            ];

            $jwt_token = generate_jwt($payload, $secret_key);
            // ---------------------------

            http_response_code(200);
            echo json_encode([
                'status' => 'success',
                'message' => 'Giriş başarılı.',
                'token' => $jwt_token, // Oluşturulan token'ı JS tarafına gönderiyoruz
                'user' => $user
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['status' => 'error', 'message' => 'Hatalı şifre girdiniz.']);
        }
    } else {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Bu e-posta adresi veya kullanıcı adı ile kayıtlı kullanıcı bulunamadı.']);
    }
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Veritabanı hatası.', 'error' => $e->getMessage()]);
}
