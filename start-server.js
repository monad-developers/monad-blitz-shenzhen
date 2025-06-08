const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

// MIME类型映射
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json'
};

const server = http.createServer((req, res) => {
    // 解析URL
    const parsedUrl = url.parse(req.url, true);
    let filePath = parsedUrl.pathname;
    
    // 默认页面
    if (filePath === '/') {
        filePath = '/index.html';
    }
    
    // 支付页面路由
    if (filePath === '/pay') {
        filePath = '/url-payment-handler.html';
    }
    
    // 本地支付页面路由（不依赖CDN）
    if (filePath === '/local') {
        filePath = '/local-payment-handler.html';
    }
    
    // 本地首页（不依赖CDN）
    if (filePath === '/local-index') {
        filePath = '/local-index.html';
    }
    
    // 调试页面路由
    if (filePath === '/debug') {
        filePath = '/debug-network.html';
    }
    
    // 系统状态页面
    if (filePath === '/status') {
        filePath = '/status.html';
    }
    
    // 构建文件路径
    const fullPath = path.join(__dirname, filePath);
    const extname = path.extname(fullPath);
    const contentType = mimeTypes[extname] || 'text/plain';
    
    // 读取文件
    fs.readFile(fullPath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // 404页面
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(`
                    <html>
                        <body>
                            <h1>404 - 页面未找到</h1>
                            <p>请访问 <a href="/pay">支付页面</a></p>
                        </body>
                    </html>
                `);
            } else {
                // 500错误
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('服务器内部错误');
            }
        } else {
            // 成功返回文件
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
});

server.listen(PORT, () => {
    console.log(`🚀 MonadPay 支付服务器启动成功!`);
    console.log(`📡 访问地址: http://localhost:${PORT}`);
    console.log(`💳 支付页面: http://localhost:${PORT}/pay`);
    console.log(`🔧 本地支付页面（无CDN依赖）: http://localhost:${PORT}/local`);
    console.log(`🔍 网络调试工具: http://localhost:${PORT}/debug`);
    console.log('');
    console.log('📋 测试URL示例:');
    console.log(`❌ 如果遇到"ethers is not defined"错误，请使用本地版本:`);
    console.log(`   http://localhost:${PORT}/local?to=0x0000000000000000000000000000000000000456&amount=1.0&token=MONAD&label=购买咖啡`);
    console.log(`✅ 完整功能版本（需要网络连接）:`);
    console.log(`   http://localhost:${PORT}/pay?to=0x0000000000000000000000000000000000000456&amount=10.5&token=USDC&label=购买咖啡`);
    console.log('');
    console.log('🎯 使用方法:');
    console.log('1. 在浏览器中访问上面的测试URL');
    console.log('2. 页面会自动解析URL参数');
    console.log('3. 点击"连接MetaMask钱包"');
    console.log('4. 点击"确认支付"执行交易');
    console.log('');
    console.log('⏹️  按 Ctrl+C 停止服务器');
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n👋 正在关闭服务器...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
}); 