const https = require('https');

function testRPC() {
    console.log("🌐 测试Monad网络连接...\n");
    
    const postData = JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_blockNumber",
        params: [],
        id: 1
    });
    
    const options = {
        hostname: 'testnet-rpc.monad.xyz',
        port: 443,
        path: '/',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 10000
    };
    
    const req = https.request(options, (res) => {
        console.log(`✅ 连接成功! 状态码: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                console.log("📊 RPC响应:", response);
                if (response.result) {
                    const blockNumber = parseInt(response.result, 16);
                    console.log(`🔢 当前区块号: ${blockNumber}`);
                    console.log("✅ Monad测试网连接正常!");
                }
            } catch (e) {
                console.log("❌ 解析响应失败:", e.message);
            }
        });
    });
    
    req.on('error', (e) => {
        console.log(`❌ 连接失败: ${e.message}`);
        console.log("💡 可能的解决方案:");
        console.log("   1. 检查网络连接");
        console.log("   2. 检查防火墙设置");
        console.log("   3. 尝试使用VPN");
        console.log("   4. 稍后重试");
    });
    
    req.on('timeout', () => {
        console.log("❌ 连接超时");
        console.log("💡 网络可能较慢或不稳定");
        req.destroy();
    });
    
    req.write(postData);
    req.end();
}

testRPC(); 