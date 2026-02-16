<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/rpc.php';

$config = require __DIR__ . '/config.php';

$hash = $_GET['hash'] ?? null;
$height = isset($_GET['height']) ? (int)$_GET['height'] : null;

if ($hash) {
    $block = rpc_get($config, 'getblock', [$hash, 2]);
} elseif ($height !== null && $height >= 0) {
    $h = rpc_get($config, 'getblockhash', [$height]);
    $block = $h !== null ? rpc_get($config, 'getblock', [$h, 2]) : null;
} else {
    $block = null;
}

$pageTitle = $block ? 'Block ' . ($block['height'] ?? $block['hash']) : 'Block';

require __DIR__ . '/header.php';

if ($block === null) {
    $res = rpc_call($config, 'getblockcount');
    echo "<div class='err'>Block not found or RPC error: " . htmlspecialchars($res['error'] ?? 'unknown') . "</div>";
    require __DIR__ . '/footer.php';
    exit;
}
?>
<a href="index.php" class="back-link">← Blocks</a>
<div class="page-head">
  <h1>Block <?= number_format((int)($block['height'] ?? 0)) ?></h1>
  <p class="sub mono"><?= htmlspecialchars($block['hash']) ?></p>
</div>

<div class="card">
  <div class="card-grid">
    <div class="card-item">
      <span class="label">Height</span>
      <span class="value"><?= number_format((int)($block['height'] ?? 0)) ?></span>
    </div>
    <div class="card-item">
      <span class="label">Time</span>
      <span class="value"><?= isset($block['time']) ? date('Y-m-d H:i:s', (int)$block['time']) : '-' ?></span>
    </div>
    <div class="card-item">
      <span class="label">Transactions</span>
      <span class="value"><?= isset($block['tx']) ? count($block['tx']) : 0 ?></span>
    </div>
    <?php if (!empty($block['previousblockhash'])): ?>
    <div class="card-item">
      <span class="label">Previous block</span>
      <span class="value"><a href="block.php?hash=<?= urlencode($block['previousblockhash']) ?>" class="mono"><?= htmlspecialchars($block['previousblockhash']) ?></a></span>
    </div>
    <?php endif; ?>
    <?php if (!empty($block['nextblockhash'])): ?>
    <div class="card-item">
      <span class="label">Next block</span>
      <span class="value"><a href="block.php?hash=<?= urlencode($block['nextblockhash']) ?>" class="mono"><?= htmlspecialchars($block['nextblockhash']) ?></a></span>
    </div>
    <?php endif; ?>
  </div>
</div>

<h2>Transactions</h2>
<ul class="tx-list">
  <?php if (!empty($block['tx'])): ?>
    <?php foreach ($block['tx'] as $tx): ?>
    <li class="mono">
      <a href="tx.php?id=<?= urlencode($tx['txid'] ?? '') ?>"><?= htmlspecialchars($tx['txid'] ?? '') ?></a>
      <?php if (isset($tx['vin'][0]['coinbase'])): ?>
        <span class="label">(coinbase)</span>
      <?php endif; ?>
    </li>
    <?php endforeach; ?>
  <?php else: ?>
    <li>No transactions</li>
  <?php endif; ?>
</ul>
<?php require __DIR__ . '/footer.php';
