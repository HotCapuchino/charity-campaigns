import { ContractRunner } from "ethers";

export enum CharityCampaignStatus {
  IDLE,
  ANNOUNCED,
  IN_PROGRESS,
  COMPLETED,
  FAILED,
}

export enum CharityCampaignFailStatus {
  CANCELLED,
  TIME_IS_UP,
}

export type CharityCampaignArgs = {
  _contractOwner?: ContractRunner;
  _charityCampaignOwnerAddress?: string;
  _txAuthor?: ContractRunner;
  _untilBlockNumber?: bigint;
  _targetSum?: bigint;
  _receiverAddress?: string;
  _goal?: string;
  _index?: bigint;
};

export enum CharityCampaignContractErrors {
  ONLY_CHARITY_CAMPAIGN_OWNER = "Only charity campaign owner can do this!",
  ONLY_CHARITY_CAMPAIGN_RECEIVER = "Only charity campaign receiver can do this!",
  CHARITY_CAMPAIGN_IDLE = "Charity campaign has not been announced yet!",
  CHARITY_CAMPAIGN_ANNOUNCED = "Charity campaign has not been started yet!",
  CHARITY_CAMPAIGN_IN_PROGRESS = "Charity campaign is still in progress!",
  CHARITY_CAMPAIGN_COMPLETED = "Chartity campaign has already finished!",
  CHARITY_CAMPAIGN_FAILED = "Charity campaign has been failed!",
  BLOCKNUMBER_NOT_EXPIRED = "Block number should not be expired!",
  NEW_BLOCKNUMBER_NOT_EXPIRED = "New block number should be greater then the previous one!",
  TARGET_SUM_NOT_ZERO = "Target sum cannot equals to zero!",
  RECEIVER_NOT_NULL = "Receiver should not an be empty address!",
  CORRECT_CHARITY_CAMPAIGN_INDEX_ZERO = "Minimal index of charity campaign is 1!",
  CORRECT_CHARITY_CAMPAIGN_INDEX_GT_ZERO = "Charity campaign index should be less or equal to the current charityCampaignIndex!",
  FUNDS_NOT_TRANSFERRED_TO_RECEIVER = "Funds has been already transferred to receiver!",
}
