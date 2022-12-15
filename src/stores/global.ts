import create from "zustand";
import type { WalletConnection } from "near-api-js";

import { NetworkConfig } from "types";

type Global = {
  wallet: WalletConnection | null;
  network: NetworkConfig | null;
  accountId: string;
};

type GlobalStore = {
  global: Global;
  updateGlobal: (global: Global) => void;
};

export const useGlobalStore = create(
  (set: any): GlobalStore => ({
    global: {
      accountId: "",
      wallet: null,
      network: null,
    },
    updateGlobal: (global: Global) => {
      set({ global });
    },
  })
);
