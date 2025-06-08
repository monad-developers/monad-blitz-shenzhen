const { ethers } = require("hardhat");

async function checkConfig() {
    try {
        console.log("🔍 检查Monad测试网配置...\n");
        
        // 检查网络连接
        const network = await ethers.provider.getNetwork();
        console.log("📡 网络名称:", network.name);
        console.log("🔗 链ID:", network.chainId.toString());
        
        // 检查账户
        const signers = await ethers.getSigners();
        console.log("📊 可用账户数量:", signers.length);
        
        if (signers.length === 0) {
            console.log("❌ 错误：没有找到账户!");
            console.log("💡 请检查 .env 文件中的 PRIVATE_KEY 配置");
            return;
        }
        
        const deployer = signers[0];
        console.log("📱 部署账户:", deployer.address);
        
        // 检查余额
        const balance = await ethers.provider.getBalance(deployer.address);
        console.log("💰 账户余额:", ethers.formatEther(balance), "MON");
        
        if (balance < ethers.parseEther("0.001")) {
            console.log("⚠️  警告：余额过低!");
            console.log("🔗 请访问水龙头获取测试代币: https://testnet.monad.xyz");
        } else {
            console.log("✅ 配置正常，可以进行部署!");
        }
        
    } catch (error) {
        console.error("❌ 配置检查失败:", error.message);
        
        if (error.message.includes("missing private key")) {
            console.log("\n💡 解决方案:");
            console.log("1. 确保 .env 文件存在");
            console.log("2. 在 .env 文件中添加: PRIVATE_KEY=your_private_key_here");
            console.log("3. 私钥不要包含 0x 前缀");
        }
    }
}

checkConfig(); 