import { expect } from "chai";
import { ethers } from "hardhat";
import {
  cancelCharityCampaignFixture,
  createCharityCampaignFixture,
  startCharityCampaignFixture,
  withdrawByReceiverFromCharityCampaignFixture,
} from "./fixtures";
import { CharityCampaignContractErrors } from "./types";

describe("Withdrawal by receiver", () => {
  it("Receiver should successfully withdraw all funds after charity campaign has been completed", async () => {
    const signers = await ethers.getSigners();

    const _donater = signers.pop()!;
    const _receiver = signers.pop()!;
    const _donationAmount = ethers.parseUnits("11000", "wei");
    const _targetSum = ethers.parseUnits("10000", "wei");

    const {
      tx,
      charityCampaignContract,
      charityCampaignObj: { index },
    } = await withdrawByReceiverFromCharityCampaignFixture({
      _donationAmount,
      _donater,
      _targetSum,
      _receiver,
      _receiverAddress: _receiver.address,
    });

    const charityCampaign = await charityCampaignContract.charityCampaigns(
      index
    );

    expect(charityCampaign.balance).to.be.equal(0);
    expect(charityCampaign.fundsTransferredToReceiver).to.be.true;
    expect(tx)
      .to.emit(charityCampaignContract, "CharitySumWithdrawal")
      .withArgs(index);
    expect(tx).to.changeEtherBalance(_receiver, _donationAmount);
  });

  it("Should revert with onlyCharityReceiver error", async () => {
    const signers = await ethers.getSigners();

    const _donater = signers.pop()!;

    await expect(
      withdrawByReceiverFromCharityCampaignFixture({
        _donationAmount: ethers.parseUnits("11000", "wei"),
        _donater,
        _targetSum: ethers.parseUnits("10000", "wei"),
        _receiver: _donater,
        _receiverAddress: signers.pop()!.address,
      })
    ).to.be.revertedWith(
      CharityCampaignContractErrors.ONLY_CHARITY_CAMPAIGN_RECEIVER
    );
  });

  it("Should revert with correctCharityCampaignIndex (zero) error", async () => {
    const signers = await ethers.getSigners();

    const _donater = signers.pop()!;

    await expect(
      withdrawByReceiverFromCharityCampaignFixture({
        _index: 0n,
        _donationAmount: ethers.parseUnits("11000", "wei"),
        _donater,
        _targetSum: ethers.parseUnits("10000", "wei"),
        _receiver: _donater,
        _receiverAddress: signers.pop()!.address,
      })
    ).to.be.revertedWith(
      CharityCampaignContractErrors.CORRECT_CHARITY_CAMPAIGN_INDEX_ZERO
    );
  });

  it("Should revert with correctCharityCampaignIndex (incorrect) error", async () => {
    const signers = await ethers.getSigners();

    const _donater = signers.pop()!;

    await expect(
      withdrawByReceiverFromCharityCampaignFixture({
        _index: 100n,
        _donationAmount: ethers.parseUnits("11000", "wei"),
        _donater,
        _targetSum: ethers.parseUnits("10000", "wei"),
        _receiver: _donater,
        _receiverAddress: signers.pop()!.address,
      })
    ).to.be.revertedWith(
      CharityCampaignContractErrors.CORRECT_CHARITY_CAMPAIGN_INDEX_GT_ZERO
    );
  });

  it("Should revert with fundsNotTransferredToReceiver error", async () => {
    const signers = await ethers.getSigners();

    const _donater = signers.pop()!;
    const _receiver = signers.pop()!;

    const {
      charityCampaignContract,
      charityCampaignObj: { index },
    } = await withdrawByReceiverFromCharityCampaignFixture({
      _donationAmount: ethers.parseUnits("11000", "wei"),
      _donater,
      _targetSum: ethers.parseUnits("10000", "wei"),
      _receiver,
      _receiverAddress: _receiver.address,
    });

    await expect(
      charityCampaignContract.connect(_receiver).receiverWithdraw(index)
    ).to.be.revertedWith(
      CharityCampaignContractErrors.FUNDS_NOT_TRANSFERRED_TO_RECEIVER
    );
  });

  it("Should revert with charityCampaignAnnounced error", async () => {
    const signers = await ethers.getSigners();

    const _receiver = signers.pop()!;

    const {
      charityCampaignContract,
      charityCampaignObj: { index },
    } = await createCharityCampaignFixture({
      _receiverAddress: _receiver.address,
    });

    await expect(
      charityCampaignContract.connect(_receiver).receiverWithdraw(index)
    ).to.be.revertedWith(
      CharityCampaignContractErrors.CHARITY_CAMPAIGN_ANNOUNCED
    );
  });

  it("Should revert with charityCampaignInProgress error", async () => {
    const signers = await ethers.getSigners();

    const _receiver = signers.pop()!;

    const {
      charityCampaignContract,
      charityCampaignObj: { index },
    } = await startCharityCampaignFixture({
      _receiverAddress: _receiver.address,
    });

    await expect(
      charityCampaignContract.connect(_receiver).receiverWithdraw(index)
    ).to.be.revertedWith(
      CharityCampaignContractErrors.CHARITY_CAMPAIGN_IN_PROGRESS
    );
  });

  it("Should revert with charityCampaignFailed error", async () => {
    const signers = await ethers.getSigners();

    const _receiver = signers.pop()!;

    const {
      charityCampaignContract,
      charityCampaignObj: { index },
    } = await cancelCharityCampaignFixture({
      _receiverAddress: _receiver.address,
    });

    await expect(
      charityCampaignContract.connect(_receiver).receiverWithdraw(index)
    ).to.be.revertedWith(CharityCampaignContractErrors.CHARITY_CAMPAIGN_FAILED);
  });
});
