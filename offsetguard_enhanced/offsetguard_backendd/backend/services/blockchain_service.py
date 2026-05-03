"""
BlockchainService
Handles all Web3 interactions with the OffsetGuard ERC-721 contract on Ganache.
Configuration is read from environment variables / .env file.
"""

import os
import json
import time
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

load_dotenv()  # loads .env from the working directory


# ──────────────────────────────────────────────
# Minimal ERC-721 ABI (only the functions we call)
# ──────────────────────────────────────────────
CARBON_CREDIT_ABI = [
    # mintCarbonCredit(address to, string companyName, uint256 co2Tons, string metadataURI)
    {
        "inputs": [
            {"internalType": "address",  "name": "to",          "type": "address"},
            {"internalType": "string",   "name": "companyName", "type": "string"},
            {"internalType": "uint256",  "name": "co2Tons",     "type": "uint256"},
            {"internalType": "string",   "name": "metadataURI", "type": "string"},
        ],
        "name": "mintCarbonCredit",
        "outputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    # totalSupply()
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    },
    # Transfer event
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True,  "internalType": "address", "name": "from",    "type": "address"},
            {"indexed": True,  "internalType": "address", "name": "to",      "type": "address"},
            {"indexed": True,  "internalType": "uint256", "name": "tokenId", "type": "uint256"},
        ],
        "name": "Transfer",
        "type": "event",
    },
]


