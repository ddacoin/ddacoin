package chaincfg

import (
	"testing"
	"time"
)

func TestIsDDACoinNet(t *testing.T) {
	if !IsDDACoinNet(&DDACoinMainNetParams) {
		t.Fatalf("DDACoin mainnet should be DDACOIN-family")
	}
	if !IsDDACoinNet(&DDACoinTestNetParams) {
		t.Fatalf("DDACoin testnet should be DDACOIN-family")
	}
	if IsDDACoinNet(&MainNetParams) {
		t.Fatalf("Bitcoin mainnet should not be DDACOIN-family")
	}
}

func TestDDACoinTestNetSubsidyIsConstant(t *testing.T) {
	start := DDACoinTestNetParams.GenesisBlock.Header.Timestamp.Add(1 * time.Hour)
	later := start.Add(365 * 24 * time.Hour)

	startSubsidy := CalcDDACoinSubsidyForParams(start, &DDACoinTestNetParams)
	laterSubsidy := CalcDDACoinSubsidyForParams(later, &DDACoinTestNetParams)

	if startSubsidy != laterSubsidy {
		t.Fatalf("expected constant subsidy, got %d and %d", startSubsidy, laterSubsidy)
	}
	if startSubsidy != DDACoinTestNetBlockReward {
		t.Fatalf("unexpected subsidy: got %d want %d", startSubsidy, DDACoinTestNetBlockReward)
	}
}
