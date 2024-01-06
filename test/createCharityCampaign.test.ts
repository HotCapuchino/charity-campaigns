import { expect } from "chai";
import { createCharityCampaignFixture } from "./fixtures";
import isEqual from "lodash.isequal";
import { ethers } from "hardhat";
import { CharityCampaignContractErrors } from "./types";

describe("Create charity campaign", () => {
  it("Should successfully create charity campaign", async () => {
    const [owner, ...signers] = await ethers.getSigners();

    const receiverAddress = signers.pop()!.address;
    const {
      charityCampaignContract,
      charityCampaignObj,
      tx,
      targetSum,
      goal,
      untilBlockNumber,
    } = await createCharityCampaignFixture({
      _txAuthor: owner,
      _receiverAddress: receiverAddress,
    });

    const charityCampaignIndex = charityCampaignObj.index;
    const charityCampaign = await charityCampaignContract.charityCampaigns(
      charityCampaignIndex
    );

    expect(isEqual(charityCampaign, Object.values(charityCampaignObj))).true;
    expect(tx)
      .to.emit(charityCampaignContract, "CharityCampaignAnnounced")
      .withArgs(
        charityCampaignIndex,
        owner.address,
        receiverAddress,
        targetSum,
        goal,
        untilBlockNumber
      );
  });

  it("Should revert with blockNumberNotExpired error", async () => {
    await expect(
      createCharityCampaignFixture({ _untilBlockNumber: 0n })
    ).to.be.revertedWith(CharityCampaignContractErrors.BLOCKNUMBER_NOT_EXPIRED);
  });

  it("Should revert with targetSumNotZero error", async () => {
    await expect(
      createCharityCampaignFixture({ _targetSum: 0n })
    ).to.be.revertedWith(CharityCampaignContractErrors.TARGET_SUM_NOT_ZERO);
  });

  it("Should revert with receiverNotNull error", async () => {
    await expect(
      createCharityCampaignFixture({ _receiverAddress: ethers.ZeroAddress })
    ).to.be.revertedWith(CharityCampaignContractErrors.RECEIVER_NOT_NULL);
  });
});