class BlockchainService:
    """
    Wraps Web3 calls for minting OffsetGuard carbon-credit NFTs on Ganache.

    Required environment variables (set in backend/.env):
        GANACHE_URL         — Ganache RPC (default: http://127.0.0.1:7545)
        CONTRACT_ADDRESS    — Deployed ERC-721 contract address from Ganache
        OWNER_PRIVATE_KEY   — Private key of a Ganache account (from the key icon)
        OWNER_ADDRESS       — Corresponding account address
        NETWORK_NAME        — Label string, e.g. "ganache" (cosmetic only)
    """

    def __init__(self):
        # Ganache defaults
        self.rpc_url          = os.getenv("GANACHE_URL", "http://127.0.0.1:7545")
        self.contract_address = os.getenv("CONTRACT_ADDRESS", "")
        self.private_key      = os.getenv("OWNER_PRIVATE_KEY", "")
        self.owner_address    = os.getenv("OWNER_ADDRESS", "")
        self.network_name     = os.getenv("NETWORK_NAME", "ganache")

        self._w3       = None
        self._contract = None

    # ── Web3 lazy-init ──────────────────────────
    @property
    def w3(self):
        if self._w3 is None:
            try:
                from web3 import Web3
                self._w3 = Web3(Web3.HTTPProvider(self.rpc_url))
                if not self._w3.is_connected():
                    raise ConnectionError(
                        f"Cannot connect to Ganache at: {self.rpc_url}\n"
                        "Make sure Ganache is running before starting the backend."
                    )
                print(f"[Web3] Connected to Ganache at {self.rpc_url}")
            except ImportError:
                raise ImportError("web3 is not installed. Run: pip install web3")
        return self._w3

    @property
    def contract(self):
        if self._contract is None:
            if not self.contract_address:
                raise ValueError(
                    "CONTRACT_ADDRESS is not set in .env.\n"
                    "Deploy the contract first: cd blockchain && npm run deploy:ganache"
                )
            from web3 import Web3
            self._contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(self.contract_address),
                abi=CARBON_CREDIT_ABI,
            )
        return self._contract

    # ── Metadata builder ───────────────────────
    def _build_metadata_uri(
        self,
        company_name: str,
        co2_offset_tons: float,
        latitude: float,
        longitude: float,
        verification_status: str,
        tree_count: Optional[int],
    ) -> str:
        """
        Build a base64 data-URI JSON blob as the token's metadata URI.
        No IPFS node required — works entirely on local Ganache.
        """
        import base64

        metadata = {
            "name": f"OffsetGuard Carbon Credit — {company_name}",
            "description": (
                f"Verified carbon offset certificate for {company_name}. "
                f"{co2_offset_tons} metric tons of CO₂ offset."
            ),
            "attributes": [
                {"trait_type": "Company",             "value": company_name},
                {"trait_type": "CO2 Offset (tons)",   "value": co2_offset_tons},
                {"trait_type": "Latitude",            "value": latitude},
                {"trait_type": "Longitude",           "value": longitude},
                {"trait_type": "Verification Status", "value": verification_status},
                {"trait_type": "Tree Count",          "value": tree_count or "N/A"},
                {"trait_type": "Issuer",              "value": "OffsetGuard"},
            ],
            "image": "https://offsetguard.io/nft-image-placeholder.png",
        }

        encoded = base64.b64encode(json.dumps(metadata).encode()).decode()
        return f"data:application/json;base64,{encoded}"

    # ── Mint ───────────────────────────────────
    def mint_carbon_credit_nft(
        self,
        company_name: str,
        co2_offset_tons: float,
        latitude: float,
        longitude: float,
        verification_status: str = "verified",
        tree_count: Optional[int] = None,
        recipient: Optional[str] = None,
    ) -> dict:
        """
        Mint one ERC-721 carbon-credit NFT on Ganache.
        Returns {"success": bool, "tx_hash": str, "token_id": int, "metadata_uri": str}.
        """
        from web3 import Web3

        if not self.private_key or not self.owner_address:
            raise ValueError(
                "OWNER_PRIVATE_KEY and OWNER_ADDRESS must be set in .env.\n"
                "Use any account shown in your Ganache instance."
            )

        to_address   = Web3.to_checksum_address(recipient or self.owner_address)
        metadata_uri = self._build_metadata_uri(
            company_name, co2_offset_tons, latitude, longitude,
            verification_status, tree_count,
        )

        # co2 stored as integer (tons × 1000 → 3 decimal precision)
        co2_int = int(co2_offset_tons * 1000)

        # Ganache: use legacy (non-EIP-1559) transactions for compatibility
        nonce     = self.w3.eth.get_transaction_count(
            Web3.to_checksum_address(self.owner_address)
        )
        gas_price = self.w3.eth.gas_price   # Ganache typically returns 20 gwei

        tx = self.contract.functions.mintCarbonCredit(
            to_address, company_name, co2_int, metadata_uri
        ).build_transaction(
            {
                "from":     Web3.to_checksum_address(self.owner_address),
                "nonce":    nonce,
                "gasPrice": gas_price,
                "gas":      300_000,
                "chainId":  self.w3.eth.chain_id,   # reads chain ID from Ganache
            }
        )

        # Sign & send
        signed   = self.w3.eth.account.sign_transaction(tx, private_key=self.private_key)
        tx_hash  = self.w3.eth.send_raw_transaction(signed.raw_transaction)
        tx_hash_hex = tx_hash.hex()

        # Ganache mines instantly — receipt should be available immediately
        receipt = None
        for _ in range(10):
            try:
                receipt = self.w3.eth.get_transaction_receipt(tx_hash)
                if receipt is not None:
                    break
            except Exception:
                pass
            time.sleep(0.5)

        if receipt is None:
            return {
                "success": False,
                "tx_hash": tx_hash_hex,
                "token_id": None,
                "metadata_uri": metadata_uri,
                "message": "Transaction sent but receipt not yet available.",
            }

        # Extract tokenId from Transfer event
        token_id = None
        try:
            logs = self.contract.events.Transfer().process_receipt(receipt)
            if logs:
                token_id = logs[0]["args"]["tokenId"]
        except Exception:
            pass

        success = receipt["status"] == 1
        return {
            "success": success,
            "tx_hash": tx_hash_hex,
            "token_id": token_id,
            "metadata_uri": metadata_uri,
            "message": (
                f"NFT minted on Ganache. Token ID: {token_id}, TX: {tx_hash_hex}"
                if success
                else "Transaction reverted on Ganache."
            ),
        }

    # ── Simulation (no TX) ─────────────────────
    def simulate_mint(
        self,
        company_name: str,
        co2_offset_tons: float,
        latitude: float,
        longitude: float,
        verification_status: str = "verified",
        tree_count: Optional[int] = None,
    ) -> dict:
        """
        Returns a simulated mint result without sending any transaction.
        Useful for testing when Ganache is not running.
        """
        import hashlib, random

        fake_token_id = random.randint(1000, 9999)
        fake_tx = "0x" + hashlib.sha256(
            f"{company_name}{co2_offset_tons}{time.time()}".encode()
        ).hexdigest()

        metadata_uri = self._build_metadata_uri(
            company_name, co2_offset_tons, latitude, longitude,
            verification_status, tree_count,
        )

        return {
            "success": True,
            "tx_hash": fake_tx,
            "token_id": fake_token_id,
            "metadata_uri": metadata_uri,
            "message": f"[SIMULATION] Token {fake_token_id} minted. TX: {fake_tx}",
        }

