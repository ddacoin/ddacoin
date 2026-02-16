<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/rpc.php';

$config = require __DIR__ . '/config.php';

$id = $_GET['id'] ?? '';
$tx = null;
if ($id !== '') {
    $tx = rpc_get($config, 'getrawtransaction', [$id, true]);
}

$pageTitle = $tx ? ('Tx ' . substr($id, 0, 16) . '…') : 'Transaction';

require __DIR__ . '/header.php';

if ($tx === null) {
    echo "<div class='err'>Transaction not found or RPC error. Check txid.</div>";
    require __DIR__ . '/footer.php';
    exit;
}

$txid = $tx['txid'] ?? $id;
$blockhash = $tx['blockhash'] ?? null;
?>
<a href="<?= $blockhash ? 'block.php?hash=' . urlencode($blockhash) : 'index.php' ?>" class="back-link">← <?= $blockhash ? 'Block' : 'Blocks' ?></a>
<div class="page-head">
  <h1>Transaction</h1>
  <p class="sub mono"><?= htmlspecialchars($txid) ?></p>
</div>

<div class="card">
  <div class="card-grid">
    <div class="card-item">
      <span class="label">Confirmations</span>
      <span class="value"><?= number_format((int)($tx['confirmations'] ?? 0)) ?></span>
    </div>
    <div class="card-item">
      <span class="label">Block</span>
      <span class="value">
        <?php if (!empty($tx['blockhash'])): ?>
          <a href="block.php?hash=<?= urlencode($tx['blockhash']) ?>" class="mono"><?= htmlspecialchars($tx['blockhash']) ?></a>
        <?php else: ?>
          <span class="text-muted">Unconfirmed</span>
        <?php endif; ?>
      </span>
    </div>
  </div>
</div>

<h2>Inputs</h2>
<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th>Previous output</th>
        <th>Script / Coinbase</th>
      </tr>
    </thead>
    <tbody>
      <?php foreach ($tx['vin'] ?? [] as $in): ?>
      <tr>
        <td class="mono">
          <?php if (!empty($in['txid'])): ?>
            <a href="tx.php?id=<?= urlencode($in['txid']) ?>"><?= htmlspecialchars($in['txid']) ?></a>:<?= (int)($in['vout'] ?? 0) ?>
          <?php else: ?>
            coinbase
          <?php endif; ?>
        </td>
        <td class="mono"><?= !empty($in['coinbase']) ? htmlspecialchars($in['coinbase']) : (isset($in['scriptSig']['hex']) ? htmlspecialchars($in['scriptSig']['hex']) : '-') ?></td>
      </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
</div>

<h2>Outputs</h2>
<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th>Index</th>
        <th>Value</th>
        <th>Script</th>
      </tr>
    </thead>
    <tbody>
      <?php foreach ($tx['vout'] ?? [] as $i => $out): ?>
      <tr>
        <td><?= $i ?></td>
        <td><?= number_format((float)($out['value'] ?? 0), 8) ?> DDACOIN</td>
        <td class="mono"><?= htmlspecialchars($out['scriptPubKey']['hex'] ?? '-') ?></td>
      </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
</div>
<?php require __DIR__ . '/footer.php';
