import create from 'zustand';
import type { WalletConnection } from 'near-api-js';

import { 
  RegistryContract, 
  TokenContract, 
  NetworkConfig 
} from 'types';

type Global = {
  wallet: WalletConnection | null;
  registry: RegistryContract | null;
  network: NetworkConfig | null;
  octToken: TokenContract | null;
  accountId: string;
}

type GlobalStore = {
  global: Global;
  updateGlobal: (global: Global) => void;
}

export const useGlobalStore = create((set: any): GlobalStore => ({
  global: {
    accountId: '',
    wallet: null,
    registry: null,
    network: null,
    octToken: null
  },
  updateGlobal: (global: Global) => {
    set({ global });
  }
}));