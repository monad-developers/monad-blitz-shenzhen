const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 开始部署 MonadPay 支付系统...\n");
    
    // 获取部署账户
    const signers = await ethers.getSigners();
    const deployer = signers[0];
    console.log("📱 部署账户:", deployer.address);
    console.log("💰 账户余额:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

    // 为演示创建虚拟用户地址
    const user1 = deployer; // 使用部署者作为用户1
    const user2Address = "0x0000000000000000000000000000000000000123"; // 虚拟用户2地址

    // 设置手续费接收地址
    const feeRecipient = deployer.address;

    console.log("\n📦 部署合约...");
    
    // 1. 部署主支付系统合约
    const MonadPaymentSystem = await ethers.getContractFactory("MonadPaymentSystem");
    const paymentSystem = await MonadPaymentSystem.deploy(feeRecipient);
    await paymentSystem.waitForDeployment();
    console.log("✅ MonadPaymentSystem 已部署:", await paymentSystem.getAddress());
    
    // 2. 部署URL解析器合约
    const MonadPayURLParser = await ethers.getContractFactory("MonadPayURLParser");
    const urlParser = await MonadPayURLParser.deploy(await paymentSystem.getAddress());
    await urlParser.waitForDeployment();
    console.log("✅ MonadPayURLParser 已部署:", await urlParser.getAddress());

    // 3. 注册常用代币符号
    console.log("\n🔧 配置代币符号...");
    // 使用简单的测试地址，避免校验和问题
    await paymentSystem.registerTokenSymbol("USDC", "0x0000000000000000000000000000000000000001"); // 测试地址1
    await paymentSystem.registerTokenSymbol("USDT", "0x0000000000000000000000000000000000000002"); // 测试地址2
    console.log("✅ 已注册 USDC 和 USDT 代币符号");

    console.log("\n📊 合约信息:");
    console.log("   - 手续费接收地址:", feeRecipient);
    console.log("   - 平台手续费率:", await paymentSystem.platformFee(), "/ 10000 (1%)");
    console.log("   - 合约暂停状态:", await paymentSystem.paused());

    console.log("\n🎮 开始演示 MonadPay 功能...\n");

    // 演示1: 单笔支付
    console.log("💸 演示1: 单笔原生代币支付");
    try {
        const tx1 = await paymentSystem.connect(user1).singlePayment(
            user2Address,
            ethers.ZeroAddress, // 原生代币
            ethers.parseEther("0.1"),
            "咖啡付款",
            { value: ethers.parseEther("0.1") }
        );
        await tx1.wait();
        console.log("✅ 支付成功! 交易哈希:", tx1.hash);
    } catch (error) {
        console.log("❌ 支付失败:", error.message);
    }

    // 演示2: 通过代币符号支付
    console.log("\n🪙 演示2: 通过代币符号支付");
    try {
        const tx2 = await paymentSystem.connect(user1).payByTokenSymbol(
            user2Address,
            ethers.parseEther("0.05"),
            "MONAD",
            "服务费",
            { value: ethers.parseEther("0.05") }
        );
        await tx2.wait();
        console.log("✅ 代币符号支付成功! 交易哈希:", tx2.hash);
    } catch (error) {
        console.log("❌ 代币符号支付失败:", error.message);
    }

    // 演示3: 批量支付
    console.log("\n📦 演示3: 批量支付");
    try {
        const batchPayments = [
            {
                recipient: user2Address,
                token: ethers.ZeroAddress,
                amount: ethers.parseEther("0.02"),
                label: "工资支付1"
            },
            {
                recipient: deployer.address,
                token: ethers.ZeroAddress,
                amount: ethers.parseEther("0.01"),
                label: "工资支付2"
            }
        ];

        const totalAmount = ethers.parseEther("0.03");
        const tx3 = await paymentSystem.connect(user1).batchPayment(
            batchPayments,
            { value: totalAmount }
        );
        await tx3.wait();
        console.log("✅ 批量支付成功! 交易哈希:", tx3.hash);
    } catch (error) {
        console.log("❌ 批量支付失败:", error.message);
    }

    // 演示4: 创建订阅
    console.log("\n📅 演示4: 创建订阅");
    try {
        const tx4 = await paymentSystem.connect(user1).createSubscription(
            user2Address,
            ethers.ZeroAddress,
            ethers.parseEther("0.01"), // 每期0.01 ETH
            7 * 24 * 3600, // 7天间隔
            30 * 24 * 3600, // 30天总期限
            "月度订阅服务"
        );
        const receipt = await tx4.wait();
        
        // 获取订阅ID
        const subscriptionEvent = receipt.events?.find(e => e.event === 'SubscriptionCreated');
        const subscriptionId = subscriptionEvent?.args?.subscriptionId;
        
        console.log("✅ 订阅创建成功! 订阅ID:", subscriptionId?.toString());
    } catch (error) {
        console.log("❌ 订阅创建失败:", error.message);
    }

    // 演示5: 创建解锁金库
    console.log("\n🔐 演示5: 创建解锁金库");
    try {
        const unlockTime = Math.floor(Date.now() / 1000) + 3600; // 1小时后解锁
        const tx5 = await paymentSystem.connect(user1).createVault(
            user2Address,
            ethers.ZeroAddress,
            ethers.parseEther("0.08"),
            unlockTime,
            "员工奖励解锁",
            { value: ethers.parseEther("0.08") }
        );
        const receipt = await tx5.wait();
        
        const vaultEvent = receipt.events?.find(e => e.event === 'VaultCreated');
        const vaultId = vaultEvent?.args?.vaultId;
        
        console.log("✅ 解锁金库创建成功! 金库ID:", vaultId?.toString());
        console.log("   解锁时间:", new Date(unlockTime * 1000).toLocaleString());
    } catch (error) {
        console.log("❌ 金库创建失败:", error.message);
    }

    // 演示6: URL支付示例
    console.log("\n🔗 演示6: MonadPay URL 生成");
    try {
        const sampleURL = await urlParser.buildMonadPayURL(
            user2Address,
            ethers.parseEther("10.5"),
            "USDC",
            "咖啡"
        );
        console.log("✅ 生成的 MonadPay URL:");
        console.log("   ", sampleURL);
    } catch (error) {
        console.log("❌ URL生成失败:", error.message);
    }

    // 查询用户数据
    console.log("\n📈 查询用户数据:");
    const userSubscriptions = await paymentSystem.getUserSubscriptions(user1.address);
    const userVaults = await paymentSystem.getUserVaults(user1.address);
    
    console.log("   用户1订阅数量:", userSubscriptions.length);
    console.log("   用户1金库数量:", userVaults.length);

    console.log("\n🎉 MonadPay 演示完成!");
    console.log("\n📋 部署摘要:");
    console.log("   - MonadPaymentSystem:", await paymentSystem.getAddress());
    console.log("   - MonadPayURLParser:", await urlParser.getAddress());
    console.log("   - 网络:", (await ethers.provider.getNetwork()).name);
    console.log("   - 链ID:", (await ethers.provider.getNetwork()).chainId);

    console.log("\n🔗 MonadPay URL 示例:");
    console.log("   https://pay.monad.link/send?to=" + user2Address + "&amount=10.5&token=USDC&label=咖啡");
    console.log("   https://pay.monad.link/send?to=" + user2Address + "&amount=1.0&token=MONAD&label=小费");

    console.log("\n✨ 您可以现在使用这些合约地址来集成 MonadPay 功能!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 部署失败:", error);
        process.exit(1);
    }); 