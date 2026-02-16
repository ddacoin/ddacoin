<?php
/**
 * JSON-RPC client for DDACOIN node (btcd-style).
 */

function rpc_call(array $config, string $method, array $params = []): array {
    $url = $config['rpc_url'];
    $body = json_encode([
        'jsonrpc' => '1.0',
        'id'      => 1,
        'method'  => $method,
        'params'  => $params,
    ]);

    $opts = [
        'http' => [
            'method'  => 'POST',
            'header'  => "Content-Type: application/json\r\n",
            'content' => $body,
            'timeout' => 15,
        ],
    ];
    if (strpos($config['rpc_url'], 'https://') === 0) {
        $opts['ssl'] = [
            'verify_peer'      => false,
            'verify_peer_name' => false,
        ];
    }

    if (!empty($config['rpc_user']) || !empty($config['rpc_pass'])) {
        $auth = base64_encode($config['rpc_user'] . ':' . $config['rpc_pass']);
        $opts['http']['header'] .= "Authorization: Basic $auth\r\n";
    }

    $ctx = stream_context_create($opts);
    $raw  = @file_get_contents($url, false, $ctx);

    if ($raw === false) {
        $code = null;
        if (!empty($http_response_header) && preg_match('#^HTTP/\S+\s+(\d+)#', $http_response_header[0], $m)) {
            $code = (int) $m[1];
        }
        if ($code === 401) {
            return ['error' => 'RPC authentication failed (401). Ensure RPC_USER and RPC_PASS in explorer/.env match the node\'s --rpcuser/--rpcpass. Restart the node after changing ddacoin/.env.'];
        }
        if ($code === 503) {
            return ['error' => 'Node too busy (max RPC clients). Try again in a moment or increase --rpcmaxclients on the node.'];
        }
        $urlForErr = preg_replace('#://[^@]+@#', '://***:***@', $url);
        return ['error' => 'Could not connect to node. Is RPC enabled (--rpcuser/--rpcpass)? Tried: ' . $urlForErr];
    }

    $out = json_decode($raw, true);
    if ($out === null) {
        return ['error' => 'Invalid JSON from node'];
    }
    if (isset($out['error']) && $out['error'] !== null) {
        return ['error' => $out['error']['message'] ?? json_encode($out['error'])];
    }
    return $out;
}

function rpc_get(array $config, string $method, array $params = []) {
    $res = rpc_call($config, $method, $params);
    if (isset($res['error'])) {
        return null;
    }
    return $res['result'] ?? null;
}
