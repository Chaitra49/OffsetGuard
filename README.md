# OffsetGuard — Backend + Blockchain (Ganache)

## Step 1 — Start Ganache

**Ganache GUI:** Open app → Quickstart. Note RPC Server (default `http://127.0.0.1:7545`) and Chain ID (default `1337`). Click the 🔑 key icon next to any account to copy its private key.

**ganache CLI:**
```bash
npm install -g ganache
ganache --port 8545 --chain.chainId 1337
```

---

## Step 2 — Deploy the Smart Contract

```bash
cd blockchain
npm install
cp .env.example .env          # fill GANACHE_URL, GANACHE_CHAIN_ID, OWNER_PRIVATE_KEY
npm run compile
npm test                       # runs on built-in Hardhat node, no Ganache needed
npm run deploy:ganache         # deploys to your running Ganache
```

Output will print:
```
CONTRACT_ADDRESS=0xABC123...
POLYGON_RPC_URL=http://127.0.0.1:7545
NETWORK_NAME=ganache
```
Copy those into `backend/.env`.

---

## Step 3 — Run the Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env           # paste CONTRACT_ADDRESS, OWNER_PRIVATE_KEY, OWNER_ADDRESS
cp /path/to/best.pt models/best.pt
uvicorn main:app --reload      # http://localhost:8000  |  docs: /docs
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/verify-plantation` | GEE NDVI plantation verification |
| `POST` | `/run-yolo` | Tree detection with YOLO |
| `POST` | `/mint-nft` | Mint ERC-721 on Ganache |
| `GET`  | `/health` | Health check |

### /mint-nft body (JSON)
```json
{
  "company_name": "GreenTech Corp",
  "co2_offset_tons": 150.5,
  "latitude": 12.9716,
  "longitude": 77.5946,
  "verification_status": "verified",
  "tree_count": 412,
  "recipient_address": "0xOptionalGanacheAddress"
}
```

---

## Environment Variables

### backend/.env
| Variable | Description |
|----------|-------------|
| `YOLO_MODEL_PATH` | Path to YOLO `.pt` weights (default: `models/best.pt`) |
| `GANACHE_URL` | Ganache RPC (default: `http://127.0.0.1:7545`) |
| `CONTRACT_ADDRESS` | From deploy script output |
| `OWNER_PRIVATE_KEY` | Ganache account private key |
| `OWNER_ADDRESS` | Ganache account address |

### blockchain/.env
| Variable | Description |
|----------|-------------|
| `GANACHE_URL` | Ganache RPC URL |
| `GANACHE_CHAIN_ID` | Chain ID from Ganache (default: `1337`) |
| `OWNER_PRIVATE_KEY` | Ganache account private key |
