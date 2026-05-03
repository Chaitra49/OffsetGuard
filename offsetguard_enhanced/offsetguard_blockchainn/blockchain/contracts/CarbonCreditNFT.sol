// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title CarbonCreditNFT
 * @notice ERC-721 token representing verified carbon offset credits for OffsetGuard.
 *         Each token stores company name, CO₂ offset amount, and an IPFS metadata URI.
 * @dev Deployed on Polygon (Amoy testnet / Mainnet).
 */
contract CarbonCreditNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    // ─── State ───────────────────────────────────────────────────────────────

    Counters.Counter private _tokenIdCounter;

    struct CarbonCredit {
        string  companyName;
        uint256 co2Tons;          // stored as tons × 1000 (3 decimal precision)
        uint256 issuedAt;
        bool    retired;
    }

    mapping(uint256 => CarbonCredit) public carbonCredits;

    // ─── Events ──────────────────────────────────────────────────────────────

    event CarbonCreditMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        string  companyName,
        uint256 co2Tons,
        string  metadataURI
    );

    event CarbonCreditRetired(
        uint256 indexed tokenId,
        string  companyName,
        uint256 co2Tons
    );

    // ─── Constructor ─────────────────────────────────────────────────────────

   constructor() ERC721("OffsetGuard Carbon Credit", "OGCC") {
    _transferOwnership(msg.sender);
}

    // ─── Mint ────────────────────────────────────────────────────────────────

    /**
     * @notice Mint a new carbon credit NFT.
     * @param to          Recipient wallet address.
     * @param companyName Name of the verified company.
     * @param co2Tons     CO₂ offset in metric tons × 1000 (e.g. 1500 = 1.500 tons).
     * @param metadataURI IPFS URI (or data-URI) with full JSON metadata.
     * @return tokenId    The newly minted token ID.
     */
    function mintCarbonCredit(
        address to,
        string calldata companyName,
        uint256 co2Tons,
        string calldata metadataURI
    ) external onlyOwner returns (uint256 tokenId) {
        require(to != address(0),          "CarbonCreditNFT: zero address");
        require(bytes(companyName).length > 0, "CarbonCreditNFT: empty company name");
        require(co2Tons > 0,               "CarbonCreditNFT: zero CO2 offset");

        _tokenIdCounter.increment();
        tokenId = _tokenIdCounter.current();

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);

        carbonCredits[tokenId] = CarbonCredit({
            companyName: companyName,
            co2Tons:     co2Tons,
            issuedAt:    block.timestamp,
            retired:     false
        });

        emit CarbonCreditMinted(tokenId, to, companyName, co2Tons, metadataURI);
    }

    // ─── Retire ──────────────────────────────────────────────────────────────

    /**
     * @notice Retire (burn) a carbon credit, preventing double-counting.
     *         Only the token owner or an approved operator can retire.
     * @param tokenId Token to retire.
     */
    function retireCarbonCredit(uint256 tokenId) external {
        require(
            ownerOf(tokenId) == msg.sender ||
            getApproved(tokenId) == msg.sender ||
            isApprovedForAll(ownerOf(tokenId), msg.sender),
            "CarbonCreditNFT: not owner or approved"
        );
        require(!carbonCredits[tokenId].retired, "CarbonCreditNFT: already retired");

        carbonCredits[tokenId].retired = true;

        emit CarbonCreditRetired(
            tokenId,
            carbonCredits[tokenId].companyName,
            carbonCredits[tokenId].co2Tons
        );

        _burn(tokenId);
    }

    // ─── Views ───────────────────────────────────────────────────────────────

    /**
     * @notice Total tokens ever minted (includes burned).
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    /**
     * @notice Get credit details for a token.
     */
    function getCarbonCredit(uint256 tokenId)
        external
        view
        returns (
            string memory companyName,
            uint256 co2Tons,
            uint256 issuedAt,
            bool    retired
        )
    {
        CarbonCredit memory cc = carbonCredits[tokenId];
        return (cc.companyName, cc.co2Tons, cc.issuedAt, cc.retired);
    }
}
