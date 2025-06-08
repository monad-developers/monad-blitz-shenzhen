require('dotenv').config();

console.log("🔍 MonadPay 诊断报告\n");

// 1. 检查环境变量
console.log("📋 环境变量检查:");
console.log("   - PRIVATE_KEY 是否存在:", !!process.env.PRIVATE_KEY);
console.log("   - PRIVATE_KEY 长度:", process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.length : 0);
console.log("   - PRIVATE_KEY 格式:", process.env.PRIVATE_KEY ? (process.env.PRIVATE_KEY.startsWith('0x') ? '包含0x前缀 ❌' : '不包含0x前缀 ✅') : 'N/A');

// 2. 检查网络连接
console.log("\n🌐 网络连接检查:");
const https = require('https');

function testConnection(url, name) {
    return new Promise((resolve) => {
        const request = https.get(url, { timeout: 5000 }, (res) => {
            console.log(`   - ${name}:`, res.statusCode === 200 ? '✅ 连接正常' : `❌ 状态码: ${res.statusCode}`);
            resolve(true);
        });
        
        request.on('timeout', () => {
            console.log(`   - ${name}: ❌ 连接超时`);
            request.destroy();
            resolve(false);
        });
        
        request.on('error', (error) => {
            console.log(`   - ${name}: ❌ 连接失败 -`, error.message);
            resolve(false);
        });
    });
}

async function runDiagnosis() {
    await testConnection('https://testnet-rpc.monad.xyz', 'Monad RPC');
    await testConnection('https://testnet.monad.xyz', 'Monad 水龙头');
    await testConnection('https://testnet-explorer.monad.xyz', 'Monad 浏览器');
    
    console.log("\n💡 解决方案:");
    
    if (!process.env.PRIVATE_KEY) {
        console.log("❌ 私钥未配置!");
        console.log("   1. 确保 .env 文件存在");
        console.log("   2. 在 .env 文件中添加: PRIVATE_KEY=your_private_key_here");
        console.log("   3. 私钥不要包含 0x 前缀");
    } else if (process.env.PRIVATE_KEY.length !== 64) {
        console.log("❌ 私钥长度不正确!");
        console.log("   - 当前长度:", process.env.PRIVATE_KEY.length);
        console.log("   - 应该是64位字符");
    } else if (process.env.PRIVATE_KEY.startsWith('0x')) {
        console.log("❌ 私钥格式不正确!");
        console.log("   - 请去掉开头的 0x 前缀");
    } else {
        console.log("✅ 私钥配置正确");
        console.log("   - 如果仍然有问题，可能是网络连接问题");
    }
    
    console.log("\n📝 下一步操作:");
    console.log("1. 修复上述问题");
    console.log("2. 运行: npx hardhat run check-config.js --network monad_testnet");
    console.log("3. 如果配置正确，运行: npm run deploy:monad");
}

runDiagnosis(); 