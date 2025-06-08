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

// 医院接口
interface IHospitalCore {
    function admitPatient(
        string memory _name,
        uint256 _age,
        address _familyContact,
        string memory _initialRecord
    ) external returns (uint256);
}

// 养老院合约
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