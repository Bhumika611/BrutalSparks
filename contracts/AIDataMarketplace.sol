// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AIDataMarketplace {
    
    struct Dataset {
        uint256 id;
        address owner;
        string ipfsCID;
        string name;
        string description;
        string dataType; // "medical", "financial", "behavioral", etc.
        uint256 priceInAVAX;
        uint256 fileSize;
        bool isActive;
        uint256 purchaseCount;
        uint256 createdAt;
    }
    
    struct Purchase {
        uint256 datasetId;
        address buyer;
        uint256 purchaseTime;
        string accessToken; // For secure access
    }
    
    // State variables
    uint256 public datasetCounter;
    uint256 public purchaseCounter;
    uint256 public platformFeePercent = 5; // 5% platform fee
    address public owner;
    
    // Mappings
    mapping(uint256 => Dataset) public datasets;
    mapping(uint256 => Purchase) public purchases;
    mapping(address => uint256[]) public userDatasets;
    mapping(address => uint256[]) public userPurchases;
    mapping(uint256 => mapping(address => bool)) public hasAccess;
    
    // Events
    event DatasetUploaded(
        uint256 indexed datasetId,
        address indexed owner,
        string ipfsCID,
        string name,
        uint256 priceInAVAX
    );
    
    event DatasetPurchased(
        uint256 indexed datasetId,
        address indexed buyer,
        uint256 purchaseId,
        uint256 priceInAVAX
    );
    
    event PaymentDistributed(
        uint256 indexed datasetId,
        address indexed datasetOwner,
        uint256 ownerAmount,
        uint256 platformFee
    );
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyDatasetOwner(uint256 _datasetId) {
        require(datasets[_datasetId].owner == msg.sender, "Not the dataset owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    // Upload dataset metadata to blockchain
    function uploadDataset(
        string memory _ipfsCID,
        string memory _name,
        string memory _description,
        string memory _dataType,
        uint256 _priceInAVAX,
        uint256 _fileSize
    ) external returns (uint256) {
        require(bytes(_ipfsCID).length > 0, "IPFS CID cannot be empty");
        require(bytes(_name).length > 0, "Dataset name cannot be empty");
        require(_priceInAVAX > 0, "Price must be greater than 0");
        
        datasetCounter++;
        uint256 newDatasetId = datasetCounter;
        
        datasets[newDatasetId] = Dataset({
            id: newDatasetId,
            owner: msg.sender,
            ipfsCID: _ipfsCID,
            name: _name,
            description: _description,
            dataType: _dataType,
            priceInAVAX: _priceInAVAX,
            fileSize: _fileSize,
            isActive: true,
            purchaseCount: 0,
            createdAt: block.timestamp
        });
        
        userDatasets[msg.sender].push(newDatasetId);
        
        emit DatasetUploaded(newDatasetId, msg.sender, _ipfsCID, _name, _priceInAVAX);
        
        return newDatasetId;
    }
    
    // Purchase dataset access
    function purchaseDataset(uint256 _datasetId) external payable returns (uint256) {
        require(_datasetId > 0 && _datasetId <= datasetCounter, "Invalid dataset ID");
        require(datasets[_datasetId].isActive, "Dataset is not active");
        require(msg.value >= datasets[_datasetId].priceInAVAX, "Insufficient AVAX sent");
        require(datasets[_datasetId].owner != msg.sender, "Cannot purchase your own dataset");
        require(!hasAccess[_datasetId][msg.sender], "Already purchased this dataset");
        
        Dataset storage dataset = datasets[_datasetId];
        
        // Calculate fees
        uint256 platformFee = (msg.value * platformFeePercent) / 100;
        uint256 ownerAmount = msg.value - platformFee;
        
        // Update dataset stats
        dataset.purchaseCount++;
        
        // Grant access
        hasAccess[_datasetId][msg.sender] = true;
        
        // Create purchase record
        purchaseCounter++;
        purchases[purchaseCounter] = Purchase({
            datasetId: _datasetId,
            buyer: msg.sender,
            purchaseTime: block.timestamp,
            accessToken: generateAccessToken(_datasetId, msg.sender)
        });
        
        userPurchases[msg.sender].push(purchaseCounter);
        
        // Transfer payments
        payable(dataset.owner).transfer(ownerAmount);
        payable(owner).transfer(platformFee);
        
        emit DatasetPurchased(_datasetId, msg.sender, purchaseCounter, msg.value);
        emit PaymentDistributed(_datasetId, dataset.owner, ownerAmount, platformFee);
        
        return purchaseCounter;
    }
    
    // Generate access token for secure dataset access
    function generateAccessToken(uint256 _datasetId, address _buyer) internal view returns (string memory) {
        return string(abi.encodePacked(
            "access_",
            toString(_datasetId),
            "_",
            toString(uint160(_buyer)),
            "_",
            toString(block.timestamp)
        ));
    }
    
    // Helper function to convert uint to string
    function toString(uint256 value) internal pure returns (string memory) {
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
    
    // Get dataset details
    function getDataset(uint256 _datasetId) external view returns (Dataset memory) {
        require(_datasetId > 0 && _datasetId <= datasetCounter, "Invalid dataset ID");
        return datasets[_datasetId];
    }
    
    // Get purchase details
    function getPurchase(uint256 _purchaseId) external view returns (Purchase memory) {
        require(_purchaseId > 0 && _purchaseId <= purchaseCounter, "Invalid purchase ID");
        return purchases[_purchaseId];
    }
    
    // Check if user has access to dataset
    function checkAccess(uint256 _datasetId, address _user) external view returns (bool) {
        return hasAccess[_datasetId][_user] || datasets[_datasetId].owner == _user;
    }
    
    // Get user's datasets
    function getUserDatasets(address _user) external view returns (uint256[] memory) {
        return userDatasets[_user];
    }
    
    // Get user's purchases
    function getUserPurchases(address _user) external view returns (uint256[] memory) {
        return userPurchases[_user];
    }
    
    // Get all active datasets (for marketplace display)
    function getAllActiveDatasets() external view returns (Dataset[] memory) {
        uint256 activeCount = 0;
        
        // Count active datasets
        for (uint256 i = 1; i <= datasetCounter; i++) {
            if (datasets[i].isActive) {
                activeCount++;
            }
        }
        
        // Create array of active datasets
        Dataset[] memory activeDatasets = new Dataset[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 1; i <= datasetCounter; i++) {
            if (datasets[i].isActive) {
                activeDatasets[currentIndex] = datasets[i];
                currentIndex++;
            }
        }
        
        return activeDatasets;
    }
    
    // Deactivate dataset (only owner)
    function deactivateDataset(uint256 _datasetId) external onlyDatasetOwner(_datasetId) {
        datasets[_datasetId].isActive = false;
    }
    
    // Update platform fee (only contract owner)
    function updatePlatformFee(uint256 _newFeePercent) external onlyOwner {
        require(_newFeePercent <= 20, "Platform fee cannot exceed 20%");
        platformFeePercent = _newFeePercent;
    }
    
    // Emergency withdraw (only contract owner)
    function emergencyWithdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    // Get contract stats
    function getContractStats() external view returns (
        uint256 totalDatasets,
        uint256 totalPurchases,
        uint256 totalActiveDatasets
    ) {
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= datasetCounter; i++) {
            if (datasets[i].isActive) {
                activeCount++;
            }
        }
        
        return (datasetCounter, purchaseCounter, activeCount);
    }
}
