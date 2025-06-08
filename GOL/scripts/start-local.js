const hre = require("hardhat");

async function main() {
  // 获取合约工厂
  const GameOfLife = await hre.ethers.getContractFactory("GameOfLifeDemo");
  
  // 部署合约
  console.log("正在部署 GameOfLifeDemo 合约...");
  const gameOfLife = await GameOfLife.deploy();
  await gameOfLife.waitForDeployment();
  
  const address = await gameOfLife.getAddress();
  console.log("GameOfLifeDemo 已部署到:", address);

  // 打印部署信息
  console.log("\n部署信息：");
  console.log("=================");
  console.log("网络: localhost");
  console.log("链ID: 31337");
  console.log("RPC URL: http://127.0.0.1:8545");
  console.log("合约地址:", address);
  console.log("=================\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
