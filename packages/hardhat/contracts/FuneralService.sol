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

// 防重入保护
abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
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

// 墓地接口
interface ICemetery {
    function prepareBurial(
        string memory _deceasedName,
        address _familyContact,
        uint256 _burialDate
    ) external;
}

// 殡葬服务合约
contract FuneralService is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _serviceIds;
    
    enum ServiceStatus {
        INITIATED,    // 已启动
        CONFIRMED,    // 已确认
        IN_PROGRESS, // 进行中
        COMPLETED    // 已完成
    }
    
    enum ServiceType {
        BASIC,       // 基础服务
        STANDARD,    // 标准服务
        PREMIUM      // 高端服务
    }
    
    struct FuneralOrder {
        uint256 id;
        uint256 patientId;
        string deceasedName;
        address familyContact;
        ServiceType serviceType;
        ServiceStatus status;
        uint256 totalCost;
        uint256 initiatedTime;
        uint256 serviceDate;
        string specialRequests;
        bool isPaid;
    }
    
    mapping(uint256 => FuneralOrder) public funeralOrders;
    mapping(ServiceType => uint256) public servicePrices;
    
    address public hospitalContract;
    address public cemeteryContract;
    
    event FuneralInitiated(uint256 indexed orderId, uint256 patientId, string deceasedName);
    event ServiceConfirmed(uint256 indexed orderId, ServiceType serviceType);
    event ServiceCompleted(uint256 indexed orderId);
    event PaymentReceived(uint256 indexed orderId, uint256 amount);
    
    constructor() {
        // 设置默认价格（以wei为单位）
        servicePrices[ServiceType.BASIC] = 5 ether;
        servicePrices[ServiceType.STANDARD] = 10 ether;
        servicePrices[ServiceType.PREMIUM] = 20 ether;
    }
    
    function setExternalContracts(address _hospital, address _cemetery) external onlyOwner {
        hospitalContract = _hospital;
        cemeteryContract = _cemetery;
    }
    
    function updateServicePrice(ServiceType _type, uint256 _price) external onlyOwner {
        servicePrices[_type] = _price;
    }
    
    // 由医院合约调用，启动殡葬流程
    function initiateFuneralProcess(
        uint256 _patientId,
        string memory _deceasedName,
        address _familyContact
    ) external returns (uint256) {
        require(msg.sender == hospitalContract, "Only hospital can initiate");
        
        _serviceIds.increment();
        uint256 newOrderId = _serviceIds.current();
        
        funeralOrders[newOrderId] = FuneralOrder({
            id: newOrderId,
            patientId: _patientId,
            deceasedName: _deceasedName,
            familyContact: _familyContact,
            serviceType: ServiceType.BASIC, // 默认基础服务
            status: ServiceStatus.INITIATED,
            totalCost: servicePrices[ServiceType.BASIC],
            initiatedTime: block.timestamp,
            serviceDate: 0,
            specialRequests: "",
            isPaid: false
        });
        
        emit FuneralInitiated(newOrderId, _patientId, _deceasedName);
        return newOrderId;
    }
    
    // 家属确认服务类型
    function confirmService(
        uint256 _orderId,
        ServiceType _serviceType,
        uint256 _serviceDate,
        string memory _specialRequests
    ) external payable {
        FuneralOrder storage order = funeralOrders[_orderId];
        require(msg.sender == order.familyContact, "Only family can confirm");
        require(order.status == ServiceStatus.INITIATED, "Invalid status");
        
        order.serviceType = _serviceType;
        order.totalCost = servicePrices[_serviceType];
        order.serviceDate = _serviceDate;
        order.specialRequests = _specialRequests;
        order.status = ServiceStatus.CONFIRMED;
        
        // 检查支付
        if (msg.value >= order.totalCost) {
            order.isPaid = true;
            emit PaymentReceived(_orderId, msg.value);
            
            // 退还多余金额
            if (msg.value > order.totalCost) {
                payable(msg.sender).transfer(msg.value - order.totalCost);
            }
        }
        
        emit ServiceConfirmed(_orderId, _serviceType);
    }
    
    // 开始服务
    function startService(uint256 _orderId) external onlyOwner {
        FuneralOrder storage order = funeralOrders[_orderId];
        require(order.status == ServiceStatus.CONFIRMED, "Service not confirmed");
        require(order.isPaid, "Payment not received");
        
        order.status = ServiceStatus.IN_PROGRESS;
    }
    
    // 完成服务
    function completeService(uint256 _orderId) external onlyOwner {
        FuneralOrder storage order = funeralOrders[_orderId];
        require(order.status == ServiceStatus.IN_PROGRESS, "Service not in progress");
        
        order.status = ServiceStatus.COMPLETED;
        
        // 通知墓地合约准备安葬
        if (cemeteryContract != address(0)) {
            ICemetery(cemeteryContract).prepareBurial(
                order.deceasedName,
                order.familyContact,
                order.serviceDate
            );
        }
        
        emit ServiceCompleted(_orderId);
    }
    
    function getFuneralOrder(uint256 _orderId) external view returns (FuneralOrder memory) {
        return funeralOrders[_orderId];
    }
    
    // 提取收入
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }
}