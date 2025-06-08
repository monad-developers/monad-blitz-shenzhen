// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Shortzy {
    struct ShortRecord {
        address token;
        uint256 tokenAmount;
        uint256 entryPrice;
        uint256 startTime;
        uint256 endTime;
        int256 pnl;
    }

    mapping(address => ShortRecord[]) public userShortHistory;
    mapping(address => mapping(address => bool)) public isShorting;
    mapping(address => uint256) public totalShortedAmount;
    mapping(address => int256) public totalUserPnL;
    address[] public shortingUsers;

    event MemeShorted(address indexed user, address indexed token, uint256 tokenAmount, uint256 entryPrice, uint256 timestamp);
    event MemeShortClosed(address indexed user, address indexed token, uint256 tokenAmount, int256 pnl, uint256 endTime);

    function short(address token, uint256 tokenAmount, uint256 entryPrice) external {
        require(token != address(0), "Invalid token");
        require(tokenAmount > 0, "Token amount must be > 0");
        require(entryPrice > 0, "Entry price must be > 0");

        if (!isShorting[msg.sender][token]) {
            shortingUsers.push(msg.sender);
        }

        isShorting[msg.sender][token] = true;
        totalShortedAmount[token] += tokenAmount;

        userShortHistory[msg.sender].push(ShortRecord({
            token: token,
            tokenAmount: tokenAmount,
            entryPrice: entryPrice,
            startTime: block.timestamp,
            endTime: 0,
            pnl: 0
        }));

        emit MemeShorted(msg.sender, token, tokenAmount, entryPrice, block.timestamp);
    }

    function closeShort(address token, int256 pnl) external {
        require(isShorting[msg.sender][token], "Not currently shorting");

        ShortRecord[] storage records = userShortHistory[msg.sender];
        for (uint256 i = records.length; i > 0; i--) {
            ShortRecord storage record = records[i - 1];
            if (record.token == token && record.endTime == 0) {
                record.endTime = block.timestamp;
                record.pnl = pnl;
                break;
            }
        }

        isShorting[msg.sender][token] = false;
        totalUserPnL[msg.sender] += pnl;

        emit MemeShortClosed(msg.sender, token, 0, pnl, block.timestamp);
    }

    function getUserShorts(address user) external view returns (ShortRecord[] memory) {
        return userShortHistory[user];
    }

    function getTokenTotalShorted(address token) external view returns (uint256) {
        return totalShortedAmount[token];
    }

    function getUserTotalPnL(address user) external view returns (int256) {
        return totalUserPnL[user];
    }

    function getShortingUsersCount() public view returns (uint256) {
        return shortingUsers.length;
    }
}
