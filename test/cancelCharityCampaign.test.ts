import { expect } from "chai";
import { ethers } from "hardhat";
import {
  cancelCharityCampaignFixture,
  completeCharityCampaignFixture,
  createCharityCampaignFixture,
} from "./fixtures";
import {
  CharityCampaignContractErrors,
  CharityCampaignFailStatus,
  CharityCampaignStatus,
} from "./types";

describe("Cancel charity campaign", () => {
  it("Should successfully cancel charity campaign", async () => {
    const {
      charityCampaignContract,
      charityCampaignObj: { index },
      tx,
    } = await cancelCharityCampaignFixture();

    const charityCampaign = await charityCampaignContract.charityCampaigns(
      index
    );

    expect(charityCampaign.status).to.be.equal(CharityCampaignStatus.FAILED);
    expect(tx)
      .to.emit(charityCampaignContract, "CharityCampaignFailed")
      .withArgs(index, CharityCampaignFailStatus.CANCELLED);
  });
  // FIXME: доделать эту темку
  // it("Should revert with onlyOwner error", async () => {
  //   const signers = await ethers.getSigners();
  //   const _txAuthor = signers.pop()!;
  //   await expect(
  //     cancelCharityCampaignFixture({
  //       _txAuthor,
  //     })
  //   ).to.be.revertedWith(CharityCampaignContractErrors.ONLY_OWNER);
  // });

  it("Should revert with correctCharityCampaignIndex (zero) error", async () => {
    await expect(
      cancelCharityCampaignFixture({
        _index: 0n,
      })
    ).to.be.revertedWith(
      CharityCampaignContractErrors.CORRECT_CHARITY_CAMPAIGN_INDEX_ZERO
    );
  });

  it("Should revert with correctCharityCampaignIndex (incorrect) error", async () => {
    await expect(
      cancelCharityCampaignFixture({
        _index: 100n,
      })
    ).to.be.revertedWith(
      CharityCampaignContractErrors.CORRECT_CHARITY_CAMPAIGN_INDEX_GT_ZERO
    );
  });

  it("Should revert with charityCampaignAnnounced error", async () => {
    const {
      charityCampaignObj: { index },
      charityCampaignContract,
    } = await createCharityCampaignFixture();

    await expect(
      charityCampaignContract.cancelCharityCampaign(index)
    ).to.be.revertedWith(
      CharityCampaignContractErrors.CHARITY_CAMPAIGN_ANNOUNCED
    );
  });

  it("Should revert with charityCampaignCompleted error", async () => {
    const [owner, _] = await ethers.getSigners();
    const {
      charityCampaignContract,
      charityCampaignObj: { index },
    } = await completeCharityCampaignFixture({
      _donater: owner,
      _donationAmount: ethers.parseEther("0.02"),
      _targetSum: ethers.parseEther("0.01"),
    });

    await expect(
      charityCampaignContract.cancelCharityCampaign(index)
    ).to.be.revertedWith(
      CharityCampaignContractErrors.CHARITY_CAMPAIGN_COMPLETED
    );
  });

  it("Should revert with charityCampaignFailed", async () => {
    const {
      charityCampaignContract,
      charityCampaignObj: { index },
    } = await cancelCharityCampaignFixture();

    await expect(
      charityCampaignContract.cancelCharityCampaign(index)
    ).to.be.revertedWith(CharityCampaignContractErrors.CHARITY_CAMPAIGN_FAILED);
  });
});
