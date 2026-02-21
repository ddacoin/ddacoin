/**
 * Wallet core: BIP39/BIP44 HD wallet, DDACOIN P2PKH addresses, build & sign tx.
 */

import { createRequire } from 'node:module';
import * as bip39 from 'bip39';
import BIP32Module from 'bip32';
import * as ecc from 'tiny-secp256k1';
import ECPairModule from 'ecpair';
import * as bitcoin from 'bitcoinjs-lib';
import { getActiveWalletCoinConfig, getActiveWalletNetwork } from './constants/ddacoin.js';
import type { SearchRawTxResult } from './rpc.js';

const require = createRequire(import.meta.url);
const wifDecode = (require('wif') as { decode: (s: string) => { privateKey: Buffer; compressed: boolean } }).decode;

// ESM/CJS: default export may be the factory or { default: factory }
const BIP32Factory = typeof BIP32Module === 'function' ? BIP32Module : (BIP32Module as { default: (e: unknown) => unknown }).default;
const ECPairFactory = typeof ECPairModule === 'function' ? ECPairModule : (ECPairModule as { default: (e: unknown) => unknown }).default;
const bip32 = (BIP32Factory as (e: unknown) => { fromSeed(seed: Buffer): { derivePath(p: string): { privateKey?: Buffer; publicKey: Buffer } } })(ecc);
const ECPair = (ECPairFactory as (e: unknown) => { fromPrivateKey(priv: Buffer, opts?: { network?: unknown; compressed?: boolean }): bitcoin.Signer })(ecc);

function getActiveNetwork(): bitcoin.Network {
  return getActiveWalletNetwork() as bitcoin.Network;
}

/** Generate a new BIP39 mnemonic (12 words) */
export function generateMnemonic(): string {
  return bip39.generateMnemonic(128);
}

/** Validate mnemonic phrase */
export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic);
}

/** Derive first external address (m/44'/56748'/0'/0/0) from mnemonic */
export function getAddressFromMnemonic(mnemonic: string, index = 0): { address: string; pubkey: Buffer; path: string } {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const root = bip32.fromSeed(seed);
  const path = getActiveWalletCoinConfig().bip44Path(index);
  const child = root.derivePath(path);
  if (!child.privateKey) throw new Error('No private key');
  const pubkey = child.publicKey;
  const payment = bitcoin.payments.p2pkh({
    pubkey,
    network: getActiveNetwork(),
  });
  if (!payment.address) throw new Error('Failed to derive address');
  return { address: payment.address, pubkey, path };
}

/** Derive keypair for signing at index (same path as getAddressFromMnemonic) */
function getKeyPairFromMnemonic(mnemonic: string, index: number) {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const root = bip32.fromSeed(seed);
  const child = root.derivePath(getActiveWalletCoinConfig().bip44Path(index));
  if (!child.privateKey) throw new Error('No private key');
  return ECPair.fromPrivateKey(child.privateKey, { network: getActiveNetwork() });
}

function getNetworkForWif(): bitcoin.Network {
  return getActiveNetwork();
}

/** Import from WIF (Wallet Import Format). Accepts any valid WIF; address is always DDACOIN (starts with D). */
export function getAddressFromWif(wifStr: string): { address: string; keypair: bitcoin.Signer } {
  const trimmed = wifStr.trim();
  let decoded: { privateKey: Buffer; compressed: boolean };
  try {
    decoded = wifDecode(trimmed);
  } catch {
    throw new Error('Invalid WIF: bad checksum or format. Check for typos.');
  }
  const keypair = ECPair.fromPrivateKey(decoded.privateKey, {
    compressed: decoded.compressed,
    network: getNetworkForWif(),
  });
  const payment = bitcoin.payments.p2pkh({
    pubkey: keypair.publicKey,
    network: getNetworkForWif(),
  });
  if (!payment.address) throw new Error('Invalid WIF or network');
  return { address: payment.address, keypair };
}

/** Subunits per coin (1 DDACOIN = 10^8) */
export function getSubunitsPerCoin(): number {
  return 10 ** getActiveWalletCoinConfig().decimals;
}

