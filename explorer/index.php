<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/rpc.php';

$config = require __DIR__ . '/config.php';

$count = rpc_get($config, 'getblockcount');
if ($count === null) {
    $res = rpc_call($config, 'getblockcount');
    $error = $res['error'] ?? 'Unknown error';
    require __DIR__ . '/header.php';
    echo "<div class='err'>RPC error: " . htmlspecialchars($error) . "</div>";
    echo "<p>Ensure the DDACOIN node is running with RPC enabled (e.g. <code>--rpcuser=user --rpcpass=pass</code>) and that RPC_HOST/RPC_PORT (or RPC_URL) point to the node. ";
    echo "If the explorer runs in Docker on the same host as the node, set <code>RPC_HOST</code> to your host IP (e.g. 192.168.178.183) in <code>explorer/.env</code>.</p>";
    require __DIR__ . '/footer.php';
    exit;
}

$info = rpc_get($config, 'getblockchaininfo');
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
