const { ethers } = require("hardhat");

async function main() {
    console.log("开始部署 Monad 支付系统合约...");
    
    // 获取部署账户
    const [deployer] = await ethers.getSigners();
    console.log("部署账户:", deployer.address);
    console.log("账户余额:", ethers.utils.formatEther(await deployer.getBalance()));

    // 设置手续费接收地址（可以是部署者地址或其他地址）
    const feeRecipient = deployer.address;

    // 部署主支付系统合约
    const MonadPaymentSystem = await ethers.getContractFactory("MonadPaymentSystem");
    const paymentSystem = await MonadPaymentSystem.deploy(feeRecipient);
    
    await paymentSystem.deployed();
    console.log("MonadPaymentSystem 合约已部署到:", paymentSystem.address);
    
    // 部署URL解析器合约
    const MonadPayURLParser = await ethers.getContractFactory("MonadPayURLParser");
    const urlParser = await MonadPayURLParser.deploy(paymentSystem.address);

    await urlParser.deployed();

    console.log("MonadPayURLParser 合约已部署到:", urlParser.address);
    console.log("手续费接收地址:", feeRecipient);
    console.log("初始手续费率:", await paymentSystem.platformFee(), "/ 10000"); // 100/10000 = 1%

    // 验证合约部署
    console.log("验证合约功能...");
    
    // 检查合约所有者
    const owner = await paymentSystem.owner();
    console.log("合约所有者:", owner);
    
    // 检查是否暂停
    const paused = await paymentSystem.paused();
    console.log("合约暂停状态:", paused);

    console.log("部署完成！");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 