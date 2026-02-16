/**
 * Generate one DDACOIN P2PKH address and WIF (no Go required). Run: node scripts/gen-address.mjs
 */
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import ECPairModule from 'ecpair';

const ECPair = ECPairModule.default(ecc);

const ddacoinNetwork = {
  messagePrefix: '\x18DDACOIN Signed Message:\n',
  bech32: 'dda',
  bip32: { public: 0x0488b21f, private: 0x0488ade5 },
  pubKeyHash: 0x3d,
  scriptHash: 0x7d,
  wif: 0xbd,
};

const keypair = ECPair.makeRandom({ network: ddacoinNetwork });
const payment = bitcoin.payments.p2pkh({
  pubkey: keypair.publicKey,
  network: ddacoinNetwork,
});
const address = payment.address;
const wif = keypair.toWIF();

console.log('Address:', address);
console.log('WIF (backup):', wif);
