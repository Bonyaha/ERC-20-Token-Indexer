import React, { useState } from "react";
import { Alchemy, Network, Utils } from "alchemy-sdk";
import "./App.css";

function App() {
  const [userAddress, setUserAddress] = useState("");
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);

  async function getTokenBalance() {
    const config = {
      apiKey: "yHDa2R9iH9MBWIMUHUNH593wsGPrifZn",
      network: Network.ETH_MAINNET,
    };

    const alchemy = new Alchemy(config);
    const data = await alchemy.core.getTokenBalances(userAddress);

    setResults(data);

    const tokenDataPromises = data.tokenBalances.map((balance) =>
      alchemy.core.getTokenMetadata(balance.contractAddress)
    );

    setTokenDataObjects(await Promise.all(tokenDataPromises));
    setHasQueried(true);
  }

  return (
    <div className="container">
      <header>
        <h1 className="heading">ERC-20 Token Indexer</h1>
        <p className="subheading">
          Plug in an address and this website will return all of its ERC-20
          token balances!
        </p>
      </header>
      <main>
        <div className="input-container">
          <h2>Get all the ERC-20 token balances of this address:</h2>
          <input
            type="text"
            className="input-field"
            placeholder="Enter wallet address"
            onChange={(e) => setUserAddress(e.target.value)}
          />
          <button className="button" onClick={getTokenBalance}>
            Check ERC-20 Token Balances
          </button>
        </div>

        <section>
          <h2>ERC-20 token balances:</h2>
          {hasQueried ? (
            <div className="results-grid">
              {results.tokenBalances.map((e, i) => (
                <div className="result-card" key={`${e.contractAddress}-${i}`}
>
                  <div>
                    <b>Symbol:</b> {tokenDataObjects[i]?.symbol || "N/A"}
                  </div>
                  <div>
                    <b>Balance:</b>{" "}
                    {Utils.formatUnits(
                      e.tokenBalance,
                      tokenDataObjects[i]?.decimals || 18
                    )}
                  </div>
                  {tokenDataObjects[i]?.logo && (
                    <img
                      src={tokenDataObjects[i].logo}
                      alt={tokenDataObjects[i].symbol}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="query-placeholder">
              Please make a query! This may take a few seconds...
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
