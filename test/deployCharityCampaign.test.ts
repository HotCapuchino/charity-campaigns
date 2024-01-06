import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { deployCharityCampaignFixture } from "./fixtures";
import { expect } from "chai";

describe("Deploying charity campaign", () => {
  it("Should set the right owner", async () => {
    const { charityCampaignContract, owner } = await loadFixture(
      deployCharityCampaignFixture
    );

    expect(await charityCampaignContract.owner()).to.equal(owner.address);
  });
});
