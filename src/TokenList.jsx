import React from 'react';
import { Utils } from 'alchemy-sdk';
import List from 'react-virtualized/dist/commonjs/List';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import 'react-virtualized/styles.css';


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

const rowRenderer = ({ index, key, style, results, tokenDataObjects }) => {
  const token = results.tokenBalances[index];
  const tokenData = tokenDataObjects[index];

  return (
    <div
      key={key}
      style={{
        ...style,
        padding: '10px',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}
      className="token-card-list"
    >
      <div className="token-list-content">
        
        <div className="token-list-details">
          <div className="token-list-symbol">
            {tokenData?.symbol || 'Unknown Token'}
          </div>
          <div className="token-list-balance">
            <span className="balance-label">Balance:</span>
            <span
              className="balance-value"
              title={Utils.formatUnits(
                token?.tokenBalance || '0',
                tokenData?.decimals || 0
              )}
            >
              {formatTokenBalance(
                Utils.formatUnits(
                  token?.tokenBalance || '0',
                  tokenData?.decimals || 0
                )
              )}
            </span>
          </div>
          {tokenData?.name && (
            <div className="token-list-name">
              {tokenData.name}
            </div>
          )}
        </div>
        {tokenData?.logo && (
          <img
            src={tokenData.logo}
            alt={`${tokenData.symbol} logo`}
            className="token-list-logo"
          />
        )
        }
      </div>
    </div>
  );
};

function TokenList({ results, tokenDataObjects }) {
  return (
    <div className="token-list-container">
      <AutoSizer>
        {({ height, width }) => (
          <List
            width={width}
            height={height}
            rowHeight={120}
            rowCount={results.tokenBalances.length}
            rowRenderer={({ index, key, style }) =>
              rowRenderer({
                index,
                key,
                style,
                results,
                tokenDataObjects
              })
            }
            className="custom-token-list"
          />
        )}
      </AutoSizer>
    </div>
  );
}

export default TokenList;