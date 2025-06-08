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

// 殡葬服务接口
interface IFuneralService {
    function initiateFuneralProcess(
        uint256 _patientId,
        string memory _deceasedName,
        address _familyContact
    ) external returns (uint256);
}

// 核心医院合约
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

    // 支付治疗费用
    function payForTreatment(uint256 _patientId) external payable {
        require(_patientId <= _patientIds.current(), "Patient does not exist");
        // 这里可以添加更多的支付逻辑
    }

    // 提取资金
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }
}