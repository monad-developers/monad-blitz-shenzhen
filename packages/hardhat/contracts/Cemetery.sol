// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// 基础库
abstract contract Ownable {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        _transferOwnership(msg.sender);
    }

    modifier onlyOwner() {
        require(owner() == msg.sender, "Ownable: caller is not the owner");
        _;
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner);
    }

    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

// 计数器库
library Counters {
    struct Counter {
        uint256 _value;
    }

    function current(Counter storage counter) internal view returns (uint256) {
        return counter._value;
    }

    function increment(Counter storage counter) internal {
        unchecked {
            counter._value += 1;
        }
    }

    function decrement(Counter storage counter) internal {
        uint256 value = counter._value;
        require(value > 0, "Counter: decrement overflow");
        unchecked {
            counter._value = value - 1;
        }
    }
}

// 墓地合约
contract Cemetery is Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _plotIds;
    
    enum PlotStatus {
        AVAILABLE,  // 可用
        RESERVED,   // 已预订
        OCCUPIED    // 已占用
    }
    
    enum PlotType {
        STANDARD,   // 标准墓位
        PREMIUM,    // 高级墓位
        FAMILY      // 家族墓位
    }
    
    struct Plot {
        uint256 id;
        PlotType plotType;
        PlotStatus status;
        uint256 price;
        string location;
        address owner;
        string occupantName;
        uint256 burialDate;
        string epitaph;
    }
    
    struct BurialRecord {
        uint256 plotId;
        string deceasedName;
        address familyContact;
        uint256 burialDate;
        string ceremony;
    }
    
    mapping(uint256 => Plot) public plots;
    mapping(address => uint256[]) public familyPlots;
    mapping(string => BurialRecord) public burialRecords; // 按姓名索引
    
    address public funeralServiceContract;
    
    event PlotPurchased(uint256 indexed plotId, address buyer, string location);
    event BurialScheduled(string deceasedName, uint256 plotId, uint256 burialDate);
    event BurialCompleted(string deceasedName, uint256 plotId);
    
    constructor() {
        // 初始化一些墓位
        _initializePlots();
    }
    
    function _initializePlots() internal {
        // 创建标准墓位
        for (uint256 i = 1; i <= 50; i++) {
            _plotIds.increment();
            uint256 plotId = _plotIds.current();
            plots[plotId] = Plot({
                id: plotId,
                plotType: PlotType.STANDARD,
                status: PlotStatus.AVAILABLE,
                price: 1 ether,
                location: string(abi.encodePacked("Section A, Plot ", _toString(i))),
                owner: address(0),
                occupantName: "",
                burialDate: 0,
                epitaph: ""
            });
        }
        
        // 创建高级墓位
        for (uint256 i = 1; i <= 30; i++) {
            _plotIds.increment();
            uint256 plotId = _plotIds.current();
            plots[plotId] = Plot({
                id: plotId,
                plotType: PlotType.PREMIUM,
                status: PlotStatus.AVAILABLE,
                price: 3 ether,
                location: string(abi.encodePacked("Section B, Plot ", _toString(i))),
                owner: address(0),
                occupantName: "",
                burialDate: 0,
                epitaph: ""
            });
        }
        
        // 创建家族墓位
        for (uint256 i = 1; i <= 10; i++) {
            _plotIds.increment();
            uint256 plotId = _plotIds.current();
            plots[plotId] = Plot({
                id: plotId,
                plotType: PlotType.FAMILY,
                status: PlotStatus.AVAILABLE,
                price: 5 ether,
                location: string(abi.encodePacked("Section C, Plot ", _toString(i))),
                owner: address(0),
                occupantName: "",
                burialDate: 0,
                epitaph: ""
            });
        }
    }
    
    function _toString(uint256 value) internal pure returns (string memory) {
        // 简单的数字转字符串函数
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
    function setFuneralServiceContract(address _funeralService) external onlyOwner {
        funeralServiceContract = _funeralService;
    }
    
    // 购买墓位
    function purchasePlot(uint256 _plotId) external payable {
        require(_plotId <= _plotIds.current(), "Plot does not exist");
        Plot storage plot = plots[_plotId];
        require(plot.status == PlotStatus.AVAILABLE, "Plot not available");
        require(msg.value >= plot.price, "Insufficient payment");
        
        plot.status = PlotStatus.RESERVED;
        plot.owner = msg.sender;
        
        familyPlots[msg.sender].push(_plotId);
        
        // 退还多余的ETH
        if (msg.value > plot.price) {
            payable(msg.sender).transfer(msg.value - plot.price);
        }
        
        emit PlotPurchased(_plotId, msg.sender, plot.location);
    }
    
    // 准备安葬（由殡葬服务合约调用）
    function prepareBurial(
        string memory _deceasedName,
        address _familyContact,
        uint256 _burialDate
    ) external {
        require(msg.sender == funeralServiceContract, "Only funeral service can call");
        
        // 查找该家庭拥有的墓位
        uint256[] memory ownedPlots = familyPlots[_familyContact];
        require(ownedPlots.length > 0, "Family has no plots");
        
        // 找到一个已预订但未占用的墓位
        uint256 plotId = 0;
        for (uint256 i = 0; i < ownedPlots.length; i++) {
            if (plots[ownedPlots[i]].status == PlotStatus.RESERVED) {
                plotId = ownedPlots[i];
                break;
            }
        }
        
        require(plotId > 0, "No reserved plots available");
        
        Plot storage plot = plots[plotId];
        plot.occupantName = _deceasedName;
        plot.burialDate = _burialDate;
        plot.status = PlotStatus.OCCUPIED;
        
        // 记录安葬信息
        burialRecords[_deceasedName] = BurialRecord({
            plotId: plotId,
            deceasedName: _deceasedName,
            familyContact: _familyContact,
            burialDate: _burialDate,
            ceremony: "Standard"
        });
        
        emit BurialScheduled(_deceasedName, plotId, _burialDate);
    }
    
    // 设置墓志铭
    function setEpitaph(uint256 _plotId, string memory _epitaph) external {
        require(_plotId <= _plotIds.current(), "Plot does not exist");
        Plot storage plot = plots[_plotId];
        require(plot.owner == msg.sender, "Not the plot owner");
        require(plot.status == PlotStatus.OCCUPIED, "Plot not occupied");
        
        plot.epitaph = _epitaph;
    }
    
    // 获取墓位信息
    function getPlot(uint256 _plotId) external view returns (Plot memory) {
        require(_plotId <= _plotIds.current(), "Plot does not exist");
        return plots[_plotId];
    }
    
    // 提取资金
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }
}