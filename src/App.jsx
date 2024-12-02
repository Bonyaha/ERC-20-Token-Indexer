import { BrowserProvider, ethers } from 'ethers';
import { debounce } from 'lodash';
import 'react-virtualized/styles.css';
import pLimit from 'p-limit';
import { useState } from 'react';
import './App.css';

import { alchemy,alchemyConfig } from './config';
import { 
  getCachedTokenMetadata, 
  cacheTokenMetadata,   
} from './utils';
import TokenList from './TokenList.jsx';

function App() {
  const [userAddress, setUserAddress] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);
  const [walletConnected, setWalletConnected] = useState(false);
  const [loading, setLoading] = useState(false);

    
  // Connect Wallet Function
  async function connectWallet() {
    if (typeof window.ethereum !== "undefined") {
      try {
        const provider = new BrowserProvider(window.ethereum);
        //await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);
        setWalletConnected(true);
        console.log("Wallet connected:", address);
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    } else {
      alert("MetaMask is not installed. Please install MetaMask and try again.");
    }
  }

  async function getQueryBalance() {
    const isAddress = ethers.isAddress(userAddress);
    const isENS = await alchemy.core.resolveName(userAddress);
    if (!isAddress && isENS == null) {
      alert("Please type a valid address!");
    } else {
      await getTokenBalance(userAddress);
    }
  }
  

  async function getTokenBalance(address) {
    setLoading(true);
    //setHasQueried(false);
    try {
      console.log('address, used in getTokenBalance is: ', address);

      const data = await alchemy.core.getTokenBalances(address);
      console.log(`The balances of ${address} address are:`, data);


      const nonZeroTokenBalances = data.tokenBalances.filter(
        token => token.tokenBalance !== '0x0000000000000000000000000000000000000000000000000000000000000000'
      );

      // Update the data object with filtered balances
      const filteredData = {
        ...data,
        tokenBalances: nonZeroTokenBalances
      };

      const limit = pLimit(10); // Adjust concurrency level
      const tokenDataPromises = filteredData.tokenBalances.map(async (token) => {
        const contractAddress = token.contractAddress;
        const cachedMetadata = getCachedTokenMetadata(contractAddress);
        if (cachedMetadata) {          
          return cachedMetadata;
        }
        // If not cached, fetch metadata and store in cache
        console.log('Fetching metadata for address:', contractAddress);
        const metadata = await limit(() => alchemy.core.getTokenMetadata(contractAddress));
        
        cacheTokenMetadata(contractAddress, metadata);

        return metadata;
      }
      );

      const tokenData = await Promise.all(tokenDataPromises);
      // Batch updates for React state variables
      setResults((prevResults) => {
        setTokenDataObjects(tokenData); // Update token metadata
        setHasQueried(true); // Re-enable token grid display
        return filteredData; // Update token balances
      });

    }
    catch (error) {
      console.error("Error fetching token balances:", error);
    } finally {
      setLoading(false); // End loading
    }

  }

  const handleInputChange = debounce((value) => setUserAddress(value), 300);

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">ERC-20 Token Indexer</h1>
        <p className="subtitle">
          Connect your wallet or enter an address to check all ERC-20 token
          balances associated with it!
        </p>
      </div>

      {/* Wallet Connection Section */}
      {!walletConnected && (
        <button onClick={connectWallet} className="connect-wallet-button">
          Connect Wallet
        </button>
      )}

      {walletConnected && (
        <div className="wallet-info">
          <p>Connected Wallet: {walletAddress}</p>
          <button
            onClick={() => getTokenBalance(walletAddress)}
            className="check-button"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Click to see your ERC-20 Token Balances'}
          </button>
        </div>
      )}

      {/* Input Section */}
      <div className="input-section">
        <h2 className="section-title">
          Get all the ERC-20 token balances of this address:
        </h2>
        <input
          id="inputAddress"
          type="text"
          onChange={(e) => handleInputChange(e.target.value)}
          className="address-input"
          placeholder="Enter address..."
          disabled={loading}
        />
        <button
          onClick={getQueryBalance}
          className="check-button"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Check ERC-20 Token Balances'}
        </button>
      </div>

      <h2 className="balance-title">ERC-20 token balances:</h2>

      {loading ? ( // Show loading indicator
        <div className="loading-text">
          <div className="loading-spinner"></div>
          Loading token balances, please wait...
        </div>
      ) : hasQueried ? (
        results.tokenBalances.length > 0 ? (
          <TokenList
            results={results}
            tokenDataObjects={tokenDataObjects}
          />
        )
          : (
            <p className="no-tokens-text">No tokens found for this address.</p>
          )
      ) : (
        <p className="loading-text">
          Please make a query! This may take a few seconds...
        </p>
      )}
    </div>
  );
}

export default App;