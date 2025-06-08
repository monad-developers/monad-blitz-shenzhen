const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MonadPaymentSystem - singlePayment Function Tests", function () {
    let paymentSystem;
    let mockToken;
    let owner;
    let feeRecipient;
    let sender;
    let recipient;
    
    const PLATFORM_FEE = 100; // 1% (100/10000)
    const NATIVE_TOKEN = ethers.ZeroAddress;
    
    beforeEach(async function () {
        // Get test accounts
        [owner, feeRecipient, sender, recipient] = await ethers.getSigners();
        
        // Deploy payment system contract
        const MonadPaymentSystem = await ethers.getContractFactory("MonadPaymentSystem");
        paymentSystem = await MonadPaymentSystem.deploy(feeRecipient.address);
        await paymentSystem.waitForDeployment();
        
        // Deploy mock ERC20 token for testing
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        mockToken = await MockERC20.deploy("Test Token", "TEST", 18);
        await mockToken.waitForDeployment();
        
        // Give sender some test tokens
        await mockToken.mint(sender.address, ethers.parseEther("1000"));
        
        // Approve payment system to use sender's tokens
        await mockToken.connect(sender).approve(await paymentSystem.getAddress(), ethers.parseEther("1000"));
    });
    
    describe("Native Token Payment Tests", function () {
        it("Should successfully execute native token payment", async function () {
            const paymentAmount = ethers.parseEther("1.0");
            const expectedFee = paymentAmount * BigInt(PLATFORM_FEE) / BigInt(10000);
            const expectedNetAmount = paymentAmount - expectedFee;
            
            // Record balances before payment
            const recipientBalanceBefore = await ethers.provider.getBalance(recipient.address);
            const feeRecipientBalanceBefore = await ethers.provider.getBalance(feeRecipient.address);
            
            // Execute payment
            const tx = await paymentSystem.connect(sender).singlePayment(
                recipient.address,
                NATIVE_TOKEN,
                paymentAmount,
                "test payment",
                { value: paymentAmount }
            );
            
            // Verify balance changes
            const recipientBalanceAfter = await ethers.provider.getBalance(recipient.address);
            const feeRecipientBalanceAfter = await ethers.provider.getBalance(feeRecipient.address);
            
            expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(expectedNetAmount);
            expect(feeRecipientBalanceAfter - feeRecipientBalanceBefore).to.equal(expectedFee);
            
            // Verify event emission
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
        
        it("Should correctly calculate fees for different amounts", async function () {
            const testAmounts = [
                ethers.parseEther("0.1"),   // 0.1 ETH
                ethers.parseEther("1.0"),   // 1.0 ETH
                ethers.parseEther("10.0"),  // 10.0 ETH
            ];
            
            for (const amount of testAmounts) {
                const expectedFee = amount * BigInt(PLATFORM_FEE) / BigInt(10000);
                const expectedNetAmount = amount - expectedFee;
                
                const recipientBalanceBefore = await ethers.provider.getBalance(recipient.address);
                const feeRecipientBalanceBefore = await ethers.provider.getBalance(feeRecipient.address);
                
                await paymentSystem.connect(sender).singlePayment(
                    recipient.address,
                    NATIVE_TOKEN,
                    amount,
                    "fee test",
                    { value: amount }
                );
                
                const recipientBalanceAfter = await ethers.provider.getBalance(recipient.address);
                const feeRecipientBalanceAfter = await ethers.provider.getBalance(feeRecipient.address);
                
                expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(expectedNetAmount);
                expect(feeRecipientBalanceAfter - feeRecipientBalanceBefore).to.equal(expectedFee);
            }
        });
        
        it("Should fail when msg.value doesn't match amount", async function () {
            const paymentAmount = ethers.parseEther("1.0");
            const wrongValue = ethers.parseEther("0.5");
            
            await expect(
                paymentSystem.connect(sender).singlePayment(
                    recipient.address,
                    NATIVE_TOKEN,
                    paymentAmount,
                    "wrong value test",
                    { value: wrongValue }
                )
            ).to.be.revertedWith("Incorrect native token amount");
        });
    });
    
    describe("ERC20 Token Payment Tests", function () {
        it("Should successfully execute ERC20 token payment", async function () {
            const paymentAmount = ethers.parseEther("10.0");
            const expectedFee = paymentAmount * BigInt(PLATFORM_FEE) / BigInt(10000);
            const expectedNetAmount = paymentAmount - expectedFee;
            
            // Record balances before payment
            const recipientBalanceBefore = await mockToken.balanceOf(recipient.address);
            const feeRecipientBalanceBefore = await mockToken.balanceOf(feeRecipient.address);
            
            // Execute payment
            const tx = await paymentSystem.connect(sender).singlePayment(
                recipient.address,
                await mockToken.getAddress(),
                paymentAmount,
                "ERC20 test payment"
            );
            
            // Verify balance changes
            const recipientBalanceAfter = await mockToken.balanceOf(recipient.address);
            const feeRecipientBalanceAfter = await mockToken.balanceOf(feeRecipient.address);
            
            expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(expectedNetAmount);
            expect(feeRecipientBalanceAfter - feeRecipientBalanceBefore).to.equal(expectedFee);
            
            // Verify event emission
            await expect(tx)
                .to.emit(paymentSystem, "SinglePayment")
                .withArgs(
                    sender.address,
                    recipient.address,
                    await mockToken.getAddress(),
                    paymentAmount,
                    "ERC20 test payment",
                    await (await ethers.provider.getNetwork()).chainId
                );
        });
        
        it("Should fail when insufficient token balance", async function () {
            // First approve more than balance to test balance check
            await mockToken.connect(sender).approve(await paymentSystem.getAddress(), ethers.parseEther("3000"));
            
            const paymentAmount = ethers.parseEther("2000.0"); // More than minted 1000
            
            await expect(
                paymentSystem.connect(sender).singlePayment(
                    recipient.address,
                    await mockToken.getAddress(),
                    paymentAmount,
                    "insufficient balance test"
                )
            ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
        });
        
        it("Should fail when insufficient allowance", async function () {
            // Revoke approval
            await mockToken.connect(sender).approve(await paymentSystem.getAddress(), 0);
            
            const paymentAmount = ethers.parseEther("1.0");
            
            await expect(
                paymentSystem.connect(sender).singlePayment(
                    recipient.address,
                    await mockToken.getAddress(),
                    paymentAmount,
                    "insufficient allowance test"
                )
            ).to.be.revertedWith("ERC20: insufficient allowance");
        });
    });
    
    describe("Input Validation Tests", function () {
        it("Should fail when recipient address is zero", async function () {
            const paymentAmount = ethers.parseEther("1.0");
            
            await expect(
                paymentSystem.connect(sender).singlePayment(
                    ethers.ZeroAddress,
                    NATIVE_TOKEN,
                    paymentAmount,
                    "zero address test",
                    { value: paymentAmount }
                )
            ).to.be.revertedWith("Invalid address");
        });
        
        it("Should fail when payment amount is zero", async function () {
            await expect(
                paymentSystem.connect(sender).singlePayment(
                    recipient.address,
                    NATIVE_TOKEN,
                    0,
                    "zero amount test"
                )
            ).to.be.revertedWith("Amount must be greater than 0");
        });
    });
    
    describe("Contract State Tests", function () {
        it("Should fail when contract is paused", async function () {
            // Pause contract
            await paymentSystem.connect(owner).pause();
            
            const paymentAmount = ethers.parseEther("1.0");
            
            await expect(
                paymentSystem.connect(sender).singlePayment(
                    recipient.address,
                    NATIVE_TOKEN,
                    paymentAmount,
                    "paused contract test",
                    { value: paymentAmount }
                )
            ).to.be.revertedWith("Pausable: paused");
        });
        
        it("Should work after contract is unpaused", async function () {
            // Pause and unpause contract
            await paymentSystem.connect(owner).pause();
            await paymentSystem.connect(owner).unpause();
            
            const paymentAmount = ethers.parseEther("1.0");
            
            // Should work normally
            await expect(
                paymentSystem.connect(sender).singlePayment(
                    recipient.address,
                    NATIVE_TOKEN,
                    paymentAmount,
                    "unpause test",
                    { value: paymentAmount }
                )
            ).to.not.be.reverted;
        });
    });
    
    describe("Gas Optimization Tests", function () {
        it("Should execute within reasonable gas limits", async function () {
            const paymentAmount = ethers.parseEther("1.0");
            
            const tx = await paymentSystem.connect(sender).singlePayment(
                recipient.address,
                NATIVE_TOKEN,
                paymentAmount,
                "gas test",
                { value: paymentAmount }
            );
            
            const receipt = await tx.wait();
            
            // Check gas usage is reasonable (should be less than 200,000)
            expect(receipt.gasUsed).to.be.lt(200000);
        });
    });
    
    describe("Edge Case Tests", function () {
        it("Should handle minimum payment amount (1 wei)", async function () {
            const paymentAmount = BigInt(1);
            const expectedFee = paymentAmount * BigInt(PLATFORM_FEE) / BigInt(10000);
            const expectedNetAmount = paymentAmount - expectedFee;
            
            const recipientBalanceBefore = await ethers.provider.getBalance(recipient.address);
            
            await paymentSystem.connect(sender).singlePayment(
                recipient.address,
                NATIVE_TOKEN,
                paymentAmount,
                "minimum amount test",
                { value: paymentAmount }
            );
            
            const recipientBalanceAfter = await ethers.provider.getBalance(recipient.address);
            expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(expectedNetAmount);
        });
        
        it("Should handle large payments", async function () {
            const paymentAmount = ethers.parseEther("100.0");
            const expectedFee = paymentAmount * BigInt(PLATFORM_FEE) / BigInt(10000);
            const expectedNetAmount = paymentAmount - expectedFee;
            
            const recipientBalanceBefore = await ethers.provider.getBalance(recipient.address);
            const feeRecipientBalanceBefore = await ethers.provider.getBalance(feeRecipient.address);
            
            await paymentSystem.connect(sender).singlePayment(
                recipient.address,
                NATIVE_TOKEN,
                paymentAmount,
                "large payment test",
                { value: paymentAmount }
            );
            
            const recipientBalanceAfter = await ethers.provider.getBalance(recipient.address);
            const feeRecipientBalanceAfter = await ethers.provider.getBalance(feeRecipient.address);
            
            expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(expectedNetAmount);
            expect(feeRecipientBalanceAfter - feeRecipientBalanceBefore).to.equal(expectedFee);
        });
    });
    
    describe("Event Verification Tests", function () {
        it("Should emit SinglePayment event with correct parameters", async function () {
            const paymentAmount = ethers.parseEther("1.5");
            const label = "detailed event test";
            
            const tx = await paymentSystem.connect(sender).singlePayment(
                recipient.address,
                NATIVE_TOKEN,
                paymentAmount,
                label,
                { value: paymentAmount }
            );
            
            // Verify all event parameters
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