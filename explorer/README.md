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

| Variable        | Default                  | Description                         |
|-----------------|--------------------------|-------------------------------------|
| `RPC_HOST`      | `host.docker.internal`   | Node host (when using Docker)       |
| `RPC_PORT`      | `9667`                   | Node RPC port                       |
| `RPC_USER`      | (required)               | Must match node’s RPC user          |
| `RPC_PASS`      | (required)               | Must match node’s RPC password     |
| `EXPLORER_PORT` | `9080`                   | Host port for the explorer UI       |

Optional: `RPC_URL` overrides host/port (e.g. `http://user:pass@host.docker.internal:9667`).  
`.env` is not committed; use `.env.example` as a template.

### "Could not connect to node"

1. **Node must have RPC enabled:** start ddacoin with e.g. `--rpcuser=user --rpcpass=pass` (and `--rpclisten=0.0.0.0:9667` if the explorer is in another container/host). Set `RPC_USER` / `RPC_PASS` in the explorer’s `.env` to match.
2. **Reachability:** from the explorer container, the node must be reachable at `RPC_HOST:RPC_PORT`. When the explorer runs in Docker and the node on the host, use `RPC_HOST=host.docker.internal` (or on Linux try `172.17.0.1`). If the node runs in another container, use that service name and put both in the same Docker network.

## Pages

- **/** – Chain summary and latest blocks
- **block.php?height=N** or **block.php?hash=H** – Block detail and list of transactions
- **tx.php?id=TXID** – Transaction detail (inputs/outputs)

## License

Same as DDACOIN project.
