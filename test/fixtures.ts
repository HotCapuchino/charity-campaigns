import { ContractRunner } from "ethers";
import {
  loadFixture,
  mine,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { CharityCampaignArgs, CharityCampaignStatus } from "./types";
import omit from "lodash.omit";

export const deployCharityCampaignFixture = async (
  _contractOwner?: ContractRunner
) => {
  const [owner, ...rest] = await ethers.getSigners();

  const charityCampaignFactory = await ethers.getContractFactory(
    "CharityContract"
  );

  const _txAuthor =
    typeof _contractOwner !== "undefined" ? _contractOwner : owner;
  const charityCampaignContract = await charityCampaignFactory
    .connect(_txAuthor)
    .deploy();

  return { charityCampaignContract, owner, signers: rest };
};

export const latestBlockNumberFixture = async () => {
  let latestBlockNumber = 1;
  const latestBlock = await ethers.provider.getBlock("latest");

  if (latestBlock) {
    latestBlockNumber = latestBlock.number;
  }

  return latestBlockNumber;
};

export const charityCampaignFixture = (
  args: Omit<CharityCampaignArgs, "_txAuthor"> = {}
) => {
  return async function charityCampaign() {
    const [owner, ...rest] = await ethers.getSigners();

    const {
      _untilBlockNumber,
      _targetSum,
      _receiverAddress,
      _goal,
      _index,
      _charityCampaignOwnerAddress,
    } = args;

    const targetSum =
      typeof _targetSum === "bigint" ? _targetSum : ethers.parseEther("0.0001");
    const goal = typeof _goal === "string" ? _goal : "Cancer cure";
    const receiverAddress =
      typeof _receiverAddress === "string"
        ? _receiverAddress
        : rest.pop()!.address;

    const latestBlockNumber = await latestBlockNumberFixture();

    // average block time is 12 sec now - https://ycharts.com/indicators/ethereum_average_block_time
    const untilBlockNumber = BigInt(
      typeof _untilBlockNumber === "bigint"
        ? _untilBlockNumber
        : latestBlockNumber + 30
    );

    const charityCampaignOwnerAddress =
      _charityCampaignOwnerAddress || owner.address;

    const charityCampaignObj = {
      owner: charityCampaignOwnerAddress,
      index: typeof _index === "bigint" ? _index : 1n,
      receiver: receiverAddress,
      targetSum,
      balance: 0n,
      goal,
      biggestDonater: ethers.ZeroAddress,
      untilBlockNumber,
      status: BigInt(CharityCampaignStatus.ANNOUNCED),
      fundsTransferredToReceiver: false,
    };

    return Promise.resolve({
      targetSum,
      goal,
      untilBlockNumber,
      charityCampaignObj,
    });
  };
};

export const createCharityCampaignFixture = async (
  args: CharityCampaignArgs = {}
) => {
  const { _contractOwner, ...rest } = args;

  const { charityCampaignContract, owner, signers } = await loadFixture(
    function func() {
      return deployCharityCampaignFixture(_contractOwner);
    }
  );

  const receiver = signers.pop()!;
  const receiverAddress =
    typeof rest._receiverAddress === "string"
      ? rest._receiverAddress
      : receiver.address;

  const { charityCampaignObj, targetSum, goal, untilBlockNumber } =
    await charityCampaignFixture({
      ...rest,
      _receiverAddress: receiverAddress,
    })();

  const _txAuthor =
    typeof args._txAuthor !== "undefined" ? args._txAuthor : owner;

  const tx = await charityCampaignContract
    .connect(_txAuthor)
    .createCharityCampaign(receiverAddress, targetSum, goal, untilBlockNumber);

  return {
    tx,
    charityCampaignContract,
    owner,
    signers,
    charityCampaignObj,
    targetSum,
    goal,
    untilBlockNumber,
    receiver,
    receiverAddress,
  };
};

export const startCharityCampaignFixture = async (
  args: CharityCampaignArgs = {}
) => {
  // TODO: если _txAuthor прокидывается в функцию createCharityCampaignFixture, то в этом нет смысла, тк. нельзя назначить исполнителя конкретно для startCharityCampaignFixture

  const { charityCampaignContract, charityCampaignObj, owner, ...rest } =
    await createCharityCampaignFixture(args);

  const _txAuthor =
    typeof args._txAuthor !== "undefined" ? args._txAuthor : owner;

  const tx = await charityCampaignContract
    .connect(_txAuthor)
    .startCharityCampaign(charityCampaignObj.index);

  return {
    tx,
    charityCampaignContract,
    charityCampaignObj,
    owner,
    ...omit(rest, "tx"),
  };
};

export const cancelCharityCampaignFixture = async (
  args: CharityCampaignArgs = {}
) => {
  const { charityCampaignContract, charityCampaignObj, owner, ...rest } =
    await startCharityCampaignFixture(args);

  const _txAuthor =
    typeof args._txAuthor !== "undefined" ? args._txAuthor : owner;

  const tx = await charityCampaignContract
    .connect(_txAuthor)
    .cancelCharityCampaign(charityCampaignObj.index);

  return {
    tx,
    charityCampaignContract,
    charityCampaignObj,
    ...omit(rest, "tx"),
  };
};

export const prolongateCharityCampaignFixture = async (
  args: CharityCampaignArgs & { newBlockNumber: bigint }
) => {
  const { newBlockNumber, ...restArgs } = args;

  const { charityCampaignContract, charityCampaignObj, owner, ...rest } =
    await startCharityCampaignFixture(restArgs);

  const _txAuthor =
    typeof args._txAuthor !== "undefined" ? args._txAuthor : owner;

  const tx = await charityCampaignContract
    .connect(_txAuthor)
    .prolongateCharityCampaign(newBlockNumber, charityCampaignObj.index);

  return {
    tx,
    charityCampaignContract,
    charityCampaignObj,
    ...omit(rest, "tx"),
  };
};

export const donateToCharityCampaignFixture = async (
  args: CharityCampaignArgs & {
    _donationAmount: bigint;
    _donater: ContractRunner;
    _blocksDelay?: number;
  }
) => {
  const { _donationAmount, _donater, _blocksDelay, ...restArgs } = args;

  const { charityCampaignContract, charityCampaignObj, ...rest } =
    await startCharityCampaignFixture(restArgs);

  if (_blocksDelay) {
    await mine(_blocksDelay);
  }

  const tx = await charityCampaignContract
    .connect(_donater)
    .donate(charityCampaignObj.index, {
      value: _donationAmount,
    });

  return {
    tx,
    charityCampaignContract,
    charityCampaignObj,
    ...omit(rest, "tx"),
  };
};

export const completeCharityCampaignFixture = async (
  args: WithRequired<CharityCampaignArgs, "_targetSum"> & {
    _donationAmount: bigint;
    _donater: ContractRunner;
  }
) => {
  if (args._donationAmount < args._targetSum) {
    throw Error("Donation sum should be larger than targetSum!");
  }

  return await donateToCharityCampaignFixture(args);
};

export const failCharityCampaignFixture = async (
  args: Omit<
    CharityCampaignArgs &
      Partial<{
        _donationAmount: bigint;
        _donater: ContractRunner;
      }>,
    "_untilBlockNumber"
  > = {}
) => {
  const latestBlockNumber = await latestBlockNumberFixture();

  const _untilBlockNumber = BigInt(latestBlockNumber + 10);
  const signers = await ethers.getSigners();

  const _donationAmount =
    typeof args._donationAmount === "bigint"
      ? args._donationAmount
      : ethers.parseUnits("100", "wei");
  const _targetSum = ethers.parseUnits("1000", "wei");
  const _donater =
    typeof args._donater !== "undefined" ? args._donater : signers.pop()!;

  const returnArguments = await donateToCharityCampaignFixture({
    ...args,
    _targetSum,
    _untilBlockNumber,
    _donater,
    _donationAmount,
    _blocksDelay: 100,
  });

  return returnArguments;
};

export const newBlockNumberFixture = async () => {
  const latestBlockNumber = await latestBlockNumberFixture();

  const _untilBlockNumber = BigInt(latestBlockNumber + 30);
  const newBlockNumber = _untilBlockNumber + 5n;

  return {
    _untilBlockNumber,
    newBlockNumber,
  };
};

export const withdrawByReceiverFromCharityCampaignFixture = async (
  args: WithRequired<CharityCampaignArgs, "_targetSum" | "_receiverAddress"> & {
    _donationAmount: bigint;
    _donater: ContractRunner;
    _receiver: ContractRunner;
  }
) => {
  const { _receiver, ...restArgs } = args;

  const { charityCampaignContract, charityCampaignObj, ...rest } =
    await completeCharityCampaignFixture(restArgs);

  const tx = await charityCampaignContract
    .connect(_receiver)
    .receiverWithdraw(charityCampaignObj.index);

  return {
    tx,
    charityCampaignContract,
    charityCampaignObj,
    ...omit(rest, "tx"),
  };
};

export const withdrawByDonaterFromCharityCampaignFixture = async (
  args: WithRequired<CharityCampaignArgs, "_targetSum"> & {
    _donationAmount: bigint;
    _donater: ContractRunner;
  }
) => {
  if (args._donationAmount > args._targetSum) {
    throw Error("Donation sum should be less than targetSum!");
  }

  const { charityCampaignContract, charityCampaignObj, ...rest } =
    await donateToCharityCampaignFixture(args);

  const charityCampaignIndex = charityCampaignObj.index;

  await charityCampaignContract.cancelCharityCampaign(charityCampaignIndex);

  const tx = await charityCampaignContract
    .connect(args._donater)
    .donatersWithdraw(charityCampaignIndex);

  return {
    tx,
    charityCampaignContract,
    charityCampaignObj,
    ...omit(rest, "tx"),
  };
};
