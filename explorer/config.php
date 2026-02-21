<?php
/**
 * DDACOIN Explorer – RPC config from environment.
 */

$network = getenv('DDACOIN_NETWORK') === 'testnet' ? 'testnet' : 'mainnet';
$defaultHost = $network === 'testnet' ? 'ddacoin-testnet-node' : 'ddacoin-node';
$defaultPort = $network === 'testnet' ? '19667' : '9667';
$coinName = $network === 'testnet' ? 'DDACOIN TESTNET' : 'DDACOIN';

return [
    'network' => $network,
    'rpc_default_host' => $defaultHost,
    'rpc_default_port' => $defaultPort,
    'rpc_url'   => getenv('RPC_URL') ?: 'https://' . (getenv('RPC_HOST') ?: $defaultHost) . ':' . (getenv('RPC_PORT') ?: $defaultPort),
    'rpc_user'  => getenv('RPC_USER') ?: '',
    'rpc_pass'  => getenv('RPC_PASS') ?: '',
    'coin_name' => $coinName,
];
