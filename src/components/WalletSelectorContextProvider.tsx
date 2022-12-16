import React, { useCallback, useContext, useEffect, useState } from "react";
import { map, distinctUntilChanged } from "rxjs";
import { setupWalletSelector } from "@near-wallet-selector/core";
import type { WalletSelector, AccountState } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui";
import type { WalletSelectorModal } from "@near-wallet-selector/modal-ui";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import axios from "axios";
import { API_HOST } from "config";
import { setupLedger } from "@near-wallet-selector/ledger";
import { setupOptoWallet } from "@near-wallet-selector/opto-wallet";
import { NetworkConfig, NetworkType } from "types";
import { setupNearWallet } from "@near-wallet-selector/near-wallet";
import posthog from "posthog-js";

declare global {
  interface Window {
    selector: WalletSelector;
    modal: WalletSelectorModal;
    google: any;
  }
}

interface WalletSelectorContextValue {
  selector: WalletSelector;
  modal: WalletSelectorModal;
  accounts: Array<AccountState>;
  accountId: string | undefined;
  networkConfig: NetworkConfig | null;
  network: NetworkType;
}

const WalletSelectorContext =
  React.createContext<WalletSelectorContextValue | null>(null);

export const WalletSelectorContextProvider = ({
  children,
}: {
  children: any;
}) => {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<WalletSelectorModal | null>(null);
  const [accounts, setAccounts] = useState<Array<AccountState>>([]);
  const [networkConfig, setNetworkConfig] = useState<NetworkConfig | null>(
    null
  );
  const [network, setNetwork] = useState<NetworkType>(NetworkType.MAINNET);

  const init = useCallback(async () => {
    const config = await axios
      .get(`${API_HOST}/network-config`)
      .then((res) => res.data);
    setNetworkConfig(config);

    setNetwork(config?.near.networkId ?? NetworkType.MAINNET);

    if (config?.near.networkId === NetworkType.MAINNET) {
      posthog.init("phc_CG8GjxmGGO5GXbBYuQ8THW0lR9szjTNp05ox5VLkX1z", {
        api_host: "https://app.posthog.com",
      });
    }
    const _selector = await setupWalletSelector({
      network: config?.near.networkId,
      debug: false,
      modules: [
        setupNearWallet({
          deprecated: false,
        }),
        setupMyNearWallet(),
        setupLedger(),
        setupOptoWallet(),
      ],
    });

    const _modal = setupModal(_selector, {
      contractId: config.octopus.registryContractId,
      methodNames: [
        "get_vesting",
        "create_linear_vesting",
        "create_cliff_vesting",
        "freeze_vesting",
        "unfreeze_vesting",
        "terminate_vesting",
        "change_beneficiary",
        "claim",
        "claim_all",
        "get_vesting_token_id",
      ],
    });
    const state = _selector.store.getState();

    setAccounts(state.accounts);

    window.selector = _selector;
    window.modal = _modal;

    setSelector(_selector);
    setModal(_modal);
  }, []);

  useEffect(() => {
    init().catch((err) => {
      console.error(err);
      alert("Failed to initialise wallet selector");
    });
  }, [init]);

  useEffect(() => {
    if (!selector) {
      return;
    }

    const subscription = selector.store.observable
      .pipe(
        map((state) => state.accounts),
        distinctUntilChanged()
      )
      .subscribe((nextAccounts) => {
        setAccounts(nextAccounts);
      });

    return () => subscription.unsubscribe();
  }, [selector]);

  if (!selector || !modal) {
    return null;
  }

  const accountId =
    accounts.find((account) => account.active)?.accountId || undefined;

  return (
    <WalletSelectorContext.Provider
      value={{
        selector,
        modal,
        accounts,
        accountId,
        networkConfig,
        network,
      }}
    >
      {children}
    </WalletSelectorContext.Provider>
  );
};

export function useWalletSelector() {
  const context = useContext(WalletSelectorContext);

  if (!context) {
    throw new Error(
      "useWalletSelector must be used within a WalletSelectorContextProvider"
    );
  }

  return context;
}
