import { ethers } from "hardhat";

async function main() {
  console.log("Setting up contract relationships...");

  // 获取部署的合约实例
  const nursingHome = await ethers.getContract("NursingHome");
  const hospitalCore = await ethers.getContract("HospitalCore");
  const funeralService = await ethers.getContract("FuneralService");
  const cemetery = await ethers.getContract("Cemetery");

  console.log("Contract addresses:");
  console.log(`NursingHome: ${nursingHome.address}`);
  console.log(`HospitalCore: ${hospitalCore.address}`);
  console.log(`FuneralService: ${funeralService.address}`);
  console.log(`Cemetery: ${cemetery.address}`);

  // 设置合约之间的关联
  console.log("\nSetting contract relationships...");
  
  // 设置养老院合约的医院地址
  console.log("Setting NursingHome's hospital contract address...");
  const tx1 = await nursingHome.setHospitalContract(hospitalCore.address);
  await tx1.wait();
  console.log("✅ NursingHome: Set hospital contract address");
  
  // 设置医院合约的外部服务地址
  console.log("Setting HospitalCore's external contract addresses...");
  const tx2 = await hospitalCore.setExternalContracts(
    nursingHome.address,
    funeralService.address,
    cemetery.address
  );
  await tx2.wait();
  console.log("✅ HospitalCore: Set external contract addresses");
  
  // 设置殡葬服务合约的外部服务地址
  console.log("Setting FuneralService's external contract addresses...");
  const tx3 = await funeralService.setExternalContracts(
    hospitalCore.address,
    cemetery.address
  );
  await tx3.wait();
  console.log("✅ FuneralService: Set external contract addresses");
  
  // 设置墓地合约的殡葬服务地址
  console.log("Setting Cemetery's funeral service contract address...");
  const tx4 = await cemetery.setFuneralServiceContract(funeralService.address);
  await tx4.wait();
  console.log("✅ Cemetery: Set funeral service contract address");
  
  console.log("\nAll contract relationships set successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });