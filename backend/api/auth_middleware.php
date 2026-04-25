<?php
function authenticate() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $jwt = $matches[1];
        $parts = explode('.', $jwt);
        
        if (count($parts) === 3) {
            $header = $parts[0];
            $payload = $parts[1];
            $signature_provided = $parts[2];
            
            $secret = "vocabler_super_secret_key_2026!";
            $expected_signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(hash_hmac('sha256', "$header.$payload", $secret, true)));
            
            if (hash_equals($expected_signature, $signature_provided)) {
                // Base64 padding işlemini güvenli hale getir
                $b64 = strtr($payload, '-_', '+/');
                $b64 = str_pad($b64, strlen($b64) % 4 === 0 ? strlen($b64) : strlen($b64) + (4 - (strlen($b64) % 4)), '=', STR_PAD_RIGHT);
                $decoded = json_decode(base64_decode($b64), true);
                
                if (is_array($decoded) && isset($decoded['exp']) && $decoded['exp'] >= time() && isset($decoded['data']['userId'])) {
                    return $decoded['data'];
                }
            }
        }
    }
    
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Yetkisiz erisim. Gecersiz veya suresi dolmus token.']);
    exit;
}
?>