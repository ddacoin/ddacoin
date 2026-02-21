import assert from 'node:assert/strict';
import test from 'node:test';
import * as bitcoin from 'bitcoinjs-lib';

import { ddacoinNetwork, ddacoinTestnetNetwork } from './constants/ddacoin.js';
import { isValidAddressForActiveNetwork } from './wallet.js';

function withEnv<T>(key: string, value: string | undefined, fn: () => T): T {
  const prev = process.env[key];
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
  try {
    return fn();
  } finally {
    if (prev === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = prev;
    }
  }
}

function sampleLegacyAddress(network: bitcoin.Network, byte: number): string {
  const p2pkh = bitcoin.payments.p2pkh({
    hash: Buffer.alloc(20, byte),
    network,
  });
  if (!p2pkh.address) throw new Error('failed to build sample legacy address');
  return p2pkh.address;
}

function sampleBech32Address(network: bitcoin.Network, byte: number): string {
  const p2wpkh = bitcoin.payments.p2wpkh({
    hash: Buffer.alloc(20, byte),
    network,
  });
  if (!p2wpkh.address) throw new Error('failed to build sample bech32 address');
  return p2wpkh.address;
}

test('mainnet accepts only mainnet addresses', () => {
  const mainLegacy = sampleLegacyAddress(ddacoinNetwork as bitcoin.Network, 0x11);
  const testLegacy = sampleLegacyAddress(ddacoinTestnetNetwork as bitcoin.Network, 0x22);
  const mainBech32 = sampleBech32Address(ddacoinNetwork as bitcoin.Network, 0x33);

  withEnv('DDACOIN_NETWORK', 'mainnet', () => {
    assert.equal(isValidAddressForActiveNetwork(mainLegacy), true);
    assert.equal(isValidAddressForActiveNetwork(mainBech32), true);
    assert.equal(isValidAddressForActiveNetwork(testLegacy), false);
  });
});

test('testnet accepts legacy and bech32 testnet addresses', () => {
  const testLegacy = sampleLegacyAddress(ddacoinTestnetNetwork as bitcoin.Network, 0x44);
  const testBech32 = sampleBech32Address(ddacoinTestnetNetwork as bitcoin.Network, 0x55);
  const mainLegacy = sampleLegacyAddress(ddacoinNetwork as bitcoin.Network, 0x66);

  withEnv('DDACOIN_NETWORK', 'testnet', () => {
    assert.equal(isValidAddressForActiveNetwork(testLegacy), true);
    assert.equal(isValidAddressForActiveNetwork(testBech32), true);
    assert.equal(isValidAddressForActiveNetwork(mainLegacy), false);
  });
});
