// Copyright (c) 2025 DDACOIN
// genaddress generates a new DDACOIN P2PKH address and WIF for mining payout.

package main

import (
	"flag"
	"fmt"
	"os"

	"github.com/ddacoin/ddacoin/btcec/v2"
	"github.com/ddacoin/ddacoin/btcutil"
	"github.com/ddacoin/ddacoin/chaincfg"
)

func main() {
	testnet := flag.Bool("ddacointestnet", false, "generate address for DDACOIN testnet")
	flag.Parse()

	chainParams := &chaincfg.DDACoinMainNetParams
	if *testnet {
		chainParams = &chaincfg.DDACoinTestNetParams
	}

	priv, err := btcec.NewPrivateKey()
	if err != nil {
		fmt.Fprintln(os.Stderr, "Failed to generate private key:", err)
		os.Exit(1)
	}

	pub := priv.PubKey()
	pubHash := btcutil.Hash160(pub.SerializeCompressed())
	addr, err := btcutil.NewAddressPubKeyHash(pubHash, chainParams)
	if err != nil {
		fmt.Fprintln(os.Stderr, "Failed to create address:", err)
		os.Exit(1)
	}

	wif, err := btcutil.NewWIF(priv, chainParams, true)
	if err != nil {
		fmt.Fprintln(os.Stderr, "Failed to create WIF:", err)
		os.Exit(1)
	}

	fmt.Println("Address:", addr.String())
	fmt.Println("WIF (backup):", wif.String())
}
