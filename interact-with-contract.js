const { ethers } = require("hardhat");

// 已部署的合约地址
const PAYMENT_SYSTEM_ADDRESS = "0x973112eC6e02E307C1Aa045187601AECA34cd8a5";
const URL_PARSER_ADDRESS = "0x2d4453C4054D18c895062c3a0f31f3a84c2911E0";

async function interactWithContract() {
    console.log("🔗 连接到已部署的MonadPay合约...\n");
    
    // 获取签名者
    const [signer] = await ethers.getSigners();
    console.log("📱 当前账户:", signer.address);
    
    // 连接到已部署的合约
    const paymentSystem = await ethers.getContractAt("MonadPaymentSystem", PAYMENT_SYSTEM_ADDRESS);
    const urlParser = await ethers.getContractAt("MonadPayURLParser", URL_PARSER_ADDRESS);
    
    console.log("✅ 成功连接到合约:");
    console.log("   - MonadPaymentSystem:", PAYMENT_SYSTEM_ADDRESS);
    console.log("   - MonadPayURLParser:", URL_PARSER_ADDRESS);
    
    // 查询合约基本信息
    console.log("\n📊 合约信息:");
    const platformFee = await paymentSystem.platformFee();
    const feeRecipient = await paymentSystem.feeRecipient();
    const owner = await paymentSystem.owner();
    const paused = await paymentSystem.paused();
    
    console.log("   - 平台手续费:", platformFee.toString(), "/ 10000");
    console.log("   - 手续费接收地址:", feeRecipient);
    console.log("   - 合约所有者:", owner);
    console.log("   - 暂停状态:", paused);
    
    // 示例1: 执行单笔支付
    console.log("\n💸 示例1: 执行单笔支付");
    const recipient = "0x0000000000000000000000000000000000000456"; // 收款地址
    const amount = ethers.parseEther("0.01"); // 0.01 ETH
    
    try {
        const tx = await paymentSystem.singlePayment(
            recipient,
            ethers.ZeroAddress, // 原生代币
            amount,
            "测试支付",
            { value: amount }
        );
        console.log("📤 交易已发送，等待确认...");
        console.log("   交易哈希:", tx.hash);
        
        const receipt = await tx.wait();
        console.log("✅ 支付成功!");
        console.log("   区块号:", receipt.blockNumber);
        console.log("   Gas使用:", receipt.gasUsed.toString());
        
    } catch (error) {
        console.log("❌ 支付失败:", error.message);
    }
    
    // 示例2: 查询用户数据
    console.log("\n📈 示例2: 查询用户数据");
    try {
        const userSubscriptions = await paymentSystem.getUserSubscriptions(signer.address);
        const userVaults = await paymentSystem.getUserVaults(signer.address);
        
        console.log("   - 用户订阅数量:", userSubscriptions.length);
        console.log("   - 用户金库数量:", userVaults.length);
        
        if (userSubscriptions.length > 0) {
            console.log("   - 最新订阅ID:", userSubscriptions[userSubscriptions.length - 1].toString());
        }
        
    } catch (error) {
        console.log("❌ 查询失败:", error.message);
    }
    
    // 示例3: 生成支付URL
    console.log("\n🔗 示例3: 生成支付URL");
    try {
        const paymentURL = await urlParser.buildMonadPayURL(
            recipient,
            ethers.parseEther("5.0"),
            "USDC",
            "购买商品"
        );
        console.log("✅ 支付URL:", paymentURL);
        
    } catch (error) {
        console.log("❌ URL生成失败:", error.message);
    }
    
    console.log("\n🎉 合约交互演示完成!");
}

// 如果直接运行此文件
if (require.main === module) {
    interactWithContract()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("❌ 错误:", error);
            process.exit(1);
        });
}

module.exports = { interactWithContract, PAYMENT_SYSTEM_ADDRESS, URL_PARSER_ADDRESS }; 