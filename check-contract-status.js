const { ethers } = require("hardhat");

const PAYMENT_SYSTEM_ADDRESS = "0x973112eC6e02E307C1Aa045187601AECA34cd8a5";

async function checkContractStatus() {
    console.log("🔍 检查合约状态...\n");
    
    try {
        // 获取网络信息
        const network = await ethers.provider.getNetwork();
        console.log("📡 当前网络:", network.name);
        console.log("🔗 链ID:", network.chainId);
        
        // 检查合约是否存在
        const code = await ethers.provider.getCode(PAYMENT_SYSTEM_ADDRESS);
        console.log("📋 合约地址:", PAYMENT_SYSTEM_ADDRESS);
        console.log("📏 合约代码长度:", code.length);
        
        if (code === "0x") {
            console.log("❌ 合约不存在或者网络错误！");
            console.log("💡 可能的解决方案:");
            console.log("   1. 检查网络是否正确 (应该是Monad测试网)");
            console.log("   2. 重新部署合约");
            console.log("   3. 检查合约地址是否正确");
            return;
        }
        
        console.log("✅ 合约存在，代码长度:", code.length, "字符");
        
        // 尝试连接合约
        const paymentSystem = await ethers.getContractAt("MonadPaymentSystem", PAYMENT_SYSTEM_ADDRESS);
        
        // 查询合约信息
        const platformFee = await paymentSystem.platformFee();
        const owner = await paymentSystem.owner();
        const paused = await paymentSystem.paused();
        
        console.log("\n📊 合约状态:");
        console.log("   - 平台手续费:", platformFee.toString(), "/ 10000");
        console.log("   - 合约所有者:", owner);
        console.log("   - 暂停状态:", paused);
        
        console.log("\n✅ 合约运行正常！");
        
        // 获取当前区块号
        const blockNumber = await ethers.provider.getBlockNumber();
        console.log("📦 当前区块号:", blockNumber);
        
    } catch (error) {
        console.error("❌ 检查失败:", error.message);
        
        if (error.message.includes("could not detect network")) {
            console.log("\n💡 网络连接问题，请检查:");
            console.log("   - RPC URL是否正确");
            console.log("   - 网络是否可访问");
        }
        
        if (error.message.includes("call revert exception")) {
            console.log("\n💡 合约调用失败，可能原因:");
            console.log("   - 合约地址错误");
            console.log("   - 合约ABI不匹配");
            console.log("   - 网络不匹配");
        }
    }
}

checkContractStatus(); 