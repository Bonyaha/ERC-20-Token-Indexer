import { Alchemy, Network, Utils } from 'alchemy-sdk';
import { BrowserProvider, ethers } from 'ethers';
import { useState } from 'react';
import './App.css';

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

  async function getQueryBalance(){    
    const isAddress = ethers.isAddress(userAddress);
    const isENS = await alchemy.core.resolveName(userAddress);
    if (!isAddress && isENS == null){
      alert("Please type a valid address!");
    } else {
      await getTokenBalance(userAddress);
    }
  }

  async function getTokenBalance(address) {    
    /* Without changing hasQueried, I got an error: TypeError: can't access property "symbol", tokenDataObjects[i] is undefined
    results and tokenDataObjects are different at the moment of rendering (see logs below).
    There’s a small time window between when setResults(data) is called and when setTokenDataObjects finishes updating.
    If hasQueried remains true, the token-grid renders immediately after setResults, but before setTokenDataObjects completes.
    This results in undefined values for tokenDataObjects[i].
    It works because it tells React not to render the token-grid.
    Once setTokenDataObjects finishes, you call setHasQueried(true) to re-render the token-grid with the correct data.*/
  setHasQueried(false);

    console.log('address, used in getTokenBalance is: ', address);    
    
    const data = await alchemy.core.getTokenBalances(address);
    console.log(`The balances of ${address} address are:`, data);

    setResults(data);

    const tokenDataPromises = [];

    for (let i = 0; i < data.tokenBalances.length; i++) {
      const tokenData = alchemy.core.getTokenMetadata(
        data.tokenBalances[i].contractAddress
      );
      tokenDataPromises.push(tokenData);
    }
    
    setTokenDataObjects(await Promise.all(tokenDataPromises));
    setHasQueried(true);
    console.log('tokenDataObjects in getTokenBalance are: ', tokenDataObjects);
    
  }

//console.log('address is: ', userAddress);
//console.log('hasQueried: ', hasQueried);
console.log('results are: ', results.tokenBalances?.length);

console.log('tokenDataObjects are: ', tokenDataObjects.length);


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
          <button onClick={()=>getTokenBalance(walletAddress)} className="check-button">
          Click to see your ERC-20 Token Balances
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
          onChange={(e) => setUserAddress(e.target.value)}
          className="address-input"
          placeholder="Enter address..."
        />
        <button onClick={getQueryBalance} className="check-button">
          Check ERC-20 Token Balances
        </button>
      </div>

      <h2 className="balance-title">ERC-20 token balances:</h2>

      {hasQueried ? (
          <div className="token-grid">
          {results.tokenBalances.map((e, i) => (
            <div key={`${e.contractAddress}-${i}`} className="token-card">
              <div className="token-info">
                <b>Symbol:</b> ${tokenDataObjects[i].symbol}
              </div>
              <div className="token-info">
                <b>Balance:</b>{' '}
                {Utils.formatUnits(
                  e.tokenBalance,
                  tokenDataObjects[i].decimals
                )}
              </div>
              {tokenDataObjects[i].logo && (
                <img 
                  src={tokenDataObjects[i].logo} 
                  alt={`${tokenDataObjects[i].symbol} logo`}
                  className="token-logo" 
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="loading-text">
          Please make a query! This may take a few seconds...
        </p>
      )}
    </div>
  );
}

export default App;