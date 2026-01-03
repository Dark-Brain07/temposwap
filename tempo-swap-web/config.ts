import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

export const tempoTestnet = defineChain({
  id: 42429,
  name: 'Tempo Testnet',
  network: 'tempo-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'USD',
    symbol: 'USD',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.tempo.xyz'],
    },
    public: {
      http: ['https://rpc.testnet.tempo.xyz'],
    },
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: 'Tempo SWAP',
  projectId: 'YOUR_PROJECT_ID', // User can replace this later if needed, creates a default one
  chains: [tempoTestnet],
  ssr: true, // If your dApp uses server side rendering (SSR)
});
