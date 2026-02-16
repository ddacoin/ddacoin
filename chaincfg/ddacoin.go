// Copyright (c) 2025 DDACOIN
// DDACOIN chain parameters and genesis (time-based consensus, 2M supply, 1h blocks).

package chaincfg

import (
	"bytes"
	"time"

	"github.com/ddacoin/ddacoin/chaincfg/chainhash"
	"github.com/ddacoin/ddacoin/wire"
)

// DDACOIN economic constants (subunits: 1 DDACOIN = 10^8).
const (
	DDACoinMaxSupplySubunits   = 2_000_000 * 100_000_000 // 2M DDACOIN in subunits
	DDACoinBlockTimeSeconds   = 3600                    // 1 hour
	DDACoinHalvingHours       = 17520                   // 2 years
	DDACoinInitialBlockReward = DDACoinMaxSupplySubunits / (DDACoinHalvingHours * 2)
)

// ddacoinGenesisCoinbaseTx is the coinbase transaction for the DDACOIN genesis block.
var ddacoinGenesisCoinbaseTx = wire.MsgTx{
	Version: 1,
	TxIn: []*wire.TxIn{
		{
			PreviousOutPoint: wire.OutPoint{
				Hash:  chainhash.Hash{},
				Index: 0xffffffff,
			},
			SignatureScript: []byte{
				0x04, 0xff, 0xff, 0x00, 0x1d, 0x01, 0x14, 0x44,
				0x44, 0x41, 0x43, 0x4f, 0x49, 0x4e, 0x20, 0x47,
				0x65, 0x6e, 0x65, 0x73, 0x69, 0x73, 0x20, 0x32,
				0x30, 0x32, 0x35, /* DDACOIN Genesis 2025 */
			},
			Sequence: 0xffffffff,
		},
	},
	TxOut: []*wire.TxOut{
		{
			Value:    DDACoinInitialBlockReward,
			PkScript: []byte{0x51}, // OP_TRUE (spendable)
		},
	},
	LockTime: 0,
}

// ddacoinGenesisBlock defines the genesis block for DDACOIN mainnet.
var ddacoinGenesisBlock = wire.MsgBlock{
	Header: wire.BlockHeader{
		Version:    1,
		PrevBlock:  chainhash.Hash{},
		MerkleRoot: chainhash.Hash{}, // set in init()
		Timestamp:  time.Unix(1739664000, 0), // 2025-02-15 00:00:00 UTC
		Bits:       0x207fffff,
		Nonce:      0,
	},
	Transactions: []*wire.MsgTx{&ddacoinGenesisCoinbaseTx},
}

// ddacoinGenesisHash is the hash of the DDACOIN genesis block (set in init).
var ddacoinGenesisHash chainhash.Hash

// CalcDDACoinBlockSubsidy returns the time-based block subsidy for DDACOIN.
// Reward halves every DDACoinHalvingHours. Total minted is capped by DDACoinMaxSupplySubunits.
func CalcDDACoinBlockSubsidy(blockTimestamp, genesisTimestamp time.Time) int64 {
	hoursSinceGenesis := blockTimestamp.Unix() - genesisTimestamp.Unix()
	if hoursSinceGenesis < 0 {
		return 0
	}
	hours := hoursSinceGenesis / 3600
	halvingPeriods := hours / int64(DDACoinHalvingHours)
	reward := int64(DDACoinInitialBlockReward) >> uint(halvingPeriods)
	if reward < 0 {
		return 0
	}
	return reward
}

func init() {
	var buf bytes.Buffer
	_ = ddacoinGenesisCoinbaseTx.Serialize(&buf)
	ddacoinGenesisBlock.Header.MerkleRoot = chainhash.DoubleHashH(buf.Bytes())
	ddacoinGenesisHash = ddacoinGenesisBlock.Header.BlockHash()
}

// DDACoinMainNetParams defines the network parameters for the DDACOIN main network.
var DDACoinMainNetParams = Params{
	Name:        "ddacoin",
	Net:         wire.DDACoinNet,
	DefaultPort: "9666",
	DNSSeeds: []DNSSeed{
		{Host: "ddacoin.kos.engineer", HasFiltering: false},
	},
	GenesisBlock:             &ddacoinGenesisBlock,
	GenesisHash:              &ddacoinGenesisHash,
	PowLimit:                 simNetPowLimit, // not used for PoW; time-based
	PowLimitBits:             0x207fffff,
	PoWNoRetargeting:         true,
	BIP0034Height:            0,
	BIP0065Height:            0,
	BIP0066Height:            0,
	CoinbaseMaturity:         100,
	SubsidyReductionInterval: 0, // time-based subsidy, not block-based
	TargetTimespan:           time.Hour,
	TargetTimePerBlock:       time.Hour,
	RetargetAdjustmentFactor: 4,
	ReduceMinDifficulty:      false,
	MinDiffReductionTime:     0,
	GenerateSupported:        true,
	Checkpoints:              nil,
	RuleChangeActivationThreshold: 0,
	MinerConfirmationWindow:       0,
	Deployments: [DefinedDeployments]ConsensusDeployment{},
	RelayNonStdTxs:           true,
	Bech32HRPSegwit:          "dda",
	PubKeyHashAddrID:         0x1e, // D (base58 first char)
	ScriptHashAddrID:         0x7d,
	PrivateKeyID:             0xbd,
	WitnessPubKeyHashAddrID:  0x0d,
	WitnessScriptHashAddrID:  0x2d,
	HDPrivateKeyID:           [4]byte{0x04, 0x88, 0xad, 0xe5},
	HDPublicKeyID:            [4]byte{0x04, 0x88, 0xb2, 0x1f},
	HDCoinType:               0xddac,
}
