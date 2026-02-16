/**
 * JSON-RPC client for DDACOIN node (btcd-style).
 * Uses getblockcount, searchrawtransactions (requires --addrindex), sendrawtransaction.
 */

export interface RpcConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  /** Use HTTPS (node uses TLS by default). Wallet container should set NODE_TLS_REJECT_UNAUTHORIZED=0 for self-signed cert. */
  useHttps?: boolean;
}

function rpcUrl(config: RpcConfig): string {
  const proto = config.useHttps !== false ? 'https' : 'http';
  return `${proto}://${config.host}:${config.port}`;
}

export interface RpcResponse<T = unknown> {
  result?: T;
  error?: { message: string; code?: number };
}

function friendlyNetworkError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('ECONNREFUSED') || msg.includes('connection refused')) {
    return 'Connection refused. Is the DDACOIN node running and listening on RPC host:port?';
  }
  if (msg.includes('ENOTFOUND') || msg.includes('getaddrinfo')) {
    return 'Cannot resolve RPC host. On Linux try RPC_HOST=172.17.0.1 if the node runs on the host.';
  }
  if (msg.includes('fetch failed') || msg.includes('network')) {
    return 'Network error. Check RPC_HOST and RPC_PORT; ensure the node is reachable from the wallet container.';
  }
  return msg.slice(0, 200);
}

export async function rpcCall<T = unknown>(
  config: RpcConfig,
  method: string,
  params: unknown[] = []
): Promise<RpcResponse<T>> {
  const url = rpcUrl(config);
  const body = JSON.stringify({
    jsonrpc: '1.0',
    id: 1,
    method,
    params,
  });
  const auth = Buffer.from(`${config.user}:${config.pass}`).toString('base64');
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body,
    });
  } catch (err) {
    return { error: { message: friendlyNetworkError(err) } };
  }
  const text = await res.text();
  if (!res.ok) {
    if (res.status === 401) {
      return { error: { message: 'RPC auth failed. Set RPC_USER and RPC_PASS in wallet/.env to match the node.' } };
    }
    return { error: { message: `HTTP ${res.status}: ${text.slice(0, 200)}` } };
  }
  const data = JSON.parse(text) as RpcResponse<T>;
  return data;
}

export async function getBlockCount(config: RpcConfig): Promise<number | null> {
  const out = await rpcCall<number>(config, 'getblockcount', []);
  if (out.error) return null;
  return out.result ?? null;
}

/** Check RPC connectivity and return block height or a clear error message for the UI. */
export async function checkRpcConnection(config: RpcConfig): Promise<
  { ok: true; blockHeight: number } | { ok: false; error: string }
> {
  if (!config.user?.trim() || !config.pass?.trim()) {
    return {
      ok: false,
      error: 'RPC_USER and RPC_PASS are not set. Copy wallet/.env.example to wallet/.env and set them to match the node.',
    };
  }
  const out = await rpcCall<number>(config, 'getblockcount', []);
  if (out.error) {
    return { ok: false, error: out.error.message };
  }
  const height = out.result;
  if (typeof height !== 'number') {
    return { ok: false, error: 'Invalid response from node.' };
  }
  return { ok: true, blockHeight: height };
}

export interface SearchRawTxVin {
  txid: string;
  vout: number;
  scriptSig?: { hex: string };
  sequence: number;
}

export interface SearchRawTxVout {
  value: number;
  n: number;
  scriptPubKey: {
    hex: string;
    addresses?: string[];
  };
}

export interface SearchRawTxResult {
  txid: string;
  hash: string;
  version: number;
  size: number;
  vsize: number;
  locktime: number;
  vin: SearchRawTxVin[];
  vout: SearchRawTxVout[];
  blockhash?: string;
  confirmations?: number;
  time?: number;
  blocktime?: number;
}

/** searchrawtransactions: requires node with --addrindex */
export async function searchRawTransactions(
  config: RpcConfig,
  address: string,
  options: { skip?: number; count?: number; verbose?: number } = {}
): Promise<SearchRawTxResult[] | null> {
  const r = await searchRawTransactionsWithError(config, address, options);
  return 'error' in r ? null : r.txs;
}

/** Same as searchRawTransactions but returns the node's error message when it fails. */
export async function searchRawTransactionsWithError(
  config: RpcConfig,
  address: string,
  options: { skip?: number; count?: number; verbose?: number } = {}
): Promise<{ txs: SearchRawTxResult[] } | { error: string }> {
  const { skip = 0, count = 100, verbose = 1 } = options;
  const out = await rpcCall<SearchRawTxResult[]>(config, 'searchrawtransactions', [
    address,
    verbose,
    skip,
    count,
    0,
    false,
  ]);
  if (out.error) {
    return { error: out.error.message ?? 'searchrawtransactions failed' };
  }
  return { txs: out.result ?? [] };
}

export async function sendRawTransaction(
  config: RpcConfig,
  hexTx: string
): Promise<{ txid: string } | { error: string }> {
  const out = await rpcCall<string>(config, 'sendrawtransaction', [hexTx, false]);
  if (out.error) {
    return { error: out.error.message ?? JSON.stringify(out.error) };
  }
  return { txid: out.result ?? '' };
}

export async function getRawTransaction(
  config: RpcConfig,
  txid: string,
  verbose = true
): Promise<SearchRawTxResult | string | null> {
  const out = await rpcCall<SearchRawTxResult | string>(config, 'getrawtransaction', [txid, verbose]);
  if (out.error) return null;
  return out.result ?? null;
}

/** Get raw transaction hex (verbose=0) for signing inputs */
export async function getRawTransactionHex(config: RpcConfig, txid: string): Promise<string | null> {
  const out = await rpcCall<string>(config, 'getrawtransaction', [txid, 0]);
  if (out.error) return null;
  return out.result ?? null;
}
