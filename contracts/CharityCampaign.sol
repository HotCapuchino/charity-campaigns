// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.19;

import "hardhat/console.sol";

enum CharityCampaignStatus {
    IDLE,
    ANNOUNCED,
    IN_PROGRESS,
    COMPLETED,
    FAILED
}

struct CharityCampaignInfo {
    address owner;
    uint index;
    address receiver;
    uint targetSum;
    uint balance;
    string goal;
    address biggestDonater;
    uint untilBlockNumber;
    CharityCampaignStatus status;
    mapping(address => uint) donations;
    bool fundsTransferredToReceiver;
}

enum CharityCampaignFailStatus {
    CANCELLED,
    TIME_IS_UP
}

// TODO: добавить re-entrancy modifier
contract CharityContract {
    address public owner;
    mapping(uint => CharityCampaignInfo) public charityCampaigns;
    uint public charityCampaignIndex = 1;

    event CharityCampaignAnnounced(uint indexed charityCampaignIndex, address owner, address receiver, uint targetSum, string goal, uint untilBlockNumber);
    event CharityCampaignStarted(uint indexed charityCampaignIndex);
    event CharityCampaignCompleted(uint indexed charityCampaignIndex, address receiver, uint gatheredSum);
    event CharityCampaignFailed(uint indexed charityCampaignIndex, CharityCampaignFailStatus reason);
    event CharityCampaignProlongated(uint indexed charityCampaignIndex, uint newUntilBlockNumber);
    event DonationRecieved(uint indexed charityCampaignIndex, address donater, uint sum);
    event DonationWithdrawal(uint indexed charityCampaignIndex, address donater, uint sum);
    event CharitySumWithdrawal(uint indexed charityCampaignIndex);

    constructor() {
        owner = msg.sender;
    }

    function getCharityStatusErrorMessage(uint _charityCampaignIndex) internal view returns(string memory) {
        string memory errorMessage = "";
        CharityCampaignStatus charityCampaignStatus = charityCampaigns[_charityCampaignIndex].status;

        if (charityCampaignStatus == CharityCampaignStatus.IDLE) {
            errorMessage = "Charity campaign has not been announced yet!";
        } else if (charityCampaignStatus == CharityCampaignStatus.ANNOUNCED) {
            errorMessage = "Charity campaign has not been started yet!";
        } else if (charityCampaignStatus == CharityCampaignStatus.IN_PROGRESS) {
            errorMessage = "Charity campaign is still in progress!";
        } else if (charityCampaignStatus == CharityCampaignStatus.COMPLETED) {
            errorMessage = "Chartity campaign has already finished!";
        } else {
            errorMessage = "Charity campaign has been failed!";
        }

        return errorMessage;
    }

    modifier onlyCharityCampaignOwner(uint _charityCampaignIndex) {
        require(msg.sender == charityCampaigns[_charityCampaignIndex].owner, "Only charity campaign owner can do this!");
        _;
    }

    modifier onlyCharityReceiver(uint _charityCampaignIndex) {
        require(msg.sender == charityCampaigns[_charityCampaignIndex].receiver, "Only charity campaign receiver can do this!");
        _;
    }

    modifier charityCampaignAnnounced(uint _charityCampaignIndex) {
        require(charityCampaigns[_charityCampaignIndex].status == CharityCampaignStatus.ANNOUNCED, getCharityStatusErrorMessage(_charityCampaignIndex));
        _;
    }

    modifier charityCampaignInProgress(uint _charityCampaignIndex) {
        require(charityCampaigns[_charityCampaignIndex].status == CharityCampaignStatus.IN_PROGRESS, getCharityStatusErrorMessage(_charityCampaignIndex));
        _;
    }

    modifier charityCampaignCompleted(uint _charityCampaignIndex) {
        require(charityCampaigns[_charityCampaignIndex].status == CharityCampaignStatus.COMPLETED, getCharityStatusErrorMessage(_charityCampaignIndex));
        _;
    }

    modifier charityCampaignFailed(uint _charityCampaignIndex) {
        require(charityCampaigns[_charityCampaignIndex].status == CharityCampaignStatus.FAILED, getCharityStatusErrorMessage(_charityCampaignIndex));
        _;
    }

    modifier blockNumberNotExpired(uint blockNumber) {
        require(block.number < blockNumber, "Block number should not be expired!");
        _;
    }

    modifier newBlockNumberNotExpired(uint newBlockNumber, uint _charityCampaignIndex) {
        require(newBlockNumber > charityCampaigns[_charityCampaignIndex].untilBlockNumber, "New block number should be greater then the previous one!");
        _;
    }

    modifier targetSumNotZero(uint targetSum) {
        require(targetSum != 0, "Target sum cannot equals to zero!");
        _;
    }

    modifier receiverNotNull(address receiver) {
        require(receiver != address(0), "Receiver should not an be empty address!");
        _;
    }

    modifier correctCharityCampaignIndex(uint _charityCampaignIndex) {
        if (_charityCampaignIndex == 0) {
            revert("Minimal index of charity campaign is 1!");
        }
        require(_charityCampaignIndex <= charityCampaignIndex, "Charity campaign index should be less or equal to the current charityCampaignIndex!");
        _;
    }

    modifier fundsNotTransferredToReceiver(uint _charityCampaignIndex) {
        require(!charityCampaigns[_charityCampaignIndex].fundsTransferredToReceiver, "Funds has been already transferred to receiver!");
        _;
    }

    function getDonaterAmount(uint _charityCampaignIndex, address donaterAddress) public view correctCharityCampaignIndex(_charityCampaignIndex) returns(uint) {
        return charityCampaigns[_charityCampaignIndex].donations[donaterAddress];
    }

    function donate(uint _charityCampaignIndex) external payable correctCharityCampaignIndex(_charityCampaignIndex) charityCampaignInProgress(_charityCampaignIndex) {
        // TODO: проверить, ссылка тут должна также менять все данные в маппинге при изменении этого объекта!
        CharityCampaignInfo storage charityCampaign = charityCampaigns[_charityCampaignIndex];

        charityCampaign.balance += msg.value;
        charityCampaign.donations[msg.sender] += msg.value;

        if (charityCampaign.donations[msg.sender] > charityCampaign.donations[charityCampaign.biggestDonater]) {
            charityCampaign.biggestDonater = msg.sender;
        } 

        emit DonationRecieved(_charityCampaignIndex, msg.sender, msg.value);

        if (charityCampaign.balance >= charityCampaign.targetSum) {
            charityCampaign.status = CharityCampaignStatus.COMPLETED;

            emit CharityCampaignCompleted(_charityCampaignIndex, charityCampaign.receiver, charityCampaign.balance);
            return;
        }

        if (block.number > charityCampaign.untilBlockNumber) {
            charityCampaign.status = CharityCampaignStatus.FAILED;

            emit CharityCampaignFailed(_charityCampaignIndex, CharityCampaignFailStatus.TIME_IS_UP);
        }
    }

    function createCharityCampaign(
        address receiver, 
        uint targetSum, 
        string memory goal, 
        uint untilBlockNumber
    ) public 
    targetSumNotZero(targetSum)
    blockNumberNotExpired(untilBlockNumber)
    receiverNotNull(receiver) {
        charityCampaigns[charityCampaignIndex].owner = msg.sender;
        charityCampaigns[charityCampaignIndex].index = charityCampaignIndex;
        charityCampaigns[charityCampaignIndex].receiver = receiver;
        charityCampaigns[charityCampaignIndex].targetSum = targetSum;
        charityCampaigns[charityCampaignIndex].balance = 0;
        charityCampaigns[charityCampaignIndex].goal = goal;
        charityCampaigns[charityCampaignIndex].biggestDonater = address(0);
        charityCampaigns[charityCampaignIndex].untilBlockNumber = untilBlockNumber;
        charityCampaigns[charityCampaignIndex].status = CharityCampaignStatus.ANNOUNCED;
        charityCampaigns[charityCampaignIndex].fundsTransferredToReceiver = false;

        emit CharityCampaignAnnounced(charityCampaignIndex, msg.sender, receiver, targetSum, goal, untilBlockNumber);

        charityCampaignIndex++;
    }

    function startCharityCampaign(
        uint _charityCampaignIndex
    ) public 
    correctCharityCampaignIndex(_charityCampaignIndex)
    onlyCharityCampaignOwner(_charityCampaignIndex)
    charityCampaignAnnounced(_charityCampaignIndex) {
        charityCampaigns[_charityCampaignIndex].status = CharityCampaignStatus.IN_PROGRESS;

        emit CharityCampaignStarted(_charityCampaignIndex);
    }

    function prolongateCharityCampaign(
        uint newBlockNumber,
        uint _charityCampaignIndex
    ) public 
    onlyCharityCampaignOwner(_charityCampaignIndex)
    correctCharityCampaignIndex(_charityCampaignIndex) 
    charityCampaignInProgress(_charityCampaignIndex) 
    blockNumberNotExpired(newBlockNumber)
    newBlockNumberNotExpired(newBlockNumber, _charityCampaignIndex) {
        charityCampaigns[_charityCampaignIndex].untilBlockNumber = newBlockNumber;

        emit CharityCampaignProlongated(_charityCampaignIndex, newBlockNumber);
    }

    function donatersWithdraw(uint _charityCampaignIndex) public correctCharityCampaignIndex(_charityCampaignIndex) charityCampaignFailed(_charityCampaignIndex)  {
        uint contribution = charityCampaigns[_charityCampaignIndex].donations[msg.sender];

        charityCampaigns[_charityCampaignIndex].donations[msg.sender] = 0;
        charityCampaigns[_charityCampaignIndex].balance -= contribution;

        if (contribution != 0) {
            (bool sent, ) = msg.sender.call{value: contribution}("");
            require(sent, "Failed to send Ether!");

            emit DonationWithdrawal(_charityCampaignIndex, msg.sender, contribution);
        }
    }

    function receiverWithdraw(
        uint _charityCampaignIndex
    ) public 
    correctCharityCampaignIndex(_charityCampaignIndex)
    onlyCharityReceiver(_charityCampaignIndex) 
    charityCampaignCompleted(_charityCampaignIndex) 
    fundsNotTransferredToReceiver(_charityCampaignIndex) {
        address receiver = charityCampaigns[_charityCampaignIndex].receiver;
        uint sum = charityCampaigns[_charityCampaignIndex].balance;
        charityCampaigns[_charityCampaignIndex].fundsTransferredToReceiver = true;
        charityCampaigns[_charityCampaignIndex].balance = 0;

        (bool sent, ) = receiver.call{value: sum}("");
        require(sent, "Failed to send Ether!");

        emit CharitySumWithdrawal(_charityCampaignIndex);
    }

    function cancelCharityCampaign(
        uint _charityCampaignIndex
    ) public 
    onlyCharityCampaignOwner(_charityCampaignIndex)
    correctCharityCampaignIndex(_charityCampaignIndex) 
    charityCampaignInProgress(_charityCampaignIndex) {
        charityCampaigns[_charityCampaignIndex].status = CharityCampaignStatus.FAILED;

        emit CharityCampaignFailed(_charityCampaignIndex, CharityCampaignFailStatus.CANCELLED);
    }
}
