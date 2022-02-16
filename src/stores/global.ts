import create from 'zustand';
import type { Near, WalletConnection } from 'near-api-js';

import { RegistryContract, TokenContract } from 'types';

type Global = {
  near: Near | null;
  wallet: WalletConnection | null;
  registry: RegistryContract | null;
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
    near: null,
    wallet: null,
    registry: null,
    octToken: null
  },
  updateGlobal: (global: Global) => {
    set({ global });
  }
}));