/** Parse amount string (e.g. "1.5") to subunits */
export function toSubunits(amountStr: string): number {
  const n = parseFloat(amountStr);
  if (!Number.isFinite(n) || n < 0) throw new Error('Invalid amount');
  return Math.round(n * getSubunitsPerCoin());
}

/** Format subunits to display string */
export function fromSubunits(subunits: number): string {
  const coin = getActiveWalletCoinConfig();
  return (subunits / getSubunitsPerCoin()).toFixed(coin.decimals).replace(/\.?0+$/, '');
}

export function isValidAddressForActiveNetwork(address: string): boolean {
  try {
    bitcoin.address.toOutputScript(address, getActiveNetwork());
    return true;
  } catch {
    return false;
  }
}

/** Compute spendable balance and UTXOs from searchrawtransactions results for one address */
export function balanceFromTxs(
  txs: SearchRawTxResult[] | null,
  ourAddress: string
): { balance: number; utxos: { txid: string; vout: number; value: number; scriptPubKey: string }[] } {
  if (!txs || !Array.isArray(txs)) return { balance: 0, utxos: [] };
  const spent: Set<string> = new Set();
  const received: { txid: string; vout: number; value: number; scriptPubKey: string }[] = [];
  for (const tx of txs) {
    for (const inp of tx.vin) {
      spent.add(`${inp.txid}:${inp.vout}`);
    }
    for (const out of tx.vout) {
      const addr = out.scriptPubKey.addresses?.[0];
      if (addr === ourAddress) {
        received.push({
          txid: tx.txid,
          vout: out.n,
          value: Math.round(out.value * getSubunitsPerCoin()),
          scriptPubKey: out.scriptPubKey.hex,
        });
      }
    }
  }
  const utxos = received.filter((u) => !spent.has(`${u.txid}:${u.vout}`));
  const balance = utxos.reduce((s, u) => s + u.value, 0);
  return { balance, utxos };
}

/** Fetcher for full tx hex (needed for P2PKH nonWitnessUtxo) */
export type FetchTxHex = (txid: string) => Promise<string | null>;

/** Signer: either mnemonic (BIP39) or WIF (single key). */
export type TxSigner = { mnemonic: string } | { wif: string };

function keyPairFromSigner(signer: TxSigner): bitcoin.Signer {
  if ('mnemonic' in signer) return getKeyPairFromMnemonic(signer.mnemonic, 0);
  return getAddressFromWif(signer.wif).keypair;
}

/** Build and sign a transaction; returns hex for sendrawtransaction. Requires fetchTxHex for P2PKH. */
export async function buildAndSignTx(
  signer: TxSigner,
  utxos: { txid: string; vout: number; value: number; scriptPubKey: string }[],
  recipientAddress: string,
  amountSubunits: number,
  changeAddress: string,
  fetchTxHex: FetchTxHex,
  feePerKb = 1000
): Promise<string> {
  const net = getActiveNetwork();
  const psbt = new bitcoin.Psbt({ network: net });
  let totalIn = 0;
  for (const u of utxos) {
    if (totalIn >= amountSubunits + 50000) break;
    const prevTxHex = await fetchTxHex(u.txid);
    if (!prevTxHex) throw new Error(`Could not fetch previous tx ${u.txid}`);
    totalIn += u.value;
    psbt.addInput({
      hash: Buffer.from(u.txid, 'hex').reverse(),
      index: u.vout,
      nonWitnessUtxo: Buffer.from(prevTxHex, 'hex'),
    });
  }
  if (totalIn < amountSubunits) {
    throw new Error('Insufficient balance');
  }
  const fee = Math.ceil((psbt.data.inputs.length * 148 + 34 + 10) / 1000) * feePerKb;
  const change = totalIn - amountSubunits - fee;
  psbt.addOutput({
    address: recipientAddress,
    value: amountSubunits,
  });
  if (change > 546) {
    psbt.addOutput({
      address: changeAddress,
      value: change,
    });
  } else if (change > 0) {
    throw new Error('Dust change; try sending a bit less');
  }
  const keyPair = keyPairFromSigner(signer);
  for (let i = 0; i < psbt.data.inputs.length; i++) {
    psbt.signInput(i, keyPair);
  }
  psbt.finalizeAllInputs();
  const tx = psbt.extractTransaction();
  return tx.toHex();
}
