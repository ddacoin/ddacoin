# DDACOIN

DDACOIN is a [btcd](https://github.com/btcsuite/btcd) fork that replaces proof-of-work with **time-based consensus**: a block is valid if its timestamp is at least 1 hour after the previous block and not in the future; the first peer to submit a valid block wins. No mining puzzle.

- **Max supply:** 2,000,000 DDACOIN (1 DDACOIN = 10^8 subunits)
- **Block time:** 1 hour (3600 seconds)
- **Halving:** Time-based (e.g. every 2 years)
- **P2P port:** 9666
- **Fallback peer:** `ddacoin.kos.engineer:9666`
- **RPC port:** 9667 (when enabled)

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

```bash
docker compose up -d
# P2P: 9666, RPC: 9667, data: volume ddacoin-data
# To run with block producer, override command in docker-compose.yml (see file comments).
```

## Network

- **P2P:** Port **9666**. Connect to other nodes or use the hardcoded fallback **ddacoin.kos.engineer:9666** when no other peers are available.
- **RPC:** Port **9667** (when configured with rpcuser/rpcpass or similar).

## Wallet

This node does not include a wallet. Use [btcwallet](https://github.com/btcsuite/btcwallet) against DDACOIN, or a minimal CLI can be added in a later phase.

## License

ISC (see [LICENSE](LICENSE)).