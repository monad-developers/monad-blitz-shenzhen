require("@nomicfoundation/hardhat-toolbox");

// 手动加载环境变量
const fs = require('fs');
const path = require('path');
try {
  const envPath = path.resolve('.env');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8')
      .split('\n')
      .reduce((acc, line) => {
        const [key, value] = line.split('=');
        if (key && value) {
          acc[key.trim()] = value.trim();
        }
        return acc;
      }, {});
    Object.assign(process.env, envConfig);
  }
} catch (error) {
  console.log('Warning: Could not load .env file');
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // 本地测试网络
    hardhat: {},
    
    // Monad测试网络
    monad_testnet: {
      url: "https://testnet-rpc.monad.xyz", // Monad测试网RPC URL
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      chainId: 10143, // Monad测试网链ID (0x279F)
      gasPrice: 50000000000, // 50 gwei (大幅提高Gas价格)
      gas: 8000000, // 增加Gas限制到8M
      timeout: 120000, // 增加超时时间到2分钟
    },
    
    // Monad主网络
    monad_mainnet: {
      url: "https://rpc.monad.xyz", // Monad主网RPC URL
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      chainId: 1337, // Monad主网链ID 
      gasPrice: 1000000000, // 1 gwei
    }
  },
  
  // 代码验证配置
  etherscan: {
    apiKey: {
      monad_testnet: process.env.MONAD_API_KEY || "dummy-api-key",
      monad_mainnet: process.env.MONAD_API_KEY || "dummy-api-key"
    },
    customChains: [
      {
        network: "monad_testnet",
        chainId: 10143,
        urls: {
          apiURL: "https://testnet-explorer.monad.xyz/api",
          browserURL: "https://testnet-explorer.monad.xyz"
        }
      },
      {
        network: "monad_mainnet", 
        chainId: 1337,
        urls: {
          apiURL: "https://explorer.monad.xyz/api",
          browserURL: "https://explorer.monad.xyz"
        }
      }
    ]
  },
  
  // Gas报告
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  }
}; 