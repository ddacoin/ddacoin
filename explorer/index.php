<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/rpc.php';

$config = require __DIR__ . '/config.php';

$count = rpc_get($config, 'getblockcount');
if ($count === null) {
    $res = rpc_call($config, 'getblockcount');
    $error = $res['error'] ?? 'Unknown error';
    $defaultHost = $config['rpc_default_host'] ?? 'ddacoin-node';
    $defaultPort = $config['rpc_default_port'] ?? '9667';
    $defaultNetwork = $config['network'] ?? 'mainnet';
    $defaultDockerNet = $defaultNetwork === 'testnet' ? 'ddacoin-testnet-net' : 'ddacoin-net';
    require __DIR__ . '/header.php';
    echo "<div class='err'>RPC error: " . htmlspecialchars($error) . "</div>";
    echo "<p>Ensure the DDACOIN node is running with RPC enabled (e.g. <code>--rpcuser=user --rpcpass=pass</code>) and that RPC_HOST/RPC_PORT (or RPC_URL) point to the node. ";
    echo "If the explorer runs in Docker with the node, default <code>DDACOIN_NETWORK={$defaultNetwork}</code> expects <code>RPC_HOST={$defaultHost}</code>, <code>RPC_PORT={$defaultPort}</code>, and shared network <code>{$defaultDockerNet}</code>. ";
    echo "If the explorer runs in Docker and the node on the host: in <code>explorer/.env</code> set <code>RPC_HOST=172.17.0.1</code> (Linux) or your host IP, and use <code>RPC_URL=https://&lt;same&gt;:{$defaultPort}</code>.</p>";
    require __DIR__ . '/footer.php';
    exit;
}

$info = rpc_get($config, 'getblockchaininfo');
$peerInfo = rpc_get($config, 'getpeerinfo');
$miningInfo = rpc_get($config, 'getmininginfo');
$connectedCount = is_array($peerInfo) ? count($peerInfo) : 0;
$verificationProgress = isset($info['verificationprogress']) ? (float)$info['verificationprogress'] : 1.0;
$initialBlockDownload = !empty($info['initialblockdownload']);
$networkHealth = $initialBlockDownload ? 'Syncing' : ($verificationProgress >= 0.9999 ? 'Healthy' : 'Syncing');
$networkHealthPct = $verificationProgress >= 0.9999 ? '100%' : (round($verificationProgress * 100, 1) . '%');
$pooledTx = isset($miningInfo['pooledtx']) ? (int)$miningInfo['pooledtx'] : (isset($miningInfo['PooledTx']) ? (int)$miningInfo['PooledTx'] : 0);

// DDACOIN mined today (UTC): sum coinbase of blocks with time >= today 00:00 UTC
$todayStartUtc = gmmktime(0, 0, 0, (int)gmdate('n'), (int)gmdate('j'), (int)gmdate('Y'));
$minedToday = 0.0;
$maxBlocksToScan = 48; // e.g. 2 days at 1 block/hour
for ($h = (int)$count; $h >= 0 && $maxBlocksToScan > 0; $h--, $maxBlocksToScan--) {
    $hash = rpc_get($config, 'getblockhash', [$h]);
    if ($hash === null) {
        break;
    }
    $block = rpc_get($config, 'getblock', [$hash, 2]);
    if ($block === null || !isset($block['time'])) {
        break;
    }
    if ((int)$block['time'] < $todayStartUtc) {
        break;
    }
    // getblock verbosity 2 returns full tx list in "rawtx", not "tx"
    $txs = $block['rawtx'] ?? $block['tx'] ?? [];
    if (!empty($txs[0]['vout'])) {
        foreach ($txs[0]['vout'] as $vout) {
            $minedToday += (float)($vout['value'] ?? 0);
        }
    }
}

$blocks = [];
$start = max(0, (int)$count - 14);
for ($i = $count; $i >= $start && $i >= 0; $i--) {
    $hash = rpc_get($config, 'getblockhash', [$i]);
    if ($hash === null) {
        break;
    }
    $block = rpc_get($config, 'getblock', [$hash, 1]);
    if ($block === null) {
        break;
    }
    $blocks[] = $block;
}

require __DIR__ . '/header.php';
?>
<div class="stats-strip stats-strip--primary">
  <div class="stat-box">
    <div class="stat-label">Network health</div>
    <div class="stat-value stat-value--health"><?= htmlspecialchars($networkHealth) ?> <span class="stat-sub"><?= htmlspecialchars($networkHealthPct) ?></span></div>
  </div>
  <div class="stat-box">
    <div class="stat-label">Connected nodes</div>
    <div class="stat-value"><?= number_format($connectedCount) ?></div>
  </div>
  <div class="stat-box">
    <div class="stat-label"><?= htmlspecialchars($config['coin_name']) ?> mined today</div>
    <div class="stat-value"><?= number_format($minedToday, 8) ?></div>
  </div>
  <div class="stat-box">
    <div class="stat-label">Pending transactions</div>
    <div class="stat-value"><?= number_format($pooledTx) ?></div>
  </div>
</div>
<div class="stats-strip">
  <div class="stat-box">
    <div class="stat-label">Chain</div>
    <div class="stat-value"><?= htmlspecialchars($config['coin_name']) ?></div>
  </div>
  <div class="stat-box">
    <div class="stat-label">Block height</div>
    <div class="stat-value"><?= number_format((int)$count) ?></div>
  </div>
  <?php if (!empty($info['bestblockhash'])): ?>
  <div class="stat-box">
    <div class="stat-label">Best block</div>
    <div class="stat-value"><a href="block.php?hash=<?= urlencode($info['bestblockhash']) ?>" class="mono"><?= htmlspecialchars(substr($info['bestblockhash'], 0, 16)) ?>…</a></div>
  </div>
  <?php endif; ?>
</div>

<h2>Latest blocks</h2>
<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th>Height</th>
        <th>Hash</th>
        <th>Time</th>
        <th>Tx count</th>
      </tr>
    </thead>
    <tbody>
      <?php foreach ($blocks as $b): ?>
      <tr>
        <td><a href="block.php?height=<?= (int)$b['height'] ?>"><?= number_format((int)$b['height']) ?></a></td>
        <td class="mono"><a href="block.php?hash=<?= urlencode($b['hash']) ?>"><?= htmlspecialchars($b['hash']) ?></a></td>
        <td><?= isset($b['time']) ? date('Y-m-d H:i:s', (int)$b['time']) : '-' ?></td>
        <td><?= isset($b['tx']) ? count($b['tx']) : 0 ?></td>
      </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
</div>
<?php require __DIR__ . '/footer.php';
