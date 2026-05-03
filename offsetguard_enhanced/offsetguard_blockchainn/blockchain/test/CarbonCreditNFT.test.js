const { expect }  = require("chai");
const { ethers }  = require("hardhat");

describe("CarbonCreditNFT", function () {
  let contract, owner, user1, user2;

  const CO2_TONS     = 1500n;   // 1.500 metric tons × 1000
  const COMPANY      = "GreenTech Corp";
  const METADATA_URI = "ipfs://Qm000testCID";

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("CarbonCreditNFT");
    contract = await Factory.deploy(owner.address);
    await contract.waitForDeployment();
  });

  // ── Deployment ──────────────────────────────────────────────────────────
  describe("Deployment", function () {
    it("should set the correct name and symbol", async function () {
      expect(await contract.name()).to.equal("OffsetGuard Carbon Credit");
      expect(await contract.symbol()).to.equal("OGCC");
    });

    it("should set the owner correctly", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("should start with totalSupply 0", async function () {
      expect(await contract.totalSupply()).to.equal(0n);
    });
  });

  // ── Minting ─────────────────────────────────────────────────────────────
  describe("mintCarbonCredit", function () {
    it("should mint a token and emit CarbonCreditMinted", async function () {
      await expect(
        contract.connect(owner).mintCarbonCredit(
          user1.address, COMPANY, CO2_TONS, METADATA_URI
        )
      )
        .to.emit(contract, "CarbonCreditMinted")
        .withArgs(1n, user1.address, COMPANY, CO2_TONS, METADATA_URI);

      expect(await contract.ownerOf(1n)).to.equal(user1.address);
      expect(await contract.totalSupply()).to.equal(1n);
    });

    it("should store credit metadata correctly", async function () {
      await contract.mintCarbonCredit(user1.address, COMPANY, CO2_TONS, METADATA_URI);

      const [companyName, co2Tons, , retired] = await contract.getCarbonCredit(1n);
      expect(companyName).to.equal(COMPANY);
      expect(co2Tons).to.equal(CO2_TONS);
      expect(retired).to.be.false;
    });

    it("should set tokenURI correctly", async function () {
      await contract.mintCarbonCredit(user1.address, COMPANY, CO2_TONS, METADATA_URI);
      expect(await contract.tokenURI(1n)).to.equal(METADATA_URI);
    });

    it("should increment token IDs sequentially", async function () {
      await contract.mintCarbonCredit(user1.address, COMPANY,          CO2_TONS, METADATA_URI);
      await contract.mintCarbonCredit(user2.address, "AnotherCorp",    CO2_TONS, METADATA_URI);

      expect(await contract.ownerOf(1n)).to.equal(user1.address);
      expect(await contract.ownerOf(2n)).to.equal(user2.address);
      expect(await contract.totalSupply()).to.equal(2n);
    });

    it("should revert if called by non-owner", async function () {
      await expect(
        contract.connect(user1).mintCarbonCredit(
          user1.address, COMPANY, CO2_TONS, METADATA_URI
        )
      ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    });

    it("should revert on zero address recipient", async function () {
      await expect(
        contract.mintCarbonCredit(ethers.ZeroAddress, COMPANY, CO2_TONS, METADATA_URI)
      ).to.be.revertedWith("CarbonCreditNFT: zero address");
    });

    it("should revert on empty company name", async function () {
      await expect(
        contract.mintCarbonCredit(user1.address, "", CO2_TONS, METADATA_URI)
      ).to.be.revertedWith("CarbonCreditNFT: empty company name");
    });

    it("should revert on zero CO2 offset", async function () {
      await expect(
        contract.mintCarbonCredit(user1.address, COMPANY, 0n, METADATA_URI)
      ).to.be.revertedWith("CarbonCreditNFT: zero CO2 offset");
    });
  });

  // ── Retiring ────────────────────────────────────────────────────────────
  describe("retireCarbonCredit", function () {
    beforeEach(async function () {
      await contract.mintCarbonCredit(user1.address, COMPANY, CO2_TONS, METADATA_URI);
    });

    it("should allow owner to retire their token", async function () {
      await expect(contract.connect(user1).retireCarbonCredit(1n))
        .to.emit(contract, "CarbonCreditRetired")
        .withArgs(1n, COMPANY, CO2_TONS);
    });

    it("should burn the token on retirement", async function () {
      await contract.connect(user1).retireCarbonCredit(1n);
      await expect(contract.ownerOf(1n)).to.be.reverted;
    });

    it("should revert if non-owner tries to retire", async function () {
      await expect(
        contract.connect(user2).retireCarbonCredit(1n)
      ).to.be.revertedWith("CarbonCreditNFT: not owner or approved");
    });

    it("should allow approved operator to retire", async function () {
      await contract.connect(user1).approve(user2.address, 1n);
      await expect(contract.connect(user2).retireCarbonCredit(1n)).to.not.be.reverted;
    });
  });

  // ── Transfer ─────────────────────────────────────────────────────────────
  describe("ERC-721 transfer", function () {
    it("should allow normal transfer between wallets", async function () {
      await contract.mintCarbonCredit(user1.address, COMPANY, CO2_TONS, METADATA_URI);
      await contract.connect(user1).transferFrom(user1.address, user2.address, 1n);
      expect(await contract.ownerOf(1n)).to.equal(user2.address);
    });
  });
});
