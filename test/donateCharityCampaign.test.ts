import { expect } from "chai";
import { ethers } from "hardhat";
import {
  cancelCharityCampaignFixture,
  completeCharityCampaignFixture,
  createCharityCampaignFixture,
  donateToCharityCampaignFixture,
  failCharityCampaignFixture,
} from "./fixtures";
import {
  CharityCampaignContractErrors,
  CharityCampaignFailStatus,
  CharityCampaignStatus,
} from "./types";

describe("Donate to charity campaign", () => {
  it("Should successfully donate to charity campaign", async () => {
    const signers = await ethers.getSigners();
    const _donater = signers.pop()!;
    const _donationAmount = ethers.parseUnits("1000", "wei");

    const {
      tx,
      charityCampaignContract,
      charityCampaignObj: { index },
    } = await donateToCharityCampaignFixture({ _donater, _donationAmount });

    const charityCampaign = await charityCampaignContract.charityCampaigns(
      index
    );
    const donaterAmount = await charityCampaignContract.getDonaterAmount(
      index,
      _donater.address
    );

    expect(charityCampaign.balance).to.be.equal(_donationAmount);
    expect(charityCampaign.biggestDonater).to.be.equal(_donater.address);
    expect(donaterAmount).to.be.equal(_donationAmount);
    expect(tx)
      .to.emit(charityCampaignContract, "DonationRecieved")
      .withArgs(index, _donater.address, _donationAmount);
    expect(tx).to.changeEtherBalance(_donater, -_donationAmount);
  });

  it("Should successfully complete charity campaign", async () => {
    const signers = await ethers.getSigners();
    const _donater = signers.pop()!;
    const _donationAmount = ethers.parseUnits("11000", "wei");
    const _targetSum = ethers.parseUnits("10000", "wei");

    const {
      tx,
      charityCampaignObj: { index, receiver },
      charityCampaignContract,
    } = await completeCharityCampaignFixture({
      _donater,
      _donationAmount,
      _targetSum,
    });

    const charityCampaign = await charityCampaignContract.charityCampaigns(
      index
    );
    expect(charityCampaign.status).to.be.equal(CharityCampaignStatus.COMPLETED);
    expect(charityCampaign.balance).to.be.equal(_donationAmount);
    expect(charityCampaign.biggestDonater).to.be.equal(_donater.address);
    expect(tx)
      .to.emit(charityCampaignContract, "DonationRecieved")
      .withArgs(index, _donater.address, _donationAmount);
    expect(tx).to.changeEtherBalance(_donater, -_donationAmount);
    expect(tx)
      .to.emit(charityCampaignContract, "CharityCampaignCompleted")
      .withArgs(index, receiver, _donationAmount);
  });

  it("Should fail charity campaign", async () => {
    const {
      charityCampaignContract,
      charityCampaignObj: { index },
      tx,
    } = await failCharityCampaignFixture();

    const charityCampaign = await charityCampaignContract.charityCampaigns(
      index
    );

    expect(charityCampaign.status).to.be.equal(CharityCampaignStatus.FAILED);
    expect(tx)
      .to.emit(charityCampaignContract, "CharityCampaignFailed")
      .withArgs(index, CharityCampaignFailStatus.TIME_IS_UP);
  });

  it("Should revert with correctCharityCampaignIndex (zero) error", async () => {
    const signers = await ethers.getSigners();

    await expect(
      donateToCharityCampaignFixture({
        _index: 0n,
        _donater: signers.pop()!,
        _donationAmount: ethers.parseUnits("1000", "wei"),
      })
    ).to.be.revertedWith(
      CharityCampaignContractErrors.CORRECT_CHARITY_CAMPAIGN_INDEX_ZERO
    );
  });

  it("Should revert with correctCharityCampaignIndex (incorrect) error", async () => {
    const signers = await ethers.getSigners();

    await expect(
      donateToCharityCampaignFixture({
        _index: 100n,
        _donater: signers.pop()!,
        _donationAmount: ethers.parseUnits("1000", "wei"),
      })
    ).to.be.revertedWith(
      CharityCampaignContractErrors.CORRECT_CHARITY_CAMPAIGN_INDEX_GT_ZERO
    );
  });

  it("Should revert with charityCampaignAnnounced error", async () => {
    const signers = await ethers.getSigners();
    const _donater = signers.pop()!;

    const {
      charityCampaignObj: { index },
      charityCampaignContract,
    } = await createCharityCampaignFixture();

    await expect(
      charityCampaignContract
        .connect(_donater)
        .donate(index, { value: ethers.parseUnits("1000", "wei") })
    ).to.be.revertedWith(
      CharityCampaignContractErrors.CHARITY_CAMPAIGN_ANNOUNCED
    );
  });

  it("Should revert with charityCampaignCompleted error", async () => {
    const signers = await ethers.getSigners();
    const _donater = signers.pop()!;
    const _donationAmount = ethers.parseUnits("11000", "wei");
    const _targetSum = ethers.parseUnits("10000", "wei");

    const {
      charityCampaignObj: { index },
      charityCampaignContract,
    } = await completeCharityCampaignFixture({
      _donater,
      _donationAmount,
      _targetSum,
    });

    await expect(
      charityCampaignContract
        .connect(_donater)
        .donate(index, { value: _donationAmount })
    ).to.be.revertedWith(
      CharityCampaignContractErrors.CHARITY_CAMPAIGN_COMPLETED
    );
  });

  it("Should revert with charityCampaignFailed", async () => {
    const signers = await ethers.getSigners();
    const _donater = signers.pop()!;

    const {
      charityCampaignContract,
      charityCampaignObj: { index },
    } = await cancelCharityCampaignFixture();

    await expect(
      charityCampaignContract
        .connect(_donater)
        .donate(index, { value: ethers.parseUnits("11000", "wei") })
    ).to.be.revertedWith(CharityCampaignContractErrors.CHARITY_CAMPAIGN_FAILED);
  });
});
