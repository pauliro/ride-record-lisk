import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploys a contract named "RideRecords" using the deployer account
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployRideRecords: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("RideRecords", {
    from: deployer,
    args: [], // No constructor arguments for RideRecords.sol
    log: true,
    autoMine: true,
  });
};

export default deployRideRecords;

deployRideRecords.tags = ["RideRecords"];
