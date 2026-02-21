/**
 * DDACOIN network parameters (mirrors chaincfg/ddacoin.go).
 * P2PKH addresses start with "D" (PubKeyHashAddrID 0x1e).
 */

export const DDACOIN = {
  /** 1 DDACOIN = 10^8 subunits (like Bitcoin) */
  decimals: 8,
  /** BIP44 coin type (0xddac = 56748) */
  coinType: 0xddac,
  /** Derivation path: m/44'/56748'/0'/0/index */
  bip44Path: (index: number) => `m/44'/56748'/0'/0/${index}`,
} as const;

/** Bitcoinjs-lib network object for DDACOIN mainnet (matches chaincfg/ddacoin.go) */
export const ddacoinNetwork = {
  messagePrefix: '\x18DDACOIN Signed Message:\n',
  bech32: 'dda',
  bip32: {
    public: 0x0488b21f,
    private: 0x0488ade5,
  },
  pubKeyHash: 0x1e,   // P2PKH -> "D" (0x3d gives "R"; 0x1e/0x1f/0x20 give "D")
  scriptHash: 0x7d,
  wif: 0xbd,
};

/** Bitcoinjs-lib network object for DDACOIN testnet (matches chaincfg/ddacoin_testnet.go) */
export const ddacoinTestnetNetwork = {
  messagePrefix: '\x18DDACOIN Signed Message:\n',
  bech32: 'tdda',
  bip32: {
    public: 0x043587cf,
    private: 0x04358394,
  },
  pubKeyHash: 0x6f,
  scriptHash: 0xc4,
  wif: 0xef,
};

/** Networks that decode to DDACOIN addresses (for WIF import). Accept DDACOIN (0xbd), Bitcoin mainnet (0x80), and testnet (0xef) WIFs. */
export const wifImportNetworks = [
  ddacoinNetwork,
  { ...ddacoinNetwork, wif: 0x80 } as typeof ddacoinNetwork,  // Bitcoin mainnet WIF
  { ...ddacoinNetwork, wif: 0xef } as typeof ddacoinNetwork,  // Testnet WIF
];

export const RPC_DEFAULT_PORT = 9667;
