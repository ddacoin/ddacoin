/**
 * DDACOIN wallet server: Express API + static UI.
 * RPC config from env: RPC_HOST, RPC_PORT, RPC_USER, RPC_PASS.
 * Session keeps mnemonic in memory (no disk); optional /data for preferences.
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import {
  checkRpcConnection,
  getRawTransactionHex,
  searchRawTransactions,
  searchRawTransactionsWithError,
  sendRawTransaction,
  type RpcConfig,
} from './rpc.js';
import {
  generateMnemonic,
  validateMnemonic,
  getAddressFromMnemonic,
  getAddressFromWif,
  balanceFromTxs,
  buildAndSignTx,
  fromSubunits,
  isValidAddressForActiveNetwork,
  toSubunits,
} from './wallet.js';
import { getActiveWalletRpcDefaultPort, walletNetworkNameFromEnv } from './constants/ddacoin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3080;

/** In-memory session: either mnemonic (create/restore) or wif (import). */
const sessions = new Map<string, {
  mnemonic?: string;
  wif?: string;
  address: string;
  createdAt: number;
}>();
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const SESSION_COOKIE = 'wallet_session';

function getRpcConfig(): RpcConfig {
  const useHttps = process.env.RPC_USE_HTTPS !== '0' && process.env.RPC_USE_HTTPS !== 'false';
  const defaultRpcPort = getActiveWalletRpcDefaultPort();
  return {
    host: process.env.RPC_HOST || 'host.docker.internal',
    port: Number(process.env.RPC_PORT) || defaultRpcPort,
    user: process.env.RPC_USER || '',
    pass: process.env.RPC_PASS || '',
    useHttps,
  };
}

function getSession(req: express.Request): { mnemonic?: string; wif?: string; address: string } | null {
  const id = req.cookies?.[SESSION_COOKIE];
  if (!id) return null;
  const s = sessions.get(id);
  if (!s) return null;
  if (Date.now() - s.createdAt > SESSION_TTL_MS) {
    sessions.delete(id);
    return null;
  }
  return { mnemonic: s.mnemonic, wif: s.wif, address: s.address };
}

function requireSession(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  if (getSession(req)) next();
  else res.status(401).json({ error: 'Not unlocked. Create or restore wallet first.' });
}

// JSON body
app.use(express.json({ limit: '10kb' }));

// Cookie parser (simple)
app.use((req, _res, next) => {
  (req as express.Request & { cookies?: Record<string, string> }).cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    for (const part of cookieHeader.split(';')) {
      const [key, val] = part.trim().split('=');
      if (key && val) (req as express.Request & { cookies: Record<string, string> }).cookies![key] = decodeURIComponent(val);
    }
  }
  next();
});

// Static UI
app.use(express.static(path.join(__dirname, '..', 'public')));

// --- API ---

/** Node status */
app.get('/api/status', async (_req, res) => {
  const rpc = getRpcConfig();
  const result = await checkRpcConnection(rpc);
  if (!result.ok) {
    const networkName = walletNetworkNameFromEnv();
    const defaultPort = getActiveWalletRpcDefaultPort();
    const hint =
      ` Ensure the node is running, configured for ${networkName}, listens on --rpclisten=0.0.0.0:${defaultPort}, and wallet/.env has matching RPC_USER/RPC_PASS.`;
    return res.json({ ok: false, error: result.error + hint });
  }
  res.json({ ok: true, blockHeight: result.blockHeight });
});

/** Create new wallet: generate mnemonic, set session, return mnemonic + address */
app.post('/api/wallet/create', (req, res) => {
  const mnemonic = generateMnemonic();
  const { address } = getAddressFromMnemonic(mnemonic, 0);
  const id = crypto.randomUUID();
  sessions.set(id, { mnemonic, address, createdAt: Date.now() });
  res
    .cookie(SESSION_COOKIE, id, { httpOnly: true, maxAge: SESSION_TTL_MS, path: '/', sameSite: 'lax' })
    .json({ mnemonic, address });
});

/** Restore from mnemonic; set session */
app.post('/api/wallet/restore', (req, res) => {
  const { mnemonic } = req.body as { mnemonic?: string };
  if (!mnemonic || typeof mnemonic !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid mnemonic' });
  }
  const trimmed = mnemonic.trim().toLowerCase();
  if (!validateMnemonic(trimmed)) {
    return res.status(400).json({ error: 'Invalid mnemonic phrase' });
  }
  const { address } = getAddressFromMnemonic(trimmed, 0);
  const id = crypto.randomUUID();
  sessions.set(id, { mnemonic: trimmed, address, createdAt: Date.now() });
  res
    .cookie(SESSION_COOKIE, id, { httpOnly: true, maxAge: SESSION_TTL_MS, path: '/', sameSite: 'lax' })
    .json({ address });
});

