import { Alchemy, Network, Utils } from 'alchemy-sdk';
import { BrowserProvider, ethers } from 'ethers';
import { debounce } from 'lodash';
import List from 'react-virtualized/dist/commonjs/List';
import 'react-virtualized/styles.css';
import pLimit from 'p-limit';
import { useState } from 'react';
import './App.css';

const CACHE_EXPIRY_MS = 2 * 60 * 60 * 1000; // 1 day in milliseconds
// Helper functions for localStorage-based cache
function getCachedTokenMetadata(contractAddress) {
  const cacheEntry = JSON.parse(localStorage.getItem(`tokenMetadata_${contractAddress}`));
  if (!cacheEntry) return null;

  const { metadata, timestamp } = cacheEntry;
  if (Date.now() - timestamp > CACHE_EXPIRY_MS) {
    // If the cached entry is expired, remove it
    localStorage.removeItem(`tokenMetadata_${contractAddress}`);
    return null;
  }

  return metadata;
}

function cacheTokenMetadata(contractAddress, metadata) {
  const cacheEntry = {
    metadata,
    timestamp: Date.now(),
  };
  localStorage.setItem(`tokenMetadata_${contractAddress}`, JSON.stringify(cacheEntry));
}

const config = {
  apiKey: 'yHDa2R9iH9MBWIMUHUNH593wsGPrifZn',
  network: Network.ETH_MAINNET,
};

const alchemy = new Alchemy(config);



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

  function formatTokenBalance(balance, maxIntegerDigits = 3, maxDecimalDigits = 3) {
    //console.log(balance);

    // Split into integer and decimal parts
    const [integer, decimal] = balance.split('.');

    // Truncate integer part if too long
    const truncatedInteger = integer.length > maxIntegerDigits
      ? integer.slice(0, maxIntegerDigits) + '...'
      : integer;

    // Handle decimal part
    const formattedDecimal = decimal
      ? '.' + decimal.slice(0, maxDecimalDigits)
      : '';

    return truncatedInteger + formattedDecimal;
  }

  async function getTokenBalance(address) {    
    setLoading(true);
    //setHasQueried(false);
    try {
      console.log('address, used in getTokenBalance is: ', address);

      const data = await alchemy.core.getTokenBalances(address);
      console.log(`The balances of ${address} address are:`, data);

           
      //console.log('cache is: ', tokenMetadataCache);

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
          console.log('Metadata fetched from cache:', cachedMetadata);
          return cachedMetadata;
        }
        // If not cached, fetch metadata and store in cache
        console.log('Fetching metadata for address:', contractAddress);
        const metadata = await limit(() => alchemy.core.getTokenMetadata(contractAddress));
        //console.log(metadata);

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

  //console.log('address is: ', userAddress);
  //console.log('hasQueried: ', hasQueried);
  //console.log('results are: ', results.tokenBalances?.length);

  //console.log('tokenDataObjects are: ', tokenDataObjects[0]?.decimals);
  
  const handleInputChange = debounce((value) => setUserAddress(value), 300);

  const rowRenderer = ({ index, key, style }) => {
    const token = results.tokenBalances[index];
    const tokenData = tokenDataObjects[index];

    return (
      <div key={key} style={style} className="token-card">
        <div className="token-info">
          <b>Symbol:</b> {tokenData?.symbol || 'N/A'}
        </div>
        <div className="token-info">
          <b>Balance:</b>{' '}
          <span
            title={Utils.formatUnits(
              token?.tokenBalance || '0',
              tokenData?.decimals || 0
            )}
          >
            {formatTokenBalance(
              Utils.formatUnits(
                token?.tokenBalance || '0'
              )
            )}
           
          </span>
        </div>
        {tokenData?.logo && (
          <img
            src={tokenData.logo}
            alt={`${tokenData.symbol} logo`}
            className="token-logo"
          />
        )}
      </div>
    );
  };

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
          <List
          width={800} 
          height={600} 
          rowHeight={150} 
          rowCount={results.tokenBalances.length} 
          rowRenderer={rowRenderer} // Function to render each row
          className="token-list"
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