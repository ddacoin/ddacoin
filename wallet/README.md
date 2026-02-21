# DDACOIN Wallet

Web wallet for DDACOIN: HD wallet (BIP39/BIP44), balance and send via node RPC. Runs in Docker so the host OS does not matter.

## Requirements

- A DDACOIN node with **RPC enabled** and **--addrindex** (required for balance and history).
- Docker and Docker Compose.

## Quick start

1. Copy `.env.example` to `.env` and set `RPC_USER` / `RPC_PASS` to match the node’s RPC credentials.
2. From this directory: `docker compose up -d`
3. Open **http://localhost:3080** (or the port set as `WALLET_PORT` in `.env`).
4. Create a new wallet (back up the 12-word phrase), restore from a phrase, or **import from private key (WIF)** if you only have a key (e.g. from `ddacoin genaddress`).

## Where are my keys stored?

- **By default, keys are only in memory.** The 12-word recovery phrase (mnemonic) is shown once when you create a wallet; it is then kept in a server-side session (in RAM) until you log out or the container restarts. **Nothing is written to disk.** You must back up the phrase yourself; without it, you cannot recover the wallet after a restart.
- **Docker volume** – The wallet container mounts a volume at `/data` (e.g. `wallet-data`). This is reserved for optional future use (e.g. encrypted preferences). No keys or mnemonics are stored there in the current version.
- **Excluded from git** – Any wallet data or key files (e.g. `wallet/data/`, `wallet/*-state.json`, `wallet/.env`) are listed in the repo’s `.gitignore` and must not be committed.

## Configuration (`.env`)

- **RPC_HOST** – Node host (defaults by network: `ddacoin-node` mainnet, `ddacoin-testnet-node` testnet).
- **DDACOIN_NETWORK** – `mainnet` (default) or `testnet`.
- **WALLET_CONTAINER_NAME** – Wallet container name (`ddacoin-wallet` mainnet, `ddacoin-testnet-wallet` testnet recommended).
- **NODE_DOCKER_NETWORK** – External Docker network shared with node (`ddacoin-net` mainnet, `ddacoin-testnet-net` testnet).
- **RPC_PORT** – Node RPC port (defaults by network: `9667` mainnet, `19667` testnet).
- **RPC_USER** / **RPC_PASS** – Must match the node’s `--rpcuser` / `--rpcpass`.
- **WALLET_PORT** – Host port for the wallet UI/API (default `3080`).

`.env` is not committed; use `.env.example` as a template.

### Cannot reach node?

1. **Start the node** – From the repo root: `docker compose up -d` (or ensure the node is running).
2. **Create `wallet/.env`** – Copy `wallet/.env.example` to `wallet/.env` and set `RPC_USER` and `RPC_PASS` to the same values as the node (e.g. from the root `.env`).
3. **Node must listen on all interfaces** – Mainnet default is `--rpclisten=0.0.0.0:9667`; testnet is `--rpclisten=0.0.0.0:19667`.
4. **On Linux** – If the wallet cannot resolve `host.docker.internal`, set `RPC_HOST=172.17.0.1` in `wallet/.env`.

For testnet via Docker service name, use:

- `DDACOIN_NETWORK=testnet`
- `WALLET_CONTAINER_NAME=ddacoin-testnet-wallet`
- `NODE_DOCKER_NETWORK=ddacoin-testnet-net`
- `RPC_HOST=ddacoin-testnet-node`
- `RPC_USER` / `RPC_PASS` matching `.env.testnet`

### Address formats by network

- **Mainnet** accepts DDACOIN mainnet addresses (`D...` legacy or `dda1...` bech32).
- **Testnet** accepts DDACOIN testnet addresses (`m/n/2...` legacy or `tdda1...` bech32).

## Development (without Docker)

```bash
npm install
npm run build
npm start
```

Or `npm run dev` to run with tsx (no build step). Set `RPC_HOST=localhost` (or your node host) and `RPC_USER` / `RPC_PASS` in the environment.
