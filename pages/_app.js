import { useState, useEffect } from 'react';
import Head from 'next/head';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);

  useEffect(() => {
    // Initialize Web3 connection on component mount
    if (typeof window !== 'undefined' && window.ethereum) {
      initializeWeb3();
    }
  }, []);

  const initializeWeb3 = async () => {
    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Set up provider and get accounts
      const { ethers } = await import('ethers');
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const account = await signer.getAddress();
      
      setProvider(provider);
      setAccount(account);
      
      // Switch to Avalanche Fuji testnet if not already
      await switchToAvalanche();
      
    } catch (error) {
      console.error('Failed to initialize Web3:', error);
    }
  };

  const switchToAvalanche = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xA869' }], // Avalanche Fuji Testnet
      });
    } catch (switchError) {
      // Add the network if it doesn't exist
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xA869',
              chainName: 'Avalanche Fuji Testnet',
              nativeCurrency: {
                name: 'AVAX',
                symbol: 'AVAX',
                decimals: 18,
              },
              rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
              blockExplorerUrls: ['https://testnet.snowtrace.io/'],
            }],
          });
        } catch (addError) {
          console.error('Failed to add Avalanche network:', addError);
        }
      }
    }
  };

  return (
    <>
      <Head>
        <title>AI Data Marketplace</title>
        <meta name="description" content="Decentralized marketplace for AI training data" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="app">
        <header className="app-header">
          <div className="container">
            <div className="header-left">
              <h1>🤖 AI Data Marketplace</h1>
              {account && (
                <nav className="main-nav">
                  <a href="/">Home</a>
                  <a href="/marketplace">Marketplace</a>
                  <a href="/upload">Upload</a>
                  <a href="/dashboard">Dashboard</a>
                </nav>
              )}
            </div>
            <div className="wallet-info">
              {account ? (
                <div className="connected">
                  <span className="account">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </span>
                  <span className="network">Avalanche Fuji</span>
                </div>
              ) : (
                <button onClick={initializeWeb3} className="connect-btn">
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </header>
        
        <main className="main-content">
          <Component 
            {...pageProps} 
            account={account}
            provider={provider}
            contract={contract}
            initializeWeb3={initializeWeb3}
          />
        </main>
        
        <footer className="app-footer">
          <div className="container">
            <p>&copy; 2024 AI Data Marketplace - Privacy-First AI Training</p>
          </div>
        </footer>
      </div>
    </>
  );
}

export default MyApp;
