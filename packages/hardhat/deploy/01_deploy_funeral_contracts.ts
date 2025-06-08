import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploys the NursingHome, HospitalCore, FuneralService, and Cemetery contracts
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployFuneralContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // 部署养老院合约
  await deploy("NursingHome", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  // 部署医院合约
  await deploy("HospitalCore", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  // 部署殡葬服务合约
  await deploy("FuneralService", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  // 部署墓地合约
  await deploy("Cemetery", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  console.log("All contracts deployed successfully!");
};

export default deployFuneralContracts;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags FuneralContracts
deployFuneralContracts.tags = ["FuneralContracts"];