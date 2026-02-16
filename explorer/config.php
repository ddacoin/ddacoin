<?php
/**
 * DDACOIN Explorer – RPC config from environment.
 */
return [
    'rpc_url'   => getenv('RPC_URL') ?: 'https://' . (getenv('RPC_HOST') ?: 'host.docker.internal') . ':' . (getenv('RPC_PORT') ?: '9667'),
    'rpc_user'  => getenv('RPC_USER') ?: '',
    'rpc_pass'  => getenv('RPC_PASS') ?: '',
    'coin_name' => 'DDACOIN',
];
