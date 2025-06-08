const { ethers } = require("hardhat");

async function testPrivateKey() {
    console.log("🔍 测试私钥加载...\n");
    
    try {
        // 获取签名者
        const signers = await ethers.getSigners();
        console.log("📊 签名者数量:", signers.length);
        
        if (signers.length > 0) {
            const signer = signers[0];
            console.log("✅ 签名者地址:", signer.address);
            
            // 测试本地网络（不需要网络连接）
            console.log("🔧 切换到本地测试网络...");
            
        } else {
            console.log("❌ 没有找到签名者");
            console.log("🔧 环境变量 PRIVATE_KEY:", process.env.PRIVATE_KEY ? "已设置" : "未设置");
        }
        
    } catch (error) {
        console.log("❌ 错误:", error.message);
    }
}

testPrivateKey(); 