const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MonadPaymentSystem - singlePayment函数测试", function () {
    let paymentSystem;
    let mockToken;
    let owner;
    let feeRecipient;
    let sender;
    let recipient;
    let attacker;
    
    const PLATFORM_FEE = 100; // 1% (100/10000)
    const NATIVE_TOKEN = ethers.ZeroAddress;
    
    beforeEach(async function () {
        // 获取测试账户
        [owner, feeRecipient, sender, recipient, attacker] = await ethers.getSigners();
        
        // 部署支付系统合约
        const MonadPaymentSystem = await ethers.getContractFactory("MonadPaymentSystem");
        paymentSystem = await MonadPaymentSystem.deploy(feeRecipient.address);
        await paymentSystem.waitForDeployment();
        
        // 部署模拟ERC20代币用于测试
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        mockToken = await MockERC20.deploy("Test Token", "TEST", 18);
        await mockToken.waitForDeployment();
        
        // 给sender分配一些测试代币
        await mockToken.mint(sender.address, ethers.parseEther("1000"));
        
        // sender授权支付系统合约使用其代币
        await mockToken.connect(sender).approve(await paymentSystem.getAddress(), ethers.parseEther("1000"));
    });
    
    describe("原生代币支付测试", function () {
        it("应该成功执行原生代币支付", async function () {
            const paymentAmount = ethers.parseEther("1.0");
            const expectedFee = paymentAmount * BigInt(PLATFORM_FEE) / BigInt(10000);
            const expectedNetAmount = paymentAmount - expectedFee;
            
            // 记录支付前余额
            const recipientBalanceBefore = await ethers.provider.getBalance(recipient.address);
            const feeRecipientBalanceBefore = await ethers.provider.getBalance(feeRecipient.address);
            
            // 执行支付
            const tx = await paymentSystem.connect(sender).singlePayment(
                recipient.address,
                NATIVE_TOKEN,
                paymentAmount,
                "test payment",
                { value: paymentAmount }
            );
            
            // 验证余额变化
            const recipientBalanceAfter = await ethers.provider.getBalance(recipient.address);
            const feeRecipientBalanceAfter = await ethers.provider.getBalance(feeRecipient.address);
            
            expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(expectedNetAmount);
            expect(feeRecipientBalanceAfter - feeRecipientBalanceBefore).to.equal(expectedFee);
            
            // 验证事件触发
            await expect(tx)
                .to.emit(paymentSystem, "SinglePayment")
                .withArgs(
                    sender.address,
                    recipient.address,
                    NATIVE_TOKEN,
                    paymentAmount,
                    "test payment",
                    await (await ethers.provider.getNetwork()).chainId
                );
        });
        
        it("应该正确计算不同金额的手续费", async function () {
            const testCases = [
                ethers.parseEther("0.1"),   // 0.1 ETH
                ethers.parseEther("1.0"),   // 1.0 ETH
                ethers.parseEther("10.0"),  // 10.0 ETH
                ethers.parseEther("0.01")   // 0.01 ETH
            ];
            
            for (const amount of testCases) {
                const expectedFee = amount * BigInt(PLATFORM_FEE) / BigInt(10000);
                const expectedNetAmount = amount - expectedFee;
                
                const recipientBalanceBefore = await ethers.provider.getBalance(recipient.address);
                const feeRecipientBalanceBefore = await ethers.provider.getBalance(feeRecipient.address);
                
                await paymentSystem.connect(sender).singlePayment(
                    recipient.address,
                    NATIVE_TOKEN,
                    amount,
                    `测试支付-${ethers.formatEther(amount)}ETH`,
                    { value: amount }
                );
                
                const recipientBalanceAfter = await ethers.provider.getBalance(recipient.address);
                const feeRecipientBalanceAfter = await ethers.provider.getBalance(feeRecipient.address);
                
                expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(expectedNetAmount);
                expect(feeRecipientBalanceAfter - feeRecipientBalanceBefore).to.equal(expectedFee);
            }
        });
        
        it("当msg.value与amount不匹配时应该失败", async function () {
            const paymentAmount = ethers.parseEther("1.0");
            const wrongValue = ethers.parseEther("0.5");
            
            await expect(
                paymentSystem.connect(sender).singlePayment(
                    recipient.address,
                    NATIVE_TOKEN,
                    paymentAmount,
                    "错误的value测试",
                    { value: wrongValue }
                )
            ).to.be.revertedWith("Incorrect native token amount");
        });
    });
    
    describe("ERC20代币支付测试", function () {
        it("应该成功执行ERC20代币支付", async function () {
            const paymentAmount = ethers.parseEther("10.0");
            const expectedFee = paymentAmount * BigInt(PLATFORM_FEE) / BigInt(10000);
            const expectedNetAmount = paymentAmount - expectedFee;
            
            // 记录支付前余额
            const recipientBalanceBefore = await mockToken.balanceOf(recipient.address);
            const feeRecipientBalanceBefore = await mockToken.balanceOf(feeRecipient.address);
            
            // 执行支付
            const tx = await paymentSystem.connect(sender).singlePayment(
                recipient.address,
                await mockToken.getAddress(),
                paymentAmount,
                "ERC20测试支付"
            );
            
            // 验证余额变化
            const recipientBalanceAfter = await mockToken.balanceOf(recipient.address);
            const feeRecipientBalanceAfter = await mockToken.balanceOf(feeRecipient.address);
            
            expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(expectedNetAmount);
            expect(feeRecipientBalanceAfter - feeRecipientBalanceBefore).to.equal(expectedFee);
            
            // 验证事件触发
            await expect(tx)
                .to.emit(paymentSystem, "SinglePayment")
                .withArgs(
                    sender.address,
                    recipient.address,
                    await mockToken.getAddress(),
                    paymentAmount,
                    "ERC20测试支付",
                    await (await ethers.provider.getNetwork()).chainId
                );
        });
        
        it("当没有足够代币余额时应该失败", async function () {
            const paymentAmount = ethers.parseEther("2000.0"); // 超过mint的1000
            
            await expect(
                paymentSystem.connect(sender).singlePayment(
                    recipient.address,
                    await mockToken.getAddress(),
                    paymentAmount,
                    "余额不足测试"
                )
            ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
        });
        
        it("当没有足够授权时应该失败", async function () {
            // 撤销授权
            await mockToken.connect(sender).approve(await paymentSystem.getAddress(), 0);
            
            const paymentAmount = ethers.parseEther("1.0");
            
            await expect(
                paymentSystem.connect(sender).singlePayment(
                    recipient.address,
                    await mockToken.getAddress(),
                    paymentAmount,
                    "授权不足测试"
                )
            ).to.be.revertedWith("ERC20: insufficient allowance");
        });
    });
    
    describe("输入验证测试", function () {
        it("当收款地址为零地址时应该失败", async function () {
            const paymentAmount = ethers.parseEther("1.0");
            
            await expect(
                paymentSystem.connect(sender).singlePayment(
                    ethers.ZeroAddress,
                    NATIVE_TOKEN,
                    paymentAmount,
                    "零地址测试",
                    { value: paymentAmount }
                )
            ).to.be.revertedWith("Invalid address");
        });
        
        it("当支付金额为0时应该失败", async function () {
            await expect(
                paymentSystem.connect(sender).singlePayment(
                    recipient.address,
                    NATIVE_TOKEN,
                    0,
                    "零金额测试"
                )
            ).to.be.revertedWith("Amount must be greater than 0");
        });
    });
    
    describe("合约状态测试", function () {
        it("当合约暂停时支付应该失败", async function () {
            // 暂停合约
            await paymentSystem.connect(owner).pause();
            
            const paymentAmount = ethers.parseEther("1.0");
            
            await expect(
                paymentSystem.connect(sender).singlePayment(
                    recipient.address,
                    NATIVE_TOKEN,
                    paymentAmount,
                    "暂停状态测试",
                    { value: paymentAmount }
                )
            ).to.be.revertedWith("Pausable: paused");
        });
        
        it("恢复合约后支付应该正常工作", async function () {
            // 暂停后恢复合约
            await paymentSystem.connect(owner).pause();
            await paymentSystem.connect(owner).unpause();
            
            const paymentAmount = ethers.parseEther("1.0");
            
            // 应该正常执行
            await expect(
                paymentSystem.connect(sender).singlePayment(
                    recipient.address,
                    NATIVE_TOKEN,
                    paymentAmount,
                    "恢复后测试",
                    { value: paymentAmount }
                )
            ).to.not.be.reverted;
        });
    });
    
    describe("重入攻击保护测试", function () {
        let attackContract;
        
        beforeEach(async function () {
            // 部署攻击合约
            const ReentrancyAttacker = await ethers.getContractFactory("ReentrancyAttacker");
            attackContract = await ReentrancyAttacker.deploy(await paymentSystem.getAddress());
            await attackContract.waitForDeployment();
        });
        
        it("应该防止重入攻击", async function () {
            const attackAmount = ethers.parseEther("1.0");
            
            await expect(
                attackContract.connect(attacker).attack(recipient.address, { value: attackAmount })
            ).to.be.revertedWith("ReentrancyGuard: reentrant call");
        });
    });
    
    describe("Gas优化测试", function () {
        it("应该在合理的Gas限制内执行", async function () {
            const paymentAmount = ethers.parseEther("1.0");
            
            const tx = await paymentSystem.connect(sender).singlePayment(
                recipient.address,
                NATIVE_TOKEN,
                paymentAmount,
                "Gas测试",
                { value: paymentAmount }
            );
            
            const receipt = await tx.wait();
            
            // 检查Gas使用量是否合理（应该小于200,000）
            expect(receipt.gasUsed).to.be.lt(200000);
        });
    });
    
    describe("边界条件测试", function () {
        it("应该处理最小支付金额（1 wei）", async function () {
            const paymentAmount = BigInt(1);
            const expectedFee = paymentAmount * BigInt(PLATFORM_FEE) / BigInt(10000);
            const expectedNetAmount = paymentAmount - expectedFee;
            
            const recipientBalanceBefore = await ethers.provider.getBalance(recipient.address);
            
            await paymentSystem.connect(sender).singlePayment(
                recipient.address,
                NATIVE_TOKEN,
                paymentAmount,
                "最小金额测试",
                { value: paymentAmount }
            );
            
            const recipientBalanceAfter = await ethers.provider.getBalance(recipient.address);
            expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(expectedNetAmount);
        });
        
        it("应该处理大额支付", async function () {
            const paymentAmount = ethers.parseEther("1000.0");
            const expectedFee = paymentAmount * BigInt(PLATFORM_FEE) / BigInt(10000);
            const expectedNetAmount = paymentAmount - expectedFee;
            
            const recipientBalanceBefore = await ethers.provider.getBalance(recipient.address);
            const feeRecipientBalanceBefore = await ethers.provider.getBalance(feeRecipient.address);
            
            await paymentSystem.connect(sender).singlePayment(
                recipient.address,
                NATIVE_TOKEN,
                paymentAmount,
                "大额支付测试",
                { value: paymentAmount }
            );
            
            const recipientBalanceAfter = await ethers.provider.getBalance(recipient.address);
            const feeRecipientBalanceAfter = await ethers.provider.getBalance(feeRecipient.address);
            
            expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(expectedNetAmount);
            expect(feeRecipientBalanceAfter - feeRecipientBalanceBefore).to.equal(expectedFee);
        });
    });
    
    describe("事件参数验证", function () {
        it("应该触发包含正确参数的SinglePayment事件", async function () {
            const paymentAmount = ethers.parseEther("1.5");
            const label = "详细事件测试";
            
            const tx = await paymentSystem.connect(sender).singlePayment(
                recipient.address,
                NATIVE_TOKEN,
                paymentAmount,
                label,
                { value: paymentAmount }
            );
            
            // 验证事件的所有参数
            await expect(tx)
                .to.emit(paymentSystem, "SinglePayment")
                .withArgs(
                    sender.address,
                    recipient.address,
                    NATIVE_TOKEN,
                    paymentAmount,
                    label,
                    await (await ethers.provider.getNetwork()).chainId
                );
        });
    });
}); 