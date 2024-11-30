import { Utils } from 'alchemy-sdk';

// Constant for cache expiry (2 hours)
export const CACHE_EXPIRY_MS = 2 * 60 * 60 * 1000;

/**
 * Retrieve cached token metadata from localStorage
 * @param {string} contractAddress - The contract address of the token
 * @returns {object|null} Cached metadata or null if not found/expired
 */
export function getCachedTokenMetadata(contractAddress) {
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

/**
 * Cache token metadata in localStorage
 * @param {string} contractAddress - The contract address of the token
 * @param {object} metadata - The metadata to be cached
 */
export function cacheTokenMetadata(contractAddress, metadata) {
  const cacheEntry = {
    metadata,
    timestamp: Date.now(),
  };
  localStorage.setItem(`tokenMetadata_${contractAddress}`, JSON.stringify(cacheEntry));
}

/**
 * Format token balance with truncation
 * @param {string} balance - The token balance to format
 * @param {number} maxIntegerDigits - Maximum integer digits to display
 * @param {number} maxDecimalDigits - Maximum decimal digits to display
 * @returns {string} Formatted balance
 */
export function formatTokenBalance(balance, maxIntegerDigits = 3, maxDecimalDigits = 3) {
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

/**
 * Filter tokens with non-zero balances
 * @param {object} data - Token balance data
 * @returns {object} Filtered token balance data
 */
export function filterNonZeroTokenBalances(data) {
  const nonZeroTokenBalances = data.tokenBalances.filter(
    token => token.tokenBalance !== '0x0000000000000000000000000000000000000000000000000000000000000000'
  );

  return {
    ...data,
    tokenBalances: nonZeroTokenBalances
  };
}