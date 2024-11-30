import { Alchemy, Network } from 'alchemy-sdk';

const API_KEY = import.meta.env.VITE_REACT_APP_ALCHEMY_API_KEY
// Create a configuration object for Alchemy SDK
const config = {
  apiKey: API_KEY,
  network: Network.ETH_MAINNET,
};

// Create and export Alchemy instance
export const alchemy = new Alchemy(config);

// Export the configuration for potential future use
export const alchemyConfig = config;