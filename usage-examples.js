const { ethers } = require("hardhat");

/**
 * Monad支付系统合约使用示例
 * 展示如何使用各种支付功能
 */

async function main() {
    // 假设合约已部署，这里使用合约地址
    const CONTRACT_ADDRESS = "0x..."; // 替换为实际部署的合约地址
    
    // 获取签名者
    const [owner, user1, user2, user3] = await ethers.getSigners();
    
    // 连接到合约
    const MonadPaymentSystem = await ethers.getContractFactory("MonadPaymentSystem");
    const paymentSystem = MonadPaymentSystem.attach(CONTRACT_ADDRESS);
    
    console.log("=== Monad 支付系统使用示例 ===\n");

    // 1. 单笔支付示例
    console.log("1. 单笔支付示例");
    try {
        const tx1 = await paymentSystem.connect(user1).singlePayment(
            user2.address,                    // 收款地址
            ethers.constants.AddressZero,     // 原生代币（MONAD）
            ethers.utils.parseEther("1.0"),   // 1 MONAD
            "咖啡付款",                       // 备注
            { value: ethers.utils.parseEther("1.0") }
        );
        await tx1.wait();
        console.log("✅ 单笔支付成功，交易哈希:", tx1.hash);
    } catch (error) {
        console.log("❌ 单笔支付失败:", error.message);
    }

    // 2. 批量支付示例
    console.log("\n2. 批量支付示例");
    try {
        const batchPayments = [
            {
                recipient: user2.address,
                token: ethers.constants.AddressZero,
                amount: ethers.utils.parseEther("0.5"),
                label: "工资支付1"
            },
            {
                recipient: user3.address,
                token: ethers.constants.AddressZero,
                amount: ethers.utils.parseEther("0.3"),
                label: "工资支付2"
            }
        ];
        
        const totalAmount = ethers.utils.parseEther("0.8");
        const tx2 = await paymentSystem.connect(user1).batchPayment(
            batchPayments,
            { value: totalAmount }
        );
        await tx2.wait();
        console.log("✅ 批量支付成功，交易哈希:", tx2.hash);
    } catch (error) {
        console.log("❌ 批量支付失败:", error.message);
    }

    // 3. 创建订阅示例
    console.log("\n3. 创建订阅示例");
    try {
        const tx3 = await paymentSystem.connect(user1).createSubscription(
            user2.address,                     // 收款人
            ethers.constants.AddressZero,      // 原生代币
            ethers.utils.parseEther("0.1"),    // 每期0.1 MONAD
            7 * 24 * 3600,                     // 7天间隔
            30 * 24 * 3600,                    // 30天总期限
            "月度订阅服务"                      // 备注
        );
        const receipt = await tx3.wait();
        
        // 获取订阅ID
        const subscriptionEvent = receipt.events?.find(e => e.event === 'SubscriptionCreated');
        const subscriptionId = subscriptionEvent?.args?.subscriptionId;
        
        console.log("✅ 订阅创建成功，订阅ID:", subscriptionId?.toString());
        
        // 4. 执行订阅支付示例
        console.log("\n4. 执行订阅支付示例");
        // 注意：实际使用中需要等待间隔时间
        const canExecute = await paymentSystem.canExecuteSubscription(subscriptionId);
        console.log("可以执行订阅支付:", canExecute);
        
        if (canExecute) {
            const tx4 = await paymentSystem.connect(user1).executeSubscriptionPayment(
                subscriptionId,
                { value: ethers.utils.parseEther("0.1") }
            );
            await tx4.wait();
            console.log("✅ 订阅支付成功，交易哈希:", tx4.hash);
        }
        
    } catch (error) {
        console.log("❌ 订阅操作失败:", error.message);
    }

    // 5. 创建解锁金库示例
    console.log("\n5. 创建解锁金库示例");
    try {
        const unlockTime = Math.floor(Date.now() / 1000) + 3600; // 1小时后解锁
        const tx5 = await paymentSystem.connect(user1).createVault(
            user2.address,                     // 受益人
            ethers.constants.AddressZero,      // 原生代币
            ethers.utils.parseEther("2.0"),    // 锁定2 MONAD
            unlockTime,                        // 解锁时间
            "员工奖励解锁",                     // 备注
            { value: ethers.utils.parseEther("2.0") }
        );
        const receipt = await tx5.wait();
        
        // 获取金库ID
        const vaultEvent = receipt.events?.find(e => e.event === 'VaultCreated');
        const vaultId = vaultEvent?.args?.vaultId;
        
        console.log("✅ 解锁金库创建成功，金库ID:", vaultId?.toString());
        console.log("解锁时间:", new Date(unlockTime * 1000).toLocaleString());
        
        // 检查是否可以领取
        const canClaim = await paymentSystem.canClaimVault(vaultId);
        console.log("当前可以领取:", canClaim);
        
    } catch (error) {
        console.log("❌ 金库创建失败:", error.message);
    }

    // 6. 查询用户数据示例
    console.log("\n6. 查询用户数据示例");
    try {
        const userSubscriptions = await paymentSystem.getUserSubscriptions(user1.address);
        const userVaults = await paymentSystem.getUserVaults(user1.address);
        
        console.log("用户订阅列表:", userSubscriptions.map(id => id.toString()));
        console.log("用户金库列表:", userVaults.map(id => id.toString()));
        
        // 查询具体订阅信息
        if (userSubscriptions.length > 0) {
            const subscription = await paymentSystem.getSubscription(userSubscriptions[0]);
            console.log("第一个订阅详情:", {
                subscriber: subscription.subscriber,
                recipient: subscription.recipient,
                amount: ethers.utils.formatEther(subscription.amount),
                interval: subscription.interval.toString() + "秒",
                active: subscription.active,
                label: subscription.label
            });
        }
        
    } catch (error) {
        console.log("❌ 查询失败:", error.message);
    }

    console.log("\n=== 示例完成 ===");
}

// 调用URL解析示例
function parsePaymentURL(url) {
    console.log("\n=== URL解析示例 ===");
    
    // 示例URL: https://pay.monad.link/send?to=0x123...abc&amount=10.5&token=USDC&label=咖啡
    const urlObj = new URL(url);
    const params = {
        to: urlObj.searchParams.get('to'),
        amount: urlObj.searchParams.get('amount'),
        token: urlObj.searchParams.get('token') || 'MONAD',
        tokenAddress: urlObj.searchParams.get('tokenAddress'),
        chainId: urlObj.searchParams.get('chainId') || '1',
        label: urlObj.searchParams.get('label') || ''
    };
    
    console.log("解析的支付参数:", params);
    
    // 构建合约调用参数
    const contractParams = {
        to: params.to,
        token: params.tokenAddress || ethers.constants.AddressZero, // 如果没有tokenAddress，使用原生代币
        amount: ethers.utils.parseEther(params.amount),
        label: params.label
    };
    
    console.log("合约调用参数:", contractParams);
    return contractParams;
}

// 示例URL解析
const exampleURL = "https://pay.monad.link/send?to=0x742d35Cc6634C0532925a3b8D2A3B6C8a84fF5e&amount=10.5&token=USDC&label=咖啡";
parsePaymentURL(exampleURL);

// 运行主函数
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { parsePaymentURL }; 