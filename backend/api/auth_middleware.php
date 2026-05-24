<?php
function authenticate() {
    $authHeader = null;

    // 1. En geniş kapsamlı header kontrolü (getallheaders)
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        // Case-insensitive kontrol için keyleri küçültelim
        $lowerHeaders = array_change_key_case($headers, CASE_LOWER);
        
        if (isset($lowerHeaders['authorization'])) {
            $authHeader = $lowerHeaders['authorization'];
        } elseif (isset($lowerHeaders['x-vocabler-token'])) {
            $authHeader = 'Bearer ' . $lowerHeaders['x-vocabler-token'];
        }
    }

    // 2. $_SERVER kontrolü (Apache/Nginx fallback)
    if (!$authHeader) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? 
                      $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? 
                      $_SERVER['HTTP_X_VOCABLER_TOKEN'] ?? 
                      $_SERVER['REDIRECT_HTTP_X_VOCABLER_TOKEN'] ?? null;
                      
        // Eğer Bearer prefix'i yoksa ve X-Vocabler-Token'dan gelmişse ekle
        if ($authHeader && !str_starts_with(strtolower($authHeader), 'bearer ')) {
            $authHeader = 'Bearer ' . $authHeader;
        }
    }

    // 3. Apache Request Headers (Specific to Apache)
    if (!$authHeader && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        $lowerHeaders = array_change_key_case($headers, CASE_LOWER);
        if (isset($lowerHeaders['authorization'])) {
            $authHeader = $lowerHeaders['authorization'];
        } elseif (isset($lowerHeaders['x-vocabler-token'])) {
            $authHeader = 'Bearer ' . $lowerHeaders['x-vocabler-token'];
        }
    }

    if (!$authHeader) {
        http_response_code(401);
        echo json_encode([
            'status' => 'error', 
            'message' => 'Yetkilendirme başlığı bulunamadı.',
            'debug' => [
                'headers' => function_exists('getallheaders') ? getallheaders() : 'N/A',
                'server' => [
                    'HTTP_AUTHORIZATION' => $_SERVER['HTTP_AUTHORIZATION'] ?? 'MISSING',
                    'HTTP_X_VOCABLER_TOKEN' => $_SERVER['HTTP_X_VOCABLER_TOKEN'] ?? 'MISSING'
                ]
            ]
        ]);
        exit;
    }

    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $jwt = $matches[1];
        $parts = explode('.', $jwt);
        
        if (count($parts) === 3) {
            $header = $parts[0];
            $payload = $parts[1];
            $signature_provided = $parts[2];
            
            $secret = "vocabler_super_secret_key_2026!";
            
            // Signature'ı doğrula
            $expected_signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(hash_hmac('sha256', "$header.$payload", $secret, true)));
            
            if (hash_equals($expected_signature, $signature_provided)) {
                // Payload'u decode et
                $b64 = strtr($payload, '-_', '+/');
                $remainder = strlen($b64) % 4;
                if ($remainder) {
                    $padlen = 4 - $remainder;
                    $b64 .= str_repeat('=', $padlen);
                }
                $decoded = json_decode(base64_decode($b64), true);
                
                if ($decoded) {
                    if (isset($decoded['exp']) && $decoded['exp'] < time()) {
                        http_response_code(401);
                        echo json_encode(['status' => 'error', 'message' => 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.']);
                        exit;
                    }
                    
                    if (isset($decoded['data']['userId'])) {
                        return $decoded['data'];
                    } else {
                        http_response_code(401);
                        echo json_encode(['status' => 'error', 'message' => 'Token içeriği geçersiz (User ID eksik).']);
                        exit;
                    }
                } else {
                    http_response_code(401);
                    echo json_encode(['status' => 'error', 'message' => 'Token payload decode edilemedi.']);
                    exit;
                }
            } else {
                http_response_code(401);
                echo json_encode(['status' => 'error', 'message' => 'Token imzası geçersiz.']);
                exit;
            }
        } else {
            http_response_code(401);
            echo json_encode(['status' => 'error', 'message' => 'Token formatı geçersiz.']);
            exit;
        }
    }
    
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Bearer token bulunamadı.']);
    exit;
}
?>