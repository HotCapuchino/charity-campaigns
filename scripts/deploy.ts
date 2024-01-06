import { ethers } from "hardhat";

async function main() {
  const charityCampaign = await ethers.deployContract("CharityCampaign");

  await charityCampaign.waitForDeployment();

  console.log(
    `Charity campaign contract deployed at ${charityCampaign.target}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