/** Import from private key (WIF). Use this if you only have a key from e.g. ddacoin genaddress (no backup phrase). */
app.post('/api/wallet/import', (req, res) => {
  const { wif } = req.body as { wif?: string };
  if (!wif || typeof wif !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid WIF (private key)' });
  }
  try {
    const { address } = getAddressFromWif(wif);
    const id = crypto.randomUUID();
    sessions.set(id, { wif: wif.trim(), address, createdAt: Date.now() });
    res
      .cookie(SESSION_COOKIE, id, { httpOnly: true, maxAge: SESSION_TTL_MS, path: '/', sameSite: 'lax' })
      .json({ address });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(400).json({ error: msg });
  }
});

/** Logout */
app.post('/api/wallet/logout', (req, res) => {
  const id = req.cookies?.[SESSION_COOKIE];
  if (id) sessions.delete(id);
  res.clearCookie(SESSION_COOKIE, { path: '/' }).json({ ok: true });
});

/** Current wallet info (if session) */
app.get('/api/wallet/info', (req, res) => {
  const session = getSession(req);
  if (!session) return res.json({ hasSession: false });
  res.json({ hasSession: true, address: session.address });
});

/** Balance (requires session, requires node with --addrindex) */
app.get('/api/wallet/balance', requireSession, async (req, res) => {
  const session = getSession(req)!;
  const rpc = getRpcConfig();
  const result = await searchRawTransactionsWithError(rpc, session.address, { count: 500 });
  if ('error' in result) {
    const msg = result.error === 'No information available about address'
      ? 'No transaction history for this address. If you expect a balance (e.g. mining payout), ensure this wallet address matches MINING_ADDR in your node\'s .env and that the node has indexed the chain (--addrindex).'
      : result.error;
    return res.status(200).json({
      balance: 0,
      balanceFormatted: '0',
      utxoCount: 0,
      error: msg,
    });
  }
  const { balance, utxos } = balanceFromTxs(result.txs, session.address);
  res.json({
    balance,
    balanceFormatted: fromSubunits(balance),
    utxoCount: utxos.length,
  });
});

/** Receive address + QR as data URL */
app.get('/api/wallet/receive', requireSession, async (req, res) => {
  const session = getSession(req)!;
  try {
    const qr = await QRCode.toDataURL(`ddacoin:${session.address}`, { margin: 1, width: 256 });
    res.json({ address: session.address, qr });
  } catch (e) {
    res.status(500).json({ error: 'QR generation failed' });
  }
});

/** Send DDACOIN */
app.post('/api/wallet/send', requireSession, async (req, res) => {
  const session = getSession(req)!;
  const { toAddress, amount } = req.body as { toAddress?: string; amount?: string };
  if (!toAddress || typeof toAddress !== 'string' || !amount || typeof amount !== 'string') {
    return res.status(400).json({ error: 'Missing toAddress or amount' });
  }
  const trimmedAddr = toAddress.trim();
  if (!isValidAddressForActiveNetwork(trimmedAddr)) {
    const networkName = walletNetworkNameFromEnv();
    const hint = networkName === 'testnet'
      ? 'Expected DDACOIN testnet address (legacy m/n/2 or bech32 tdda1...).'
      : 'Expected DDACOIN mainnet address (legacy D or bech32 dda1...).';
    return res.status(400).json({ error: `Invalid address for active network. ${hint}` });
  }
  let amountSubunits: number;
  try {
    amountSubunits = toSubunits(amount);
  } catch {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  if (amountSubunits <= 0) {
    return res.status(400).json({ error: 'Amount must be positive' });
  }
  const rpc = getRpcConfig();
  const txResult = await searchRawTransactionsWithError(rpc, session.address, { count: 500 });
  if ('error' in txResult) {
    return res.status(400).json({ error: txResult.error });
  }
  const { balance, utxos } = balanceFromTxs(txResult.txs, session.address);
  if (balance < amountSubunits) {
    return res.status(400).json({ error: `Insufficient balance. Have ${fromSubunits(balance)} DDACOIN.` });
  }
  const fetchTxHex = (txid: string) => getRawTransactionHex(rpc, txid);
  const signer = session.wif ? { wif: session.wif } : { mnemonic: session.mnemonic! };
  try {
    const hexTx = await buildAndSignTx(
      signer,
      utxos,
      trimmedAddr,
      amountSubunits,
      session.address,
      fetchTxHex
    );
    const result = await sendRawTransaction(rpc, hexTx);
    if ('error' in result) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ txid: result.txid, ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(400).json({ error: msg });
  }
});

// Fallback: serve index for SPA-style routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`DDACOIN wallet listening on http://0.0.0.0:${PORT}`);
});
