# DDACOIN (Docker-only usage)

DDACOIN is a [btcd](https://github.com/btcsuite/btcd) fork that replaces proof‑of‑work with **time‑based consensus**: a block is valid if its timestamp is at least 1 hour after the previous block and not in the future; the first peer to submit a valid block wins. There is **no mining puzzle**.

- **Max supply:** 2,000,000 DDACOIN (1 DDACOIN = 10^8 subunits)  
- **Block time:** 1 hour (3600 seconds)  
- **P2P port:** 9666  
- **RPC port:** 9667 (when enabled)  

This repository includes:

- **Node** – DDACOIN full node and RPC server (this directory)
- **Wallet** – Web wallet (HD/BIP39, send/receive) in `wallet/`
- **Explorer** – PHP blockchain explorer in `explorer/`

This README describes **only Docker-based usage of the node**, including how to **create a DDACOIN address** for mining.

---

## 1. Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/) (v2+)

Clone the repository:

```bash
git clone https://github.com/your-org/ddacoin.git
cd ddacoin
```

---

## 2. Environment file

Copy the example environment file and set your credentials:

```bash
cp .env.example .env
```

Edit `.env` and set at least:

- `RPC_USER` – RPC username  
- `RPC_PASS` – RPC password  

If you want to **mine / produce blocks**, you will also need:

- `MINING_ADDR` – a DDACOIN address (see next section)

---

## 3. Creating a DDACOIN address (for `MINING_ADDR`)

You can generate a DDACOIN address **using Docker**, without needing Go installed on your host.

### 3.1 Using Docker to run `genaddress` (recommended)

From the project root:

```bash
docker run --rm \
  -e GOTOOLCHAIN=go1.23.4 \
  -v "$PWD":/src \
  -w /src \
  golang:1.22 \
  go run ./cmd/genaddress
```

This prints something like:

- A **DDACOIN address** (starts with `D`)
- A **WIF private key**

Use the printed **address** as your `MINING_ADDR` value in `.env`, for example:

```env
MINING_ADDR=DP3s7GpEPuiuJZGnRKH1DBQr3mgDVo9Afz
```

**Important:**

- Back up the **WIF private key** securely (offline, password manager, paper, etc.).  
- Do **not** share the WIF; anyone with it can spend your coins.

### 3.2 (Optional) Using the web wallet

Alternatively, you can:

1. Run the web wallet (see `wallet/README.md`).  
2. Create a new wallet and copy one of its **receive addresses**.  
3. Use that address as `MINING_ADDR` in `.env`.  

---

## 4. Running the node with Docker Compose

DDACOIN comes with a `docker-compose.yml` that runs the node in Docker and stores blockchain data in a named volume.

### 4.1 Miner mode (default)

**Miner mode** runs a full node **and** produces blocks, paying rewards to `MINING_ADDR`.

Requirements:

- `.env` file with:  
  - `RPC_USER`, `RPC_PASS`  
  - `MINING_ADDR` (as created in section 3)

Start the node:

```bash
docker compose up -d
```

This will:

- Build and run the `ddacoin` image (if not already built).  
- Expose:  
  - **P2P** on `9666`  
  - **RPC** on `9667`  
- Use the `ddacoin-data` volume for persistent blockchain data.  
- Start the node with:  
  - Block production enabled (`--generate`)  
  - Mining address set from `MINING_ADDR`  
  - Indexes enabled (`--txindex`, `--addrindex`)  
  - RPC listening on `0.0.0.0:9667`  

Check logs:

```bash
docker compose logs -f ddacoin
```

Stop the node:

```bash
docker compose down
```

Data in the `ddacoin-data` volume is preserved across restarts.

### 4.2 Node‑only mode (no mining)

If you want a node that **syncs and relays blocks/transactions** but **does not produce blocks**, use the node‑only override file.

Start in node‑only mode:

```bash
docker compose -f docker-compose.yml -f docker-compose.node.yml up -d
```

In this mode:

- `MINING_ADDR` is **not** required.  
- The node does **not** run `--generate`.  
- P2P/RPC ports and data volume are the same:  
  - P2P: `9666`  
  - RPC: `9667`  
  - Volume: `ddacoin-data`  

---

## 5. Generating addresses or keys later

If you already have the node running (e.g. via `docker compose up -d`), you can still generate **additional payout addresses**.

The simplest way is to **re‑run the Docker `genaddress` helper** from section 3.1 in another terminal:

```bash
cd /path/to/ddacoin
docker run --rm \
  -e GOTOOLCHAIN=go1.23.4 \
  -v "$PWD":/src \
  -w /src \
  golang:1.22 \
  go run ./cmd/genaddress
```

Take the new **address** for payouts, and back up the **WIF** securely (offline, password manager, paper, etc.).

---

## 6. Network overview (for Docker users)

- **P2P:** Port **9666** (mapped from the container). This is the port you typically expose to the public internet so other DDACOIN nodes can connect to you. Nodes connect to peers and/or use DNS seeds:  
  - `ddacoinminer01.kos.engineer:9666`  
  - `ddacoinminer02.kos.engineer:9666`  
- **RPC:** Port **9667** (mapped from the container). **Do not expose this port directly to the public internet.** Keep it firewalled or bound to a private network, and access it only from:  
  - Wallet (from `wallet/`)  
  - Explorer (from `explorer/`)  
  - Your own tools/scripts  

With Docker Compose, services on the `ddacoin-net` network can reach the node at host `ddacoin-node:9667` without opening the RPC port to the wider internet.

---

## 7. Wallet and Explorer (Docker)

The **web wallet** and **explorer** have their own Docker setups and READMEs:

- `wallet/` – Web wallet; see `wallet/README.md` for Docker instructions.  
- `explorer/` – PHP explorer; see `explorer/README.md` for Docker instructions.  

They are designed to connect to the node’s RPC endpoint exposed on port `9667`.

---

## 8. Donate

If you’d like to support DDACOIN development, you can send DDACOIN to:

**`DP3s7GpEPuiuJZGnRKH1DBQr3mgDVo9Afz`**

---

## 9. License

ISC (see `LICENSE`).