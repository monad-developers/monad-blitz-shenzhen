# Torch — Light Up The Chain



Torch is a strategy-driven, onchain launch protocol built for high-performance chains like Monad. It transforms token launches into a competitive game with **mint thresholds**, **burn-to-win rewards**, and **automated liquidity** — all in one frictionless flow.


## Features

- **Round-based Launch Flow**

  Mint tokens in multiple rounds with time limits and funding thresholds.

- **Burn Leaderboard Mechanism**

  Participants compete by burning tokens to earn rewards.

- **Auto Liquidity Injection**

  Upon meeting mint thresholds, liquidity is automatically created via integrated DEX router.

- **Permissionless Deployment**

  Anyone can deploy a new launch with configurable parameters.



## Smart Contract Structure



| **Contract**     | **Description**                                |
| ---------------- | ---------------------------------------------- |
| TorchFactory.sol | Main factory to create new Torch launch rounds |
| TorchGame.sol    | Core round logic: mint, burn, claim, settle    |
| TorchToken.sol   | Erc20 tokens                                   |
| Interfaces/      | external interfaces (e.g., router)             |





## Deployment (Testnet)





Torch is deployed on **Monad Testnet**.

**Network RPC**: https://testnet-rpc.monad.xyz/

**Chain ID**: 10143

**Example Deployment Address**:

```
TorchFactory: 0x38bB1A7BF8853190b59327719BECa08608326a2e
TorchGame: 0x450d745D7F9c9B335ed7C73dDac02accC92C1258
TorchToken: 0xeE89D4EF0fb010b40Cfc7aCf9A95FF2A6C3aAcCB
```



## Basic Interactions



### **Mint**



```
TorchLaunch.deposit{value: amount}();
```



### **Burn**



```
TorchGame.burnToCompete(amount);
```



### **Claim Reward (after round ends)**



```
TorchGame.claimReward();
```



### **Create New Launch (via Factory)**



```
TorchFactory.createGame(

);
```



## License





MIT License © Torch Protocol 2025



##  Join Us





Want to integrate Torch into your dApp or launch on Monad?

Follow us on Twitter → [@**Torch Cool**](https://twitter.com/torchdotcool)