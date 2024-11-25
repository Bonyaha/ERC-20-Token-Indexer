import { Alchemy, Network, Utils } from 'alchemy-sdk';
import { useState } from 'react';
import './App.css';

function App() {
  const [userAddress, setUserAddress] = useState('');
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);

  async function getTokenBalance() {
    const config = {
      apiKey: 'yHDa2R9iH9MBWIMUHUNH593wsGPrifZn',
      network: Network.ETH_MAINNET,
    };

    const alchemy = new Alchemy(config);
    const data = await alchemy.core.getTokenBalances(userAddress);
    console.log(`The balances of ${userAddress} address are:`, data);

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
  }

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">ERC-20 Token Indexer</h1>
        <p className="subtitle">
          Plug in an address and this website will return all of its ERC-20 token balances!
        </p>
      </div>

      <div className="input-section">
        <h2 className="section-title">
          Get all the ERC-20 token balances of this address:
        </h2>
        <input
          type="text"
          onChange={(e) => setUserAddress(e.target.value)}
          className="address-input"
          placeholder="Enter address..."
        />
        <button onClick={getTokenBalance} className="check-button">
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