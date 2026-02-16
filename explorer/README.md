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

`.env` is not committed; use `.env.example` as a template.

## Pages

- **/** – Chain summary and latest blocks
- **block.php?height=N** or **block.php?hash=H** – Block detail and list of transactions
- **tx.php?id=TXID** – Transaction detail (inputs/outputs)

## License

Same as DDACOIN project.
