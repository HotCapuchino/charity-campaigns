import { expect } from "chai";
import { ethers } from "hardhat";
import { CharityCampaignContractErrors } from "./types";
import {
  cancelCharityCampaignFixture,
  completeCharityCampaignFixture,
  createCharityCampaignFixture,
  newBlockNumberFixture,
  prolongateCharityCampaignFixture,
} from "./fixtures";

describe("Prolongate charity campaign", () => {
  it("Should successfully prolongate charity campaign", async () => {
    const { newBlockNumber, _untilBlockNumber } = await newBlockNumberFixture();
    const {
      charityCampaignContract,
      charityCampaignObj: { index },
      tx,
    } = await prolongateCharityCampaignFixture({
      _untilBlockNumber,
      newBlockNumber,
    });

    const charityCampaign = await charityCampaignContract.charityCampaigns(
      index
    );

    expect(charityCampaign.untilBlockNumber).to.be.equal(newBlockNumber);
    expect(tx)
      .to.emit(charityCampaignContract, "CharityCampaignProlongated")
      .withArgs(index, newBlockNumber);
  });

  // FIXME: доделать эту темку
  // it("Should revert with onlyOwner error", async () => {
  //   const signers = await ethers.getSigners();
  //   const _txAuthor = signers.pop()!;
  //   const { _untilTimestamp, newTimestamp } = await loadFixture(
  //     newTimestampFixture
  //   );
  //   await expect(
  //     prolongateCharityCampaignFixture({
  //       _txAuthor,
  //       _untilTimestamp,
  //       newTimestamp,
  //     })
  //   ).to.be.revertedWith(CharityCampaignContractErrors.ONLY_OWNER);
  // });

  it("Should revert with correctCharityCampaignIndex (zero) error", async () => {
    const { newBlockNumber, _untilBlockNumber } = await newBlockNumberFixture();

    await expect(
      prolongateCharityCampaignFixture({
        _index: 0n,
        _untilBlockNumber,
        newBlockNumber,
      })
    ).to.be.revertedWith(
      CharityCampaignContractErrors.CORRECT_CHARITY_CAMPAIGN_INDEX_ZERO
    );
  });

  it("Should revert with correctCharityCampaignIndex (incorrect) error", async () => {
    const { newBlockNumber, _untilBlockNumber } = await newBlockNumberFixture();

    await expect(
      prolongateCharityCampaignFixture({
        _index: 100n,
        _untilBlockNumber,
        newBlockNumber,
      })
    ).to.be.revertedWith(
      CharityCampaignContractErrors.CORRECT_CHARITY_CAMPAIGN_INDEX_GT_ZERO
    );
  });

  it("Should revert with blocknumberNotExpired error", async () => {
    const { _untilBlockNumber } = await newBlockNumberFixture();

    await expect(
      prolongateCharityCampaignFixture({
        _untilBlockNumber,
        newBlockNumber: 0n,
      })
    ).to.be.revertedWith(CharityCampaignContractErrors.BLOCKNUMBER_NOT_EXPIRED);
  });

  it("Should revert with newBlocknumberNotExpired error", async () => {
    const { _untilBlockNumber } = await newBlockNumberFixture();

    await expect(
      prolongateCharityCampaignFixture({
        _untilBlockNumber,
        newBlockNumber: _untilBlockNumber,
      })
    ).to.be.revertedWith(
      CharityCampaignContractErrors.NEW_BLOCKNUMBER_NOT_EXPIRED
    );
  });

  it("Should revert with charityCampaignAnnounced error", async () => {
    const { newBlockNumber, _untilBlockNumber } = await newBlockNumberFixture();

    const {
      charityCampaignObj: { index },
      charityCampaignContract,
    } = await createCharityCampaignFixture({ _untilBlockNumber });

    await expect(
      charityCampaignContract.prolongateCharityCampaign(newBlockNumber, index)
    ).to.be.revertedWith(
      CharityCampaignContractErrors.CHARITY_CAMPAIGN_ANNOUNCED
    );
  });

  it("Should revert with charityCampaignCompleted error", async () => {
    const { newBlockNumber, _untilBlockNumber } = await newBlockNumberFixture();

    const [owner, _] = await ethers.getSigners();
    const {
      charityCampaignContract,
      charityCampaignObj: { index },
    } = await completeCharityCampaignFixture({
      _untilBlockNumber,
      _donater: owner,
      _donationAmount: ethers.parseEther("0.02"),
      _targetSum: ethers.parseEther("0.01"),
    });

    await expect(
      charityCampaignContract.prolongateCharityCampaign(newBlockNumber, index)
    ).to.be.revertedWith(
      CharityCampaignContractErrors.CHARITY_CAMPAIGN_COMPLETED
    );
  });

  it("Should revert with charityCampaignFailed error", async () => {
    const { newBlockNumber, _untilBlockNumber } = await newBlockNumberFixture();

    const {
      charityCampaignObj: { index },
      charityCampaignContract,
    } = await cancelCharityCampaignFixture({ _untilBlockNumber });

    await expect(
      charityCampaignContract.prolongateCharityCampaign(newBlockNumber, index)
    ).to.be.revertedWith(CharityCampaignContractErrors.CHARITY_CAMPAIGN_FAILED);
  });
});
