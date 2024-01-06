import { expect } from "chai";
import { ethers } from "hardhat";
import {
  completeCharityCampaignFixture,
  createCharityCampaignFixture,
  startCharityCampaignFixture,
  withdrawByDonaterFromCharityCampaignFixture,
} from "./fixtures";
import { CharityCampaignContractErrors } from "./types";

describe("Withdrawal by donater", () => {
  it("Donater should successfully withdraw his donation after charity campaign has been cancelled", async () => {
    const signers = await ethers.getSigners();

    const _donater = signers.pop()!;
    const _donationAmount = ethers.parseUnits("1000", "wei");
    const _targetSum = ethers.parseUnits("10000", "wei");

    const {
      tx,
      charityCampaignContract,
      charityCampaignObj: { index },
    } = await withdrawByDonaterFromCharityCampaignFixture({
      _donationAmount,
      _donater,
      _targetSum,
    });

    const charityCampaign = await charityCampaignContract.charityCampaigns(
      index
    );

    expect(charityCampaign.balance).to.be.equal(0);
    expect(tx)
      .to.emit(charityCampaignContract, "DonationWithdrawal")
      .withArgs(index, _donater.address, _donationAmount);
    expect(tx).to.changeEtherBalance(_donater, _donationAmount);
  });

  it("Should revert with correctCharityCampaignIndex (zero) error", async () => {
    const signers = await ethers.getSigners();

    await expect(
      withdrawByDonaterFromCharityCampaignFixture({
        _index: 0n,
        _donater: signers.pop()!,
        _donationAmount: ethers.parseUnits("1000", "wei"),
        _targetSum: ethers.parseUnits("10000", "wei"),
      })
    ).to.be.revertedWith(
      CharityCampaignContractErrors.CORRECT_CHARITY_CAMPAIGN_INDEX_ZERO
    );
  });

  it("Should revert with correctCharityCampaignIndex (incorrect) error", async () => {
    const signers = await ethers.getSigners();

    await expect(
      withdrawByDonaterFromCharityCampaignFixture({
        _index: 100n,
        _donater: signers.pop()!,
        _donationAmount: ethers.parseUnits("1000", "wei"),
        _targetSum: ethers.parseUnits("10000", "wei"),
      })
    ).to.be.revertedWith(
      CharityCampaignContractErrors.CORRECT_CHARITY_CAMPAIGN_INDEX_GT_ZERO
    );
  });

  it("Should revert with charityCampaignAnnounced error", async () => {
    const signers = await ethers.getSigners();

    const _donater = signers.pop()!;

    const {
      charityCampaignContract,
      charityCampaignObj: { index },
    } = await createCharityCampaignFixture();

    await expect(
      charityCampaignContract.connect(_donater).donatersWithdraw(index)
    ).to.be.revertedWith(
      CharityCampaignContractErrors.CHARITY_CAMPAIGN_ANNOUNCED
    );
  });

  it("Should revert with charityCampaignInProgress error", async () => {
    const signers = await ethers.getSigners();

    const _donater = signers.pop()!;

    const {
      charityCampaignContract,
      charityCampaignObj: { index },
    } = await startCharityCampaignFixture();

    await expect(
      charityCampaignContract.connect(_donater).donatersWithdraw(index)
    ).to.be.revertedWith(
      CharityCampaignContractErrors.CHARITY_CAMPAIGN_IN_PROGRESS
    );
  });

  it("Should revert with charityCampaignCompleted error", async () => {
    const signers = await ethers.getSigners();

    const _donater = signers.pop()!;

    const {
      charityCampaignContract,
      charityCampaignObj: { index },
    } = await completeCharityCampaignFixture({
      _donater,
      _donationAmount: ethers.parseUnits("11000", "wei"),
      _targetSum: ethers.parseUnits("10000", "wei"),
    });

    await expect(
      charityCampaignContract.connect(_donater).donatersWithdraw(index)
    ).to.be.revertedWith(
      CharityCampaignContractErrors.CHARITY_CAMPAIGN_COMPLETED
    );
  });
});
