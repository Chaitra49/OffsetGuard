"""
/mint-nft endpoint
Mints an ERC-721 carbon credit NFT on the Polygon network.
Returns transaction hash + token ID in JSON.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from services.blockchain_service import BlockchainService

router = APIRouter()
_service: Optional[BlockchainService] = None


def _get_service() -> BlockchainService:
    global _service
    if _service is None:
        _service = BlockchainService()
    return _service


# ──────────────────────────────────────────────
# Request / Response schemas
# ──────────────────────────────────────────────
class MintRequest(BaseModel):
    company_name: str
    co2_offset_tons: float
    latitude: float
    longitude: float
    verification_status: Optional[str] = "verified"
    tree_count: Optional[int] = None
    recipient_address: Optional[str] = None   # wallet to receive NFT; defaults to owner


class NFTMintResult(BaseModel):
    success: bool
    token_id: Optional[int]
    transaction_hash: Optional[str]
    contract_address: str
    network: str
    metadata_uri: Optional[str]
    company_name: str
    co2_offset_tons: float
    message: str


# ──────────────────────────────────────────────
# Endpoint
# ──────────────────────────────────────────────
@router.post("/mint-nft", response_model=NFTMintResult)
async def mint_nft(payload: MintRequest):
    """
    Mint a carbon-credit NFT on Polygon.

    - **company_name**: Registering company name (embedded in token metadata)
    - **co2_offset_tons**: Verified CO₂ offset (metric tons)
    - **latitude / longitude**: Plantation GPS
    - **recipient_address**: Polygon wallet to receive the NFT (optional)
    """
    svc = _get_service()

    try:
        result = svc.mint_carbon_credit_nft(
            company_name=payload.company_name,
            co2_offset_tons=payload.co2_offset_tons,
            latitude=payload.latitude,
            longitude=payload.longitude,
            verification_status=payload.verification_status or "verified",
            tree_count=payload.tree_count,
            recipient=payload.recipient_address,
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"NFT minting failed: {exc}")

    return NFTMintResult(
        success=result["success"],
        token_id=result.get("token_id"),
        transaction_hash=result.get("tx_hash"),
        contract_address=svc.contract_address,
        network=svc.network_name,
        metadata_uri=result.get("metadata_uri"),
        company_name=payload.company_name,
        co2_offset_tons=payload.co2_offset_tons,
        message=result.get("message", "NFT minted successfully."),
    )
