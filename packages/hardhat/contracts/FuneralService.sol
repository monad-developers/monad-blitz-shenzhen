// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// ==================== 核心医院合约 ====================
contract HospitalCore is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _patientIds;
    
    // 患者状态枚举
    enum PatientStatus { 
        ADMITTED,           // 入院
        IN_TREATMENT,      // 治疗中
        CRITICAL,          // 危重
        STABLE,            // 稳定
        DISCHARGED,        // 出院
        DECEASED           // 去世
    }
    
    // 患者信息结构
    struct Patient {
        uint256 id;
        string name;
        uint256 age;
        address familyContact;
        PatientStatus status;
        uint256 admissionTime;
        uint256 lastUpdateTime;
        string medicalRecord;
        bool hasFuneralPlan;
    }
    
    // 存储结构
    mapping(uint256 => Patient) public patients;
    mapping(address => uint256[]) public familyPatients;
    
    // 关联的外部服务合约
    address public nursingHomeContract;
    address public funeralServiceContract;
    address public cemeteryContract;
    
    // 事件定义
    event PatientAdmitted(uint256 indexed patientId, string name, address familyContact);
    event PatientStatusUpdated(uint256 indexed patientId, PatientStatus newStatus);
    event PatientDeceased(uint256 indexed patientId, uint256 timestamp);
    event FuneralServiceTriggered(uint256 indexed patientId, address funeralContract);
    
    // 修饰符：仅限医护人员
    modifier onlyMedicalStaff() {
        require(medicalStaff[msg.sender], "Only medical staff can perform this action");
        _;
    }
    
    mapping(address => bool) public medicalStaff;
    
    constructor() {
        medicalStaff[msg.sender] = true;
    }
    
    // 添加医护人员
    function addMedicalStaff(address staff) external onlyOwner {
        medicalStaff[staff] = true;
    }
    
    // 设置外部服务合约地址
    function setExternalContracts(
        address _nursingHome,
        address _funeralService,
        address _cemetery
    ) external onlyOwner {
        nursingHomeContract = _nursingHome;
        funeralServiceContract = _funeralService;
        cemeteryContract = _cemetery;
    }
    
    // 患者入院登记
    function admitPatient(
        string memory _name,
        uint256 _age,
        address _familyContact,
        string memory _initialRecord
    ) external onlyMedicalStaff returns (uint256) {
        _patientIds.increment();
        uint256 newPatientId = _patientIds.current();
        
        patients[newPatientId] = Patient({
            id: newPatientId,
            name: _name,
            age: _age,
            familyContact: _familyContact,
            status: PatientStatus.ADMITTED,
            admissionTime: block.timestamp,
            lastUpdateTime: block.timestamp,
            medicalRecord: _initialRecord,
            hasFuneralPlan: false
        });
        
        familyPatients[_familyContact].push(newPatientId);
        
        emit PatientAdmitted(newPatientId, _name, _familyContact);
        return newPatientId;
    }
    
    // 更新患者状态
    function updatePatientStatus(
        uint256 _patientId,
        PatientStatus _newStatus,
        string memory _updateRecord
    ) external onlyMedicalStaff {
        require(_patientId <= _patientIds.current(), "Patient does not exist");
        
        Patient storage patient = patients[_patientId];
        patient.status = _newStatus;
        patient.lastUpdateTime = block.timestamp;
        patient.medicalRecord = string(abi.encodePacked(
            patient.medicalRecord, 
            " | ", 
            _updateRecord
        ));
        
        emit PatientStatusUpdated(_patientId, _newStatus);
        
        // 如果患者去世，自动触发殡葬服务
        if (_newStatus == PatientStatus.DECEASED) {
            _handlePatientDeceased(_patientId);
        }
    }
    
    // 处理患者去世情况
    function _handlePatientDeceased(uint256 _patientId) internal {
        Patient storage patient = patients[_patientId];
        
        emit PatientDeceased(_patientId, block.timestamp);
        
        // 自动联系殡葬服务
        if (funeralServiceContract != address(0)) {
            IFuneralService(funeralServiceContract).initiateFuneralProcess(
                _patientId,
                patient.name,
                patient.familyContact
            );
            emit FuneralServiceTriggered(_patientId, funeralServiceContract);
        }
    }
    
    // 获取患者信息
    function getPatient(uint256 _patientId) external view returns (Patient memory) {
        require(_patientId <= _patientIds.current(), "Patient does not exist");
        return patients[_patientId];
    }
    
    // 获取家属的所有患者
    function getFamilyPatients(address _family) external view returns (uint256[] memory) {
        return familyPatients[_family];
    }
    
    // 获取当前患者总数
    function getTotalPatients() external view returns (uint256) {
        return _patientIds.current();
    }
}

