import { useState, useEffect } from 'react';
import Link from 'next/link';
import ChatBot from '../components/ChatBot';
import DatasetCard from '../components/DatasetCard';
import StatsCard from '../components/StatsCard';

export default function Home({ account, provider }) {
  const [datasets, setDatasets] = useState([]);
  const [stats, setStats] = useState({
    totalDatasets: 0,
    totalPurchases: 0,
    totalActiveDatasets: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (provider) {
      loadData();
    }
  }, [provider]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load contract (you'll need to set the contract address after deployment)
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x5fbdb2315678afecb367f032d93f642f64180aa3';
      if (!contractAddress) {
        console.log('Contract address not set. Deploy the contract first.');
        setLoading(false);
        return;
      }

      const { ethers } = await import('ethers');
      const contractABI = [
        // Add your contract ABI here after compilation
        "function getAllActiveDatasets() view returns (tuple(uint256 id, address owner, string ipfsCID, string name, string description, string dataType, uint256 priceInAVAX, uint256 fileSize, bool isActive, uint256 purchaseCount, uint256 createdAt)[])",
        "function getContractStats() view returns (uint256, uint256, uint256)"
      ];
      
      const contract = new ethers.Contract(contractAddress, contractABI, provider);
      
      // Load datasets and stats
      const [datasetsData, statsData] = await Promise.all([
        contract.getAllActiveDatasets(),
        contract.getContractStats()
      ]);
      
      setDatasets(datasetsData.slice(0, 6)); // Show only first 6 on homepage
      setStats({
        totalDatasets: statsData[0].toNumber(),
        totalPurchases: statsData[1].toNumber(),
        totalActiveDatasets: statsData[2].toNumber()
      });
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>Privacy-First AI Training Marketplace</h1>
            <p className="hero-subtitle">
              Upload encrypted datasets, enable federated learning, and earn AVAX 
              while preserving privacy. HIPAA & GDPR compliant.
            </p>
            
            <div className="hero-actions">
              <Link href="/upload" className="btn btn-primary">
                📤 Upload Dataset
              </Link>
              <Link href="/marketplace" className="btn btn-secondary">
                🛒 Browse Marketplace
              </Link>
            </div>
            
            <div className="hero-features">
              <div className="feature">
                <span className="feature-icon">🔒</span>
                <span>End-to-End Encryption</span>
              </div>
              <div className="feature">
                <span className="feature-icon">🤝</span>
                <span>Federated Learning</span>
              </div>
              <div className="feature">
                <span className="feature-icon">💰</span>
                <span>Automatic Payments</span>
              </div>
              <div className="feature">
                <span className="feature-icon">⚡</span>
                <span>Avalanche Network</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <StatsCard
              title="Total Datasets"
              value={stats.totalDatasets}
              icon="📊"
              loading={loading}
            />
            <StatsCard
              title="Total Purchases"
              value={stats.totalPurchases}
              icon="🛒"
              loading={loading}
            />
            <StatsCard
              title="Active Datasets"
              value={stats.totalActiveDatasets}
              icon="✅"
              loading={loading}
            />
            <StatsCard
              title="Success Rate"
              value="95%"
              icon="🎯"
              loading={false}
            />
          </div>
        </div>
      </section>

      {/* Featured Datasets */}
      <section className="featured-datasets">
        <div className="container">
          <div className="section-header">
            <h2>Featured Datasets</h2>
            <Link href="/marketplace" className="view-all-link">
              View All →
            </Link>
          </div>
          
          {loading ? (
            <div className="loading-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="dataset-card loading">
                  <div className="loading-placeholder"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="datasets-grid">
              {datasets.map((dataset) => (
                <DatasetCard 
                  key={dataset.id} 
                  dataset={dataset} 
                  showPreview={true}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2>How It Works</h2>
          <div className="steps-grid">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Upload Data</h3>
              <p>Upload your encrypted dataset to IPFS and register metadata on Avalanche</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>AI Training</h3>
              <p>AI developers purchase access and train models using federated learning</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Get Paid</h3>
              <p>Receive automatic AVAX payments when your data contributes to model training</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Track Results</h3>
              <p>Monitor training progress and model performance in real-time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="use-cases">
        <div className="container">
          <h2>Use Cases</h2>
          <div className="use-cases-grid">
            <div className="use-case">
              <span className="use-case-icon">🏥</span>
              <h3>Healthcare</h3>
              <p>Train medical AI models on encrypted patient data while maintaining HIPAA compliance</p>
            </div>
            <div className="use-case">
              <span className="use-case-icon">🏦</span>
              <h3>Finance</h3>
              <p>Develop fraud detection models using privacy-preserving financial transaction data</p>
            </div>
            <div className="use-case">
              <span className="use-case-icon">🛍️</span>
              <h3>Retail</h3>
              <p>Create recommendation systems from customer behavior data without exposing identities</p>
            </div>
            <div className="use-case">
              <span className="use-case-icon">🔬</span>
              <h3>Research</h3>
              <p>Collaborate on research datasets while preserving participant privacy</p>
            </div>
          </div>
        </div>
      </section>

      {/* Chatbot */}
      <ChatBot account={account} />
    </div>
  );
}
