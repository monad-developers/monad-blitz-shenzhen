### 项目名称
Torch
### 团队信息
- **Gavin:** 邮箱:  farmer.xingang08@gmail.com
- **skyh:** 邮箱: skyhighfeng@gmail.com
- **李:** 邮箱: haohanbang108@gmail.com
- **每每:** 邮箱: 563814345@qq.com
### 项目描述
https://github.com/TorchDotCool/TorchSZ

Torch是⼀个运⾏在Monad公链的代币发⾏协议，融合了游戏机制与激励设计。
每个代币的发⾏被划分为多个限时轮次，⽤户通过 mint 获取代币，并通过燃烧代币参与排⾏榜竞争，赢取链上奖
励。
协议结合了联合曲线定价、⾃动注⼊ LP 以及销毁争夺排⾏榜通缩式机制，重新定义代币发⾏与⽤户参与的⽅式。

架构设计：协议采⽤工厂合约进行部署，实现⾼效、可扩展的合约部署。采⽤ EIP-1167 Minimal Proxy，通过 cloneDeterministic 实
现地址⽣成。

### 可用的在线演示链接
链接: https://torch.cool/

### 所有部署在Monad Testnet的合约地址
- TorchFactory: 0x38bB1A7BF8853190b59327719BECa08608326a2e (工厂合约，用于创建代币)
- TorchGame: 0x450d745D7F9c9B335ed7C73dDac02accC92C1258 （游戏模版合约）
- TorchToken: 0xeE89D4EF0fb010b40Cfc7aCf9A95FF2A6C3aAcCB（代币模版合约）