// ==================== 养老院合约 ====================
contract NursingHome is Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _residentIds;
    
    enum ResidentStatus {
        ACTIVE,      // 在院
        TRANSFERRED, // 转院
        DECEASED     // 去世
    }
    
    struct Resident {
        uint256 id;
        string name;
        uint256 age;
        address familyContact;
        ResidentStatus status;
        uint256 admissionDate;
        uint256 monthlyFee;
        string healthCondition;
    }
    
    mapping(uint256 => Resident) public residents;
    mapping(address => uint256[]) public familyResidents;
    
    address public hospitalContract;
    
    event ResidentAdmitted(uint256 indexed residentId, string name);
    event ResidentTransferred(uint256 indexed residentId, address hospital);
    event ResidentDeceased(uint256 indexed residentId);
    
    function setHospitalContract(address _hospital) external onlyOwner {
        hospitalContract = _hospital;
    }
    
    function admitResident(
        string memory _name,
        uint256 _age,
        address _familyContact,
        uint256 _monthlyFee,
        string memory _healthCondition
    ) external onlyOwner returns (uint256) {
        _residentIds.increment();
        uint256 newResidentId = _residentIds.current();
        
        residents[newResidentId] = Resident({
            id: newResidentId,
            name: _name,
            age: _age,
            familyContact: _familyContact,
            status: ResidentStatus.ACTIVE,
            admissionDate: block.timestamp,
            monthlyFee: _monthlyFee,
            healthCondition: _healthCondition
        });
        
        familyResidents[_familyContact].push(newResidentId);
        emit ResidentAdmitted(newResidentId, _name);
        return newResidentId;
    }
    
    // 转院到医院
    function transferToHospital(
        uint256 _residentId,
        string memory _reason
    ) external onlyOwner {
        require(_residentId <= _residentIds.current(), "Resident does not exist");
        Resident storage resident = residents[_residentId];
        require(resident.status == ResidentStatus.ACTIVE, "Resident not active");
        
        resident.status = ResidentStatus.TRANSFERRED;
        
        // 调用医院合约进行入院登记
        if (hospitalContract != address(0)) {
            IHospitalCore(hospitalContract).admitPatient(
                resident.name,
                resident.age,
                resident.familyContact,
                string(abi.encodePacked("Transferred from nursing home: ", _reason))
            );
        }
        
        emit ResidentTransferred(_residentId, hospitalContract);
    }
    
    function getResident(uint256 _residentId) external view returns (Resident memory) {
        return residents[_residentId];
    }
}

// ==================== 殡葬服务合约 ====================
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

// ==================== 墓地合约 ====================
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
                price: 2 ether,
                location: string(abi.encodePacked("A", _toString(i))),
                owner: address(0),
                occupantName: "",
                burialDate: 0,
                epitaph: ""
            });
        }
        
        // 创建高级墓位
        for (uint256 i = 1; i <= 20; i++) {
            _plotIds.increment();
            uint256 plotId = _plotIds.current();
            plots[plotId] = Plot({
                id: plotId,
                plotType: PlotType.PREMIUM,
                status: PlotStatus.AVAILABLE,
                price: 5 ether,
                location: string(abi.encodePacked("B", _toString(i))),
                owner: address(0),
                occupantName: "",
                burialDate: 0,
                epitaph: ""
            });
        }
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
        
        // 退还多余金额
        if (msg.value > plot.price) {
            payable(msg.sender).transfer(msg.value - plot.price);
        }
        
        emit PlotPurchased(_plotId, msg.sender, plot.location);
    }
    
    // 由殡葬服务合约调用，准备安葬
    function prepareBurial(
        string memory _deceasedName,
        address _familyContact,
        uint256 _burialDate
    ) external {
        require(msg.sender == funeralServiceContract, "Only funeral service can call");
        
        // 查找家属拥有的可用墓位
        uint256[] memory familyPlotIds = familyPlots[_familyContact];
        require(familyPlotIds.length > 0, "Family has no plots");
        
        uint256 availablePlotId = 0;
        for (uint256 i = 0; i < familyPlotIds.length; i++) {
            if (plots[familyPlotIds[i]].status == PlotStatus.RESERVED) {
                availablePlotId = familyPlotIds[i];
                break;
            }
        }
        
        require(availablePlotId > 0, "No available plot for burial");
        
        // 记录安葬信息
        burialRecords[_deceasedName] = BurialRecord({
            plotId: availablePlotId,
            deceasedName: _deceasedName,
            familyContact: _familyContact,
            burialDate: _burialDate,
            ceremony: "Standard burial ceremony"
        });
        
        emit BurialScheduled(_deceasedName, availablePlotId, _burialDate);
    }
    
    // 完成安葬
    function completeBurial(
        string memory _deceasedName,
        string memory _epitaph
    ) external onlyOwner {
        BurialRecord memory record = burialRecords[_deceasedName];
        require(record.plotId > 0, "No burial record found");
        
        Plot storage plot = plots[record.plotId];
        plot.status = PlotStatus.OCCUPIED;
        plot.occupantName = _deceasedName;
        plot.burialDate = block.timestamp;
        plot.epitaph = _epitaph;
        
        emit BurialCompleted(_deceasedName, record.plotId);
    }
    
    // 获取可用墓位
    function getAvailablePlots() external view returns (uint256[] memory) {
        uint256 availableCount = 0;
        
        // 首先计算可用墓位数量
        for (uint256 i = 1; i <= _plotIds.current(); i++) {
            if (plots[i].status == PlotStatus.AVAILABLE) {
                availableCount++;
            }
        }
        
        // 创建数组并填充
        uint256[] memory availablePlots = new uint256[](availableCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= _plotIds.current(); i++) {
            if (plots[i].status == PlotStatus.AVAILABLE) {
                availablePlots[index] = i;
                index++;
            }
        }
        
        return availablePlots;
    }
    
    function getPlot(uint256 _plotId) external view returns (Plot memory) {
        return plots[_plotId];
    }
    
    function getBurialRecord(string memory _deceasedName) external view returns (BurialRecord memory) {
        return burialRecords[_deceasedName];
    }
    
    // 提取收入
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }
    
    // 辅助函数：数字转字符串
    function _toString(uint256 value) internal pure returns (string memory) {
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
}

// ==================== 接口定义 ====================
interface IHospitalCore {
    function admitPatient(
        string memory _name,
        uint256 _age,
        address _familyContact,
        string memory _initialRecord
    ) external returns (uint256);
}

interface IFuneralService {
    function initiateFuneralProcess(
        uint256 _patientId,
        string memory _deceasedName,
        address _familyContact
    ) external returns (uint256);
}

interface ICemetery {
    function prepareBurial(
        string memory _deceasedName,
        address _familyContact,
        uint256 _burialDate
    ) external;
}