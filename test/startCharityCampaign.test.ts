import { expect } from "chai";
import { ethers } from "hardhat";
import { CharityCampaignContractErrors, CharityCampaignStatus } from "./types";
import {
  cancelCharityCampaignFixture,
  charityCampaignFixture,
  completeCharityCampaignFixture,
  deployCharityCampaignFixture,
  startCharityCampaignFixture,
} from "./fixtures";

describe("Start charity campaign", () => {
  it("Should successfully start charity campaign", async () => {
    const {
      charityCampaignContract,
      charityCampaignObj: { index },
      tx,
    } = await startCharityCampaignFixture();

    const charityCampaign = await charityCampaignContract.charityCampaigns(
      index
    );
    expect(charityCampaign.status).to.be.equal(
      CharityCampaignStatus.IN_PROGRESS
    );
    expect(tx)
      .to.emit(charityCampaignContract, "CharityCampaignStarted")
      .withArgs(index);
  });

  it("Should revert with correctCharityCampaignIndex (zero) error", async () => {
    await expect(
      startCharityCampaignFixture({ _index: 0n })
    ).to.be.revertedWith(
      CharityCampaignContractErrors.CORRECT_CHARITY_CAMPAIGN_INDEX_ZERO
    );
  });

  it("Should revert with correctCharityCampaignIndex (incorrect) error", async () => {
    await expect(
      startCharityCampaignFixture({ _index: 100n })
    ).to.be.revertedWith(
      CharityCampaignContractErrors.CORRECT_CHARITY_CAMPAIGN_INDEX_GT_ZERO
    );
  });

  // FIXME: доделать эту темку
  // it("Should revert with onlyOwner error", async () => {
  //   const [owner, ...signers] = await ethers.getSigners();
  //   const receiver = signers.pop()!;

  //   await expect(
  //     startCharityCampaignFixture({
  //       _txAuthor: receiver,
  //       // _charityCampaignOwnerAddress: owner.address,
  //     })
  //   ).to.be.revertedWith(
  //     CharityCampaignContractErrors.ONLY_CHARITY_CAMPAIGN_OWNER
  //   );
  // });

  it("Should revert with charityCampaignInProgress error", async () => {
    const {
      charityCampaignContract,
      charityCampaignObj: { index },
    } = await startCharityCampaignFixture();

    await expect(
      charityCampaignContract.startCharityCampaign(index)
    ).to.be.revertedWith(
      CharityCampaignContractErrors.CHARITY_CAMPAIGN_IN_PROGRESS
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
      charityCampaignContract.startCharityCampaign(index)
    ).to.be.revertedWith(
      CharityCampaignContractErrors.CHARITY_CAMPAIGN_COMPLETED
    );
  });

  it("Should revert with charityCampaignFailed error", async () => {
    const {
      charityCampaignContract,
      charityCampaignObj: { index },
    } = await cancelCharityCampaignFixture();

    await expect(
      charityCampaignContract.startCharityCampaign(index)
    ).to.be.revertedWith(CharityCampaignContractErrors.CHARITY_CAMPAIGN_FAILED);
  });
});
