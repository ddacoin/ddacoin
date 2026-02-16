// Copyright (c) 2025 DDACOIN
// genaddress generates a new DDACOIN P2PKH address and WIF for mining payout.

package main

import (
	"fmt"
	"os"

	"github.com/ddacoin/ddacoin/btcec/v2"
	"github.com/ddacoin/ddacoin/btcutil"
	"github.com/ddacoin/ddacoin/chaincfg"
)

func main() {
	priv, err := btcec.NewPrivateKey()
	if err != nil {
		fmt.Fprintln(os.Stderr, "Failed to generate private key:", err)
		os.Exit(1)
	}

	pub := priv.PubKey()
	pubHash := btcutil.Hash160(pub.SerializeCompressed())
	addr, err := btcutil.NewAddressPubKeyHash(pubHash, &chaincfg.DDACoinMainNetParams)
	if err != nil {
		fmt.Fprintln(os.Stderr, "Failed to create address:", err)
		os.Exit(1)
	}

	wif, err := btcutil.NewWIF(priv, &chaincfg.DDACoinMainNetParams, true)
	if err != nil {
		fmt.Fprintln(os.Stderr, "Failed to create WIF:", err)
		os.Exit(1)
	}

	fmt.Println("Address:", addr.String())
	fmt.Println("WIF (backup):", wif.String())
}
