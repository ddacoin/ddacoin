# DDACOIN

DDACOIN is a [btcd](https://github.com/btcsuite/btcd) fork that replaces proof-of-work with **time-based consensus**: a block is valid if its timestamp is at least 1 hour after the previous block and not in the future; the first peer to submit a valid block wins. No mining puzzle.

- **Max supply:** 2,000,000 DDACOIN (1 DDACOIN = 10^8 subunits)
- **Block time:** 1 hour (3600 seconds)
- **Halving:** Time-based (e.g. every 2 years)
- **P2P port:** 9666
- **Fallback peer:** `ddacoin.kos.engineer:9666`
- **RPC port:** 9667 (when enabled)

This repository includes:

- **Node** (this directory) – DDACOIN full node and RPC server
- **[Wallet](wallet/)** – Web wallet (HD/BIP39, P2PKH addresses, send/receive) – see [wallet/README.md](wallet/README.md)
- **[Explorer](explorer/)** – PHP blockchain explorer (blocks, transactions, chain info) – see [explorer/README.md](explorer/README.md)

## Requirements

[Go](https://golang.org) 1.22 or newer.

## Build

```bash
go build -o ddacoin-node .
# or
go install -v . ./cmd/...
# binary: ddacoin (or ddacoin-node if built as above)
```

## Run (binary)

```bash
# Data directory (default: platform-specific, e.g. ~/.btcd)
./ddacoin-node -b /path/to/data

# Listen on default P2P port 9666; fallback peer ddacoin.kos.engineer is used when no other peers are available.
# Optional: enable built-in block producer (requires at least one payment address)
./ddacoin-node -b /path/to/data --generate --miningaddr=<address>
```

## Run (Docker)

```bash
# Build image
docker build . -t ddacoin

# Run node (persist chain in volume)
docker run -v ddacoin-data:/data -p 9666:9666 -p 9667:9667 ddacoin

# With block producer
docker run -v ddacoin-data:/data -p 9666:9666 -p 9667:9667 \
  ddacoin -b /data --generate --miningaddr=<address>
```

## Docker Compose

Copy `.env.example` to `.env` and set `RPC_USER`, `RPC_PASS`, and `MINING_ADDR` (mining payout address). Then:

```bash
docker compose up -d
```

P2P: 9666, RPC: 9667, data: volume ddacoin-data. The node runs with RPC and the built-in block producer; credentials in `.env` are used by the explorer as well.

## Network

- **P2P:** Port **9666**. Connect to other nodes or use the hardcoded fallback **ddacoin.kos.engineer:9666** when no other peers are available.
- **RPC:** Port **9667** (when configured with rpcuser/rpcpass or similar).

## Wallet

A web wallet lives in the [wallet/](wallet/) directory. It provides an HD wallet (BIP39/BIP44), P2PKH addresses (starting with **D**), balance and send via the node RPC. Run it with Docker from `wallet/` (see [wallet/README.md](wallet/README.md)). The node must have RPC enabled and `--addrindex` for balance and history.

## Explorer

A PHP-based blockchain explorer lives in [explorer/](explorer/). It shows chain info, latest blocks, block details, and transactions. Run it with Docker from `explorer/` (see [explorer/README.md](explorer/README.md)). It connects to the node’s RPC (port 9667).

## License

ISC (see [LICENSE](LICENSE)).