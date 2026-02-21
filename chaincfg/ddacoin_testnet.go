// Copyright (c) 2026 DDACOIN

package chaincfg

import (
	"bytes"
	"time"

	"github.com/ddacoin/ddacoin/chaincfg/chainhash"
	"github.com/ddacoin/ddacoin/wire"
)

var ddacoinTestNetGenesisCoinbaseTx = wire.MsgTx{
	Version: 1,
	TxIn: []*wire.TxIn{
		{
			PreviousOutPoint: wire.OutPoint{
				Hash:  chainhash.Hash{},
				Index: 0xffffffff,
			},
			SignatureScript: []byte{
				0x04, 0xff, 0xff, 0x00, 0x1d, 0x01, 0x1b, 0x44,
				0x44, 0x41, 0x43, 0x4f, 0x49, 0x4e, 0x20, 0x54,
				0x45, 0x53, 0x54, 0x4e, 0x45, 0x54, 0x20, 0x47,
				0x65, 0x6e, 0x65, 0x73, 0x69, 0x73, 0x20, 0x32,
				0x30, 0x32, 0x36, /* DDACOIN TESTNET Genesis 2026 */
			},
			Sequence: 0xffffffff,
		},
	},
	TxOut: []*wire.TxOut{
		{
			Value:    DDACoinTestNetBlockReward,
			PkScript: []byte{0x51}, // OP_TRUE (spendable)
		},
	},
	LockTime: 0,
}

var ddacoinTestNetGenesisBlock = wire.MsgBlock{
	Header: wire.BlockHeader{
		Version:    1,
		PrevBlock:  chainhash.Hash{},
		MerkleRoot: chainhash.Hash{}, // set in init()
		Timestamp:  time.Unix(1767225600, 0), // 2026-01-01 00:00:00 UTC
		Bits:       0x207fffff,
		Nonce:      0,
	},
	Transactions: []*wire.MsgTx{&ddacoinTestNetGenesisCoinbaseTx},
}

var ddacoinTestNetGenesisHash chainhash.Hash

func init() {
	var buf bytes.Buffer
	_ = ddacoinTestNetGenesisCoinbaseTx.Serialize(&buf)
	ddacoinTestNetGenesisBlock.Header.MerkleRoot = chainhash.DoubleHashH(buf.Bytes())
	ddacoinTestNetGenesisHash = ddacoinTestNetGenesisBlock.Header.BlockHash()
}

// DDACoinTestNetParams defines the network parameters for DDACOIN testnet.
var DDACoinTestNetParams = Params{
	Name:        "ddacoin-testnet",
	Net:         wire.DDACoinTestNet,
	DefaultPort: "19666",
	DNSSeeds: []DNSSeed{
		{Host: "ddacoinminer01.testnet.kos.engineer", HasFiltering: false},
		{Host: "ddacoinminer02.testnet.kos.engineer", HasFiltering: false},
	},

	GenesisBlock:             &ddacoinTestNetGenesisBlock,
	GenesisHash:              &ddacoinTestNetGenesisHash,
	PowLimit:                 simNetPowLimit,
	PowLimitBits:             0x207fffff,
	PoWNoRetargeting:         true,
	BIP0034Height:            0,
	BIP0065Height:            0,
	BIP0066Height:            0,
	CoinbaseMaturity:         100,
	SubsidyReductionInterval: 0, // DDACOIN-family uses time-based subsidy.
	TargetTimespan:           time.Hour,
	TargetTimePerBlock:       time.Hour,
	RetargetAdjustmentFactor: 4,
	ReduceMinDifficulty:      false,
	MinDiffReductionTime:     0,
	GenerateSupported:        true,
	Checkpoints:              nil,

	RuleChangeActivationThreshold: 0,
	MinerConfirmationWindow:       0,
	Deployments:                   [DefinedDeployments]ConsensusDeployment{},

	RelayNonStdTxs: true,

	Bech32HRPSegwit: "tdda",

	PubKeyHashAddrID:        0x6f,
	ScriptHashAddrID:        0xc4,
	PrivateKeyID:            0xef,
	WitnessPubKeyHashAddrID: 0x03,
	WitnessScriptHashAddrID: 0x28,

	HDPrivateKeyID: [4]byte{0x04, 0x35, 0x83, 0x94},
	HDPublicKeyID:  [4]byte{0x04, 0x35, 0x87, 0xcf},

	HDCoinType: 1,
}
