const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying MonadPay to Monad Testnet...\n");
    
    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log("📡 Network:", network.name);
    console.log("🔗 Chain ID:", network.chainId);
    
    // Get deployment account
    const [deployer] = await ethers.getSigners();
    console.log("📱 Deploying from account:", deployer.address);
    
    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
    
    if (balance < ethers.parseEther("0.01")) {
        console.log("⚠️  Warning: Low balance. You may need more test tokens.");
        console.log("🔗 Get testnet tokens from Monad faucet");
    }

    // Set fee recipient (deployer for simplicity)
    const feeRecipient = deployer.address;

    console.log("\n📦 Deploying contracts...");
    
    try {
        // 1. Deploy main payment system contract
        console.log("1️⃣  Deploying MonadPaymentSystem...");
        const MonadPaymentSystem = await ethers.getContractFactory("MonadPaymentSystem");
        const paymentSystem = await MonadPaymentSystem.deploy(feeRecipient);
        await paymentSystem.waitForDeployment();
        const paymentSystemAddress = await paymentSystem.getAddress();
        console.log("✅ MonadPaymentSystem deployed to:", paymentSystemAddress);
        
        // 2. Deploy URL parser contract
        console.log("2️⃣  Deploying MonadPayURLParser...");
        const MonadPayURLParser = await ethers.getContractFactory("MonadPayURLParser");
        const urlParser = await MonadPayURLParser.deploy(paymentSystemAddress);
        await urlParser.waitForDeployment();
        const urlParserAddress = await urlParser.getAddress();
        console.log("✅ MonadPayURLParser deployed to:", urlParserAddress);

        // 3. Configure token symbols
        console.log("3️⃣  Configuring token symbols...");
        await paymentSystem.registerTokenSymbol("USDC", "0x0000000000000000000000000000000000000001"); // Placeholder
        await paymentSystem.registerTokenSymbol("USDT", "0x0000000000000000000000000000000000000002"); // Placeholder
        console.log("✅ Token symbols configured");

        console.log("\n🎉 Deployment completed successfully!");
        console.log("\n📋 Contract Addresses:");
        console.log("┌─────────────────────────┬──────────────────────────────────────────────┐");
        console.log("│ Contract                │ Address                                      │");
        console.log("├─────────────────────────┼──────────────────────────────────────────────┤");
        console.log(`│ MonadPaymentSystem      │ ${paymentSystemAddress} │`);
        console.log(`│ MonadPayURLParser       │ ${urlParserAddress} │`);
        console.log("└─────────────────────────┴──────────────────────────────────────────────┘");

        console.log("\n⚙️  Contract Configuration:");
        console.log(`   - Fee Recipient: ${feeRecipient}`);
        console.log(`   - Platform Fee: ${await paymentSystem.platformFee()}/10000 (1%)`);
        console.log(`   - Contract Owner: ${await paymentSystem.owner()}`);

        console.log("\n🔗 MonadPay URL Examples:");
        console.log(`   https://pay.monad.link/send?to=${paymentSystemAddress}&amount=1.0&token=MONAD&label=test`);
        console.log(`   https://pay.monad.link/send?to=${deployer.address}&amount=0.1&token=USDC&label=coffee`);

        console.log("\n📝 Next Steps:");
        console.log("1. Save these contract addresses");
        console.log("2. Verify contracts on Monad Explorer:");
        console.log(`   npm run verify:testnet ${paymentSystemAddress} "${feeRecipient}"`);
        console.log(`   npm run verify:testnet ${urlParserAddress} "${paymentSystemAddress}"`);
        console.log("3. Test the contracts with the demo script:");
        console.log("   npm run demo:testnet");
        console.log("4. Integrate into your frontend application");

        // Save deployment info
        const deploymentInfo = {
            network: network.name,
            chainId: network.chainId.toString(),
            deployer: deployer.address,
            timestamp: new Date().toISOString(),
            contracts: {
                MonadPaymentSystem: paymentSystemAddress,
                MonadPayURLParser: urlParserAddress
            },
            configuration: {
                feeRecipient: feeRecipient,
                platformFee: (await paymentSystem.platformFee()).toString(),
                owner: await paymentSystem.owner()
            }
        };

        console.log("\n💾 Deployment Info (save this):");
        console.log(JSON.stringify(deploymentInfo, null, 2));

        return deploymentInfo;

    } catch (error) {
        console.error("❌ Deployment failed:", error);
        throw error;
    }
}

main()
    .then((deploymentInfo) => {
        console.log("\n🎊 MonadPay deployment completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("💥 Deployment error:", error);
        process.exit(1);
    }); 