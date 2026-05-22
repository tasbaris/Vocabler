<?php
function authenticate() {
    // 1. Header'ı almanın en güvenli yollarını dene
    $authHeader = null;

    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
        } elseif (isset($headers['authorization'])) {
            $authHeader = $headers['authorization'];
        } elseif (isset($headers['X-Vocabler-Token'])) {
            $authHeader = 'Bearer ' . $headers['X-Vocabler-Token'];
        } elseif (isset($headers['x-vocabler-token'])) {
            $authHeader = 'Bearer ' . $headers['x-vocabler-token'];
        }
    }

    if (!$authHeader) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? $_SERVER['HTTP_X_AUTHORIZATION'] ?? null;
        if (!$authHeader && isset($_SERVER['HTTP_X_VOCABLER_TOKEN'])) {
            $authHeader = 'Bearer ' . $_SERVER['HTTP_X_VOCABLER_TOKEN'];
        }
    }

    // Apache'de bazen header'lar $_SERVER içinde farklı isimlendirilebilir
    if (!$authHeader && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
    }

    if (!$authHeader) {
        http_response_code(401);
        $debugHeaders = function_exists('getallheaders') ? getallheaders() : [];
        echo json_encode([
            'status' => 'error', 
            'message' => 'Yetkilendirme başlığı (Authorization header) bulunamadı.',
            'debug_headers' => $debugHeaders,
            'debug_server' => $_SERVER
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