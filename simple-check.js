const fs = require('fs');
const path = require('path');

console.log("🔍 MonadPay 快速诊断\n");

// 检查 .env 文件
const envPath = path.join(__dirname, '.env');
console.log("📋 文件检查:");
console.log("   - .env 文件存在:", fs.existsSync(envPath) ? "✅ 是" : "❌ 否");

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log("   - .env 文件大小:", envContent.length, "字符");
    
    // 检查私钥配置
    const privateKeyMatch = envContent.match(/PRIVATE_KEY\s*=\s*(.+)/);
    if (privateKeyMatch) {
        const privateKey = privateKeyMatch[1].trim();
        console.log("   - PRIVATE_KEY 配置:", privateKey ? "✅ 已配置" : "❌ 未配置");
        
        if (privateKey && privateKey !== 'your_private_key_here') {
            console.log("   - 私钥长度:", privateKey.length);
            console.log("   - 私钥格式:", privateKey.startsWith('0x') ? "❌ 包含0x前缀" : "✅ 不包含0x前缀");
            
            if (privateKey.length === 64 && !privateKey.startsWith('0x')) {
                console.log("   ✅ 私钥配置看起来正确!");
            } else {
                console.log("   ❌ 私钥配置有问题!");
            }
        } else {
            console.log("   ❌ 私钥还是默认值，需要替换为真实私钥!");
        }
    } else {
        console.log("   - PRIVATE_KEY 配置: ❌ 未找到");
    }
} else {
    console.log("   ❌ .env 文件不存在!");
}

console.log("\n💡 解决步骤:");
console.log("1. 确保您已经:");
console.log("   - 安装了 MetaMask");
console.log("   - 添加了 Monad 测试网 (链ID: 10143)");
console.log("   - 从水龙头获取了测试代币");
console.log("   - 导出了私钥（不含0x前缀）");
console.log("");
console.log("2. 编辑 .env 文件:");
console.log('   PRIVATE_KEY=您的64位私钥（不含0x前缀）');
console.log("");
console.log("3. 完成后运行:");
console.log("   npx hardhat run check-config.js --network monad_testnet");

console.log("\n🔗 重要链接:");
console.log("   - MetaMask: https://metamask.io/");
console.log("   - Monad 水龙头: https://testnet.monad.xyz");
console.log("   - Monad 浏览器: https://testnet-explorer.monad.xyz"); 