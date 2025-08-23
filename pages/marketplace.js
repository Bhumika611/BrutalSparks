import { useState, useEffect } from 'react';
import DatasetCard from '../components/DatasetCard';
import FilterSidebar from '../components/FilterSidebar';
import ChatBot from '../components/ChatBot';
import TrainingSimulation from '../components/TrainingSimulation';

export default function Marketplace({ account, provider }) {
  const [datasets, setDatasets] = useState([]);
  const [filteredDatasets, setFilteredDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dataType: 'all',
    priceRange: [0, 10],
    sortBy: 'newest'
  });
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [showTraining, setShowTraining] = useState(false);
  const [purchasedDatasets, setPurchasedDatasets] = useState([]);

  useEffect(() => {
    if (provider) {
      loadDatasets();
      loadUserPurchases();
    }
  }, [provider]);

  useEffect(() => {
    applyFilters();
  }, [datasets, filters]);

  const loadDatasets = async () => {
    try {
      setLoading(true);
      
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x5fbdb2315678afecb367f032d93f642f64180aa3';
      if (!contractAddress) {
        console.log('Contract address not set');
        setLoading(false);
        return;
      }

      const { ethers } = await import('ethers');
      const contractABI = [
        "function getAllActiveDatasets() view returns (tuple(uint256 id, address owner, string ipfsCID, string name, string description, string dataType, uint256 priceInAVAX, uint256 fileSize, bool isActive, uint256 purchaseCount, uint256 createdAt)[])"
      ];
      
      const contract = new ethers.Contract(contractAddress, contractABI, provider);
      const datasetsData = await contract.getAllActiveDatasets();
      
      setDatasets(datasetsData);
      
    } catch (error) {
      console.error('Error loading datasets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPurchases = async () => {
    if (!account) return;
    
    try {
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x5fbdb2315678afecb367f032d93f642f64180aa3';
      console.log('Contract Address:', contractAddress);
      console.log('Environment variables:', {
        NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID
      });
      
      if (!contractAddress) {
        console.error('Contract address is undefined!');
        return;
      }
      
      const { ethers } = await import('ethers');
      const contractABI = [
        "function getUserPurchases(address _user) view returns (uint256[])"
      ];
      
      const contract = new ethers.Contract(contractAddress, contractABI, provider);
      const userPurchases = await contract.getUserPurchases(account);
      setPurchasedDatasets(userPurchases.map(id => id.toNumber()));
      
    } catch (error) {
      console.error('Error loading user purchases:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...datasets];
    
    // Filter by data type
    if (filters.dataType !== 'all') {
      filtered = filtered.filter(dataset => dataset.dataType === filters.dataType);
    }
    
    // Filter by price range
    filtered = filtered.filter(dataset => {
      const priceInAVAX = parseFloat(ethers.utils.formatEther(dataset.priceInAVAX));
      return priceInAVAX >= filters.priceRange[0] && priceInAVAX <= filters.priceRange[1];
    });
    
    // Sort datasets
    switch (filters.sortBy) {
      case 'newest':
        filtered.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'oldest':
        filtered.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case 'price-low':
        filtered.sort((a, b) => a.priceInAVAX - b.priceInAVAX);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.priceInAVAX - a.priceInAVAX);
        break;
      case 'popular':
        filtered.sort((a, b) => b.purchaseCount - a.purchaseCount);
        break;
    }
    
    setFilteredDatasets(filtered);
  };

  const handlePurchase = async (dataset) => {
    if (!account || !provider) {
      alert('Please connect your wallet first');
      return;
    }

    if (dataset.owner.toLowerCase() === account.toLowerCase()) {
      alert('You cannot purchase your own dataset');
      return;
    }

    setPurchasing(true);
    setSelectedDataset(dataset);

    try {
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x5fbdb2315678afecb367f032d93f642f64180aa3';
      const { ethers } = await import('ethers');
      const contractABI = [
        "function purchaseDataset(uint256 _datasetId) external payable returns (uint256)"
      ];

      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      console.log('Purchasing dataset:', dataset.id);
      const tx = await contract.purchaseDataset(dataset.id, {
        value: dataset.priceInAVAX
      });

      console.log('Transaction submitted:', tx.hash);
      const receipt = await tx.wait();
      console.log('Purchase confirmed:', receipt);

      // Show success and option to start training
      alert('Dataset purchased successfully!');
      await loadUserPurchases(); // Refresh user purchases
      setShowTraining(true);

    } catch (error) {
      console.error('Purchase error:', error);
      alert('Failed to purchase dataset: ' + error.message);
    } finally {
      setPurchasing(false);
    }
  };

  const handleStartTraining = (dataset) => {
    setSelectedDataset(dataset);
    setShowTraining(true);
  };

  const dataTypeOptions = [
    { value: 'all', label: 'All Types', icon: '📊' },
    { value: 'medical', label: 'Medical', icon: '🏥' },
    { value: 'financial', label: 'Financial', icon: '🏦' },
    { value: 'behavioral', label: 'Behavioral', icon: '🛍️' },
    { value: 'iot', label: 'IoT / Sensors', icon: '📡' },
    { value: 'research', label: 'Research', icon: '🔬' },
    { value: 'other', label: 'Other', icon: '📄' }
  ];

  return (
    <div className="marketplace-page">
      <div className="container">
        <div className="marketplace-header">
          <h1>🛒 AI Data Marketplace</h1>
          <p>Discover and purchase high-quality datasets for AI training</p>
          
          <div className="marketplace-stats">
            <div className="stat">
              <span className="stat-value">{datasets.length}</span>
              <span className="stat-label">Available Datasets</span>
            </div>
            <div className="stat">
              <span className="stat-value">{filteredDatasets.length}</span>
              <span className="stat-label">Filtered Results</span>
            </div>
            <div className="stat">
              <span className="stat-value">{purchasedDatasets.length}</span>
              <span className="stat-label">Your Purchases</span>
            </div>
          </div>
        </div>

        <div className="marketplace-content">
          {/* Filters Sidebar */}
          <div className="filters-sidebar">
            <h3>🔍 Filters</h3>
            
            <div className="filter-group">
              <label>Data Type</label>
              <select
                value={filters.dataType}
                onChange={(e) => setFilters({...filters, dataType: e.target.value})}
              >
                {dataTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Price Range (AVAX)</label>
              <div className="price-range">
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={filters.priceRange[1]}
                  onChange={(e) => setFilters({
                    ...filters, 
                    priceRange: [0, parseFloat(e.target.value)]
                  })}
                />
                <span>0 - {filters.priceRange[1]} AVAX</span>
              </div>
            </div>

            <div className="filter-group">
              <label>Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>

            {account && (
              <div className="user-section">
                <h4>Your Activity</h4>
                <p>{purchasedDatasets.length} datasets purchased</p>
                <button 
                  className="btn btn-secondary btn-small"
                  onClick={() => router.push('/dashboard')}
                >
                  View Dashboard
                </button>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="marketplace-main">
            {loading ? (
              <div className="loading-grid">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="dataset-card loading">
                    <div className="loading-placeholder"></div>
                  </div>
                ))}
              </div>
            ) : filteredDatasets.length > 0 ? (
              <div className="datasets-grid">
                {filteredDatasets.map((dataset) => (
                  <DatasetCard
                    key={dataset.id}
                    dataset={dataset}
                    onPurchase={handlePurchase}
                    onStartTraining={handleStartTraining}
                    isPurchased={purchasedDatasets.includes(dataset.id.toNumber())}
                    isOwner={account && dataset.owner.toLowerCase() === account.toLowerCase()}
                    purchasing={purchasing && selectedDataset?.id === dataset.id}
                  />
                ))}
              </div>
            ) : (
              <div className="no-results">
                <span className="no-results-icon">🔍</span>
                <h3>No datasets found</h3>
                <p>Try adjusting your filters or check back later for new datasets.</p>
              </div>
            )}
          </div>
        </div>

        {/* Purchase Modal */}
        {purchasing && selectedDataset && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>🛒 Purchasing Dataset</h3>
              </div>
              <div className="modal-body">
                <div className="purchase-details">
                  <h4>{selectedDataset.name}</h4>
                  <p>Price: {ethers.utils.formatEther(selectedDataset.priceInAVAX)} AVAX</p>
                  <div className="loading-animation">
                    <div className="spinner"></div>
                    <p>Please confirm the transaction in your wallet...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Training Simulation Modal */}
        {showTraining && selectedDataset && (
          <TrainingSimulation
            dataset={selectedDataset}
            onClose={() => setShowTraining(false)}
            account={account}
          />
        )}
      </div>

      <ChatBot account={account} />
    </div>
  );
}
