/**
 * Simple file-based persistence for wallet state (encrypted mnemonic optional).
 * For Docker we persist to /data; keys kept in memory only by default for security.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const DATA_DIR = process.env.WALLET_DATA_DIR || '/data';
const STATE_FILE = `${DATA_DIR}/wallet-state.json`;

export interface WalletState {
  /** Base64-encoded encrypted mnemonic (optional; if absent, wallet is in-memory only) */
  encryptedMnemonic?: string;
  /** First derived address (so we can show it without decrypting) */
  address?: string;
  /** Last used RPC config (host/port only, no password in plaintext recommended) */
  rpcHost?: string;
  rpcPort?: number;
}

export function loadState(): WalletState | null {
  try {
    if (existsSync(STATE_FILE)) {
      const raw = readFileSync(STATE_FILE, 'utf-8');
      return JSON.parse(raw) as WalletState;
    }
  } catch {
    // ignore
  }
  return null;
}

export function saveState(state: WalletState): void {
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 0));
  } catch (e) {
    console.error('Failed to save wallet state:', e);
  }
}
