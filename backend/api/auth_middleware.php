<?php

define('BEARER_PREFIX', 'Bearer ');

function getAuthHeader() {
    $result = null;

    // 1. En geniş kapsamlı header kontrolü (getallheaders)
    if (function_exists('getallheaders')) {
        $headers = array_change_key_case(getallheaders(), CASE_LOWER);
        if (isset($headers['authorization'])) {
            $result = $headers['authorization'];
        } elseif (isset($headers['x-vocabler-token'])) {
            $result = BEARER_PREFIX . $headers['x-vocabler-token'];
        }
    }

    // 2. $_SERVER kontrolü (Apache/Nginx fallback)
    if ($result === null) {
        $serverAuth = $_SERVER['HTTP_AUTHORIZATION'] ??
                     $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ??
                     $_SERVER['HTTP_X_VOCABLER_TOKEN'] ??
                     $_SERVER['REDIRECT_HTTP_X_VOCABLER_TOKEN'] ?? null;

        if ($serverAuth && !str_starts_with(strtolower($serverAuth), 'bearer ')) {
            $result = BEARER_PREFIX . $serverAuth;
        } else {
            $result = $serverAuth;
        }
    }

    return $result;
}

function decodeJWT($jwt) {
    $parts = explode('.', $jwt);
    if (count($parts) !== 3) {
        return null;
    }

    $header = $parts[0];
    $payload = $parts[1];
    $signature_provided = $parts[2];

    $secret = "vocabler_super_secret_key_2026!";
    $expected_signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(hash_hmac('sha256', "$header.$payload", $secret, true)));

    if (!hash_equals($expected_signature, $signature_provided)) {
        return null;
    }

    $b64 = strtr($payload, '-_', '+/');
    $remainder = strlen($b64) % 4;
    if ($remainder) {
        $b64 .= str_repeat('=', 4 - $remainder);
    }

    return json_decode(base64_decode($b64), true);
}

function authenticate() {
    $authHeader = getAuthHeader();

    if (!$authHeader) {
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'message' => 'Yetkilendirme başlığı bulunamadı.'
        ]);
        exit;
    }

    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $decoded = decodeJWT($matches[1]);

        if ($decoded && isset($decoded['exp']) && $decoded['exp'] < time()) {
            http_response_code(401);
            echo json_encode(['status' => 'error', 'message' => 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.']);
            exit;
        }

        if ($decoded && isset($decoded['data']['userId'])) {
            return $decoded['data'];
        }
    }

    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Yetkilendirme başarısız.']);
    exit;
}
