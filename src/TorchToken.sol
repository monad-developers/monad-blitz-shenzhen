// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "../lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "../lib/openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {IERC20} from "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IUniswap.sol";

contract TorchToken is ERC20, ERC20Burnable {
    bool private initialized;
    
    string private _tokenName;
    string private _tokenSymbol;
    string public tokenDesc;
    string public tokenLogoUrl;
    string public tgLink;
    string public webLink;
    string public xLink;
    
    
    address public swapPair;
    address public devAddress;
    address public routerAddress;
    IUniswapV2Router02 public router;
    uint256 public PRECISION = 1e18;
    uint256 public basePrice = 1e13;
    uint256 public slope = 1e7;

    constructor() ERC20("", "") {}

    function name() public view override returns (string memory) {
        return _tokenName;
    }

    function symbol() public view override returns (string memory) {
        return _tokenSymbol;
    }

    function initialize(
        string memory _name,
        string memory _symbol,
        string memory _desc,
        string memory _logoUrl,
        string memory _tgLink,
        string memory _webLink,
        string memory _xLink,
        address gameAsOwner,
        address _devAddress,
        address _routerAddress
    ) external{
        require(!initialized, "Already initialized");
        initialized = true;

        PRECISION = 1e18;
        basePrice = 1e13;
        slope = 1e7;
        _tokenName = _name;
        _tokenSymbol = _symbol;
        tokenDesc = _desc;
        tokenLogoUrl = _logoUrl;
        devAddress = _devAddress;
        tgLink = _tgLink;
        webLink = _webLink;
        xLink = _xLink;
        routerAddress = _routerAddress;
        router = IUniswapV2Router02(_routerAddress);
        swapPair = IUniswapV2Factory(router.factory()).createPair(
            address(this),
            router.WETH()
        );
        _initializeOwner(gameAsOwner);
    }

    function getTokenInfo() external view returns (
        string memory tokenName,
        string memory tokenSymbol,
        string memory description,
        string memory logoUrl,
        string memory _tgLink,
        string memory _webLink,
        string memory _xLink
    ) {
        return (
            _tokenName,
            _tokenSymbol,
            tokenDesc,
            tokenLogoUrl,
            tgLink,
            webLink,
            xLink
        );
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    function burnFrom(address account, uint256 amount) public override onlyOwner{
        require(amount > 0, "Amount must be greater than 0");
        super.burnFrom(account, amount);
    }

    function getCurrentPrice() public view returns (uint256) {
        return basePrice + (totalSupply() * slope / PRECISION);
    }

    function calculateTokenAmount(uint256 ethAmount) public view returns (uint256) {
        uint256 currentPrice = getCurrentPrice();
        return (ethAmount * PRECISION) / currentPrice;
    }
}
