# DDACOIN Explorer

PHP-based blockchain explorer for DDACOIN. Shows chain info, latest blocks, block details, and transactions.

## Requirements

- The DDACOIN node must have **RPC enabled** (set `RPC_USER` and `RPC_PASS` in the node’s `.env`; see repo root).
- The explorer must be able to reach the node’s RPC port (default **9667**).

## Run with Docker Compose

Copy `.env.example` to `.env` and set `RPC_USER` / `RPC_PASS` to match the node’s `.env`. Then:

```bash
docker compose up -d
```

Open **http://localhost:9080** (or the port set as `EXPLORER_PORT` in `.env`).

### Configuration (`.env`)

| Variable                 | Default             | Description                                                     |
|--------------------------|---------------------|-----------------------------------------------------------------|
| `DDACOIN_NETWORK`        | `mainnet`           | Explorer mode: `mainnet` or `testnet`                           |
| `EXPLORER_CONTAINER_NAME`| `ddacoin-explorer`  | Container name (`ddacoin-testnet-explorer` recommended for testnet) |
| `NODE_DOCKER_NETWORK`    | `ddacoin-net`       | Shared node network (`ddacoin-testnet-net` for testnet)         |
| `RPC_HOST`               | (auto by network)   | Node host (`ddacoin-node` mainnet, `ddacoin-testnet-node` testnet) |
| `RPC_PORT`               | (auto by network)   | Node RPC port (`9667` mainnet, `19667` testnet)                 |
| `RPC_USER`               | (required)          | Must match node’s RPC user                                      |
| `RPC_PASS`               | (required)          | Must match node’s RPC password                                  |
| `EXPLORER_PORT`          | `9080`              | Host port for the explorer UI                                   |

Optional: `RPC_URL` overrides host/port (e.g. `https://user:pass@ddacoin-node:9667`).  
`.env` is not committed; use `.env.example` as a template.

### Testnet side-by-side setup

To run explorer for testnet without conflicting with mainnet explorer:

- `DDACOIN_NETWORK=testnet`
- `EXPLORER_CONTAINER_NAME=ddacoin-testnet-explorer`
- `NODE_DOCKER_NETWORK=ddacoin-testnet-net`
- `RPC_HOST=ddacoin-testnet-node`
- `EXPLORER_PORT=19080` (optional, if mainnet explorer already uses `9080`)

### "Could not connect to node"

1. **Node must have RPC enabled:** start ddacoin with e.g. `--rpcuser=user --rpcpass=pass` (and `--rpclisten=0.0.0.0:<rpc-port>` if explorer is in another container/host). Set `RPC_USER` / `RPC_PASS` in explorer `.env` to match.
2. **Reachability:** from explorer container, node must be reachable at `RPC_HOST:RPC_PORT`. If node runs in another container, use service name and the same Docker network (`ddacoin-net` mainnet, `ddacoin-testnet-net` testnet). If node runs on host, use host IP (Linux often `172.17.0.1`).

## Pages

- **/** – Chain summary and latest blocks
- **block.php?height=N** or **block.php?hash=H** – Block detail and list of transactions
- **tx.php?id=TXID** – Transaction detail (inputs/outputs)

## License

Same as DDACOIN project.
