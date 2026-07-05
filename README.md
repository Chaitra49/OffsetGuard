# 🌱 OffsetGuard

**OffsetGuard** is an AI-powered carbon offset verification platform that combines **computer vision**, **satellite imagery analysis**, and **blockchain technology** to verify tree plantations and issue tamper-proof NFT certificates.

The system uses **YOLO** for tree detection, **Google Earth Engine (GEE)** for NDVI-based plantation verification, and **Ethereum smart contracts** (deployed locally on Ganache) to mint ERC-721 NFTs representing verified carbon offset projects.

---

## ✨ Features

- 🌳 AI-based tree detection using YOLO
- 🛰️ Plantation verification using Google Earth Engine (NDVI)
- ⛓️ ERC-721 NFT minting on Ethereum (Ganache)
- 🔒 Immutable verification records on blockchain
- 🚀 REST API built with FastAPI
- 📄 Interactive API documentation via Swagger UI

---

## 🏗️ Project Structure

```text
offsetguard_enhanced/
|
OffsetGuard/
│
├── backend/                 
│   ├── models/
│   ├── main.py
│   ├── requirements.txt
│   └── .env.example
│
├── blockchain/              
│   ├── contracts/
│   ├── scripts/
│   ├── test/
│   ├── hardhat.config.js
│   └── .env.example
│
└── README.md
```

---

# 🛠️ Tech Stack

### Backend

- FastAPI
- Python
- Uvicorn

### AI & Computer Vision

- YOLO
- OpenCV
- PyTorch

### Remote Sensing

- Google Earth Engine (GEE)
- NDVI Analysis

### Blockchain

- Solidity
- Hardhat
- Ganache
- Ethers.js
- ERC-721 NFT Standard

---

# 🚀 Getting Started

## Prerequisites

Before running the project, ensure you have installed:

- Python 3.10+
- Node.js
- npm
- Ganache GUI or Ganache CLI
- Git

---

# 1️⃣ Start Ganache

## Option A — Ganache GUI

1. Open Ganache.
2. Create or open a workspace.
3. Start the blockchain.
4. Note the following:

```
RPC URL
http://127.0.0.1:7545

Chain ID
1337
```

Click the 🔑 icon beside an account to copy its private key.

---

## Option B — Ganache CLI

```bash
npm install -g ganache

ganache --port 8545 --chain.chainId 1337
```

---

# 2️⃣ Deploy the Smart Contract

Navigate to the blockchain project.

```bash
cd blockchain

npm install
```

Create the environment file.

```bash
cp .env.example .env
```

Update the following values:

```env
GANACHE_URL=http://127.0.0.1:7545
GANACHE_CHAIN_ID=1337
OWNER_PRIVATE_KEY=YOUR_PRIVATE_KEY
```

Compile the smart contracts.

```bash
npm run compile
```

Run tests.

```bash
npm test
```

Deploy to Ganache.

```bash
npm run deploy:ganache
```

After deployment you'll receive an output similar to:

```text
CONTRACT_ADDRESS=0xABC123...

POLYGON_RPC_URL=http://127.0.0.1:7545

NETWORK_NAME=ganache
```

Copy the **CONTRACT_ADDRESS** into the backend `.env` file.

---

# 3️⃣ Run the Backend

Navigate to the backend directory.

```bash
cd backend
```

Create a virtual environment.

### Linux/macOS

```bash
python -m venv venv
source venv/bin/activate
```

### Windows

```powershell
python -m venv venv
venv\Scripts\activate
```

Install dependencies.

```bash
pip install -r requirements.txt
```

Create the environment file.

```bash
cp .env.example .env
```

Update the values.

```env
CONTRACT_ADDRESS=YOUR_CONTRACT_ADDRESS

GANACHE_URL=http://127.0.0.1:7545

OWNER_PRIVATE_KEY=YOUR_PRIVATE_KEY

OWNER_ADDRESS=YOUR_ACCOUNT_ADDRESS
```

Place your trained YOLO model inside:

```
backend/models/best.pt
```

Run the server.

```bash
uvicorn main:app --reload
```

The API will be available at

```
http://localhost:8000
```

Swagger Documentation

```
http://localhost:8000/docs
```

---

# 📡 API Endpoints

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/verify-plantation` | Verify plantation using GEE NDVI |
| POST | `/run-yolo` | Detect trees using YOLO |
| POST | `/mint-nft` | Mint ERC-721 NFT certificate |
| GET | `/health` | Health check |

---

## Example Request — `/mint-nft`

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

# ⚙️ Environment Variables

## backend/.env

| Variable | Description |
|----------|-------------|
| YOLO_MODEL_PATH | Path to YOLO model (`models/best.pt`) |
| GANACHE_URL | Ganache RPC URL |
| CONTRACT_ADDRESS | Deployed smart contract address |
| OWNER_PRIVATE_KEY | Ganache wallet private key |
| OWNER_ADDRESS | Ganache wallet address |

---

## blockchain/.env

| Variable | Description |
|----------|-------------|
| GANACHE_URL | Ganache RPC URL |
| GANACHE_CHAIN_ID | Ganache Chain ID |
| OWNER_PRIVATE_KEY | Ganache wallet private key |

---

# 📜 Workflow

```text
Satellite Image
        │
        ▼
Google Earth Engine
   (NDVI Verification)
        │
        ▼
YOLO Tree Detection
        │
        ▼
Verification Result
        │
        ▼
Smart Contract
        │
        ▼
ERC-721 NFT Minted
        │
        ▼
Immutable Carbon Offset Certificate
```

---

# 📌 Future Improvements

- Deploy contracts on Polygon Amoy/Mainnet
- IPFS metadata storage
- Wallet authentication (MetaMask)
- Interactive dashboard
- Carbon credit analytics
- Multi-user support

---

# 🤝 Contributing

Contributions, bug reports, and feature requests are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Open a Pull Request.

---

## 👥 Authors

Developed as part of the **OffsetGuard** project for AI-powered carbon offset verification using Computer Vision, Remote Sensing, and Blockchain.
