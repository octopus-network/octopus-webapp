import React, { useCallback, useContext, useEffect, useState } from "react";
import { map, distinctUntilChanged } from "rxjs";
import { setupWalletSelector } from "@near-wallet-selector/core";
import type { WalletSelector, AccountState } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui";
import type { WalletSelectorModal } from "@near-wallet-selector/modal-ui";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import axios from "axios";
import { API_HOST } from "config";
import { Account, keyStores, Near, WalletConnection } from "near-api-js";
import {
  NetworkConfig,
  NetworkType,
  RegistryContract,
  TokenContract,
} from "types";
import { setupNearWallet } from "@near-wallet-selector/near-wallet";

declare global {
  interface Window {
    selector: WalletSelector;
    modal: WalletSelectorModal;
  }
}

interface WalletSelectorContextValue {
  selector: WalletSelector;
  modal: WalletSelectorModal;
  accounts: Array<AccountState>;
  accountId: string | undefined;
  near: Near | null;
  registry: RegistryContract | null;
  networkConfig: NetworkConfig | null;
  octToken: TokenContract | null;
  nearAccount: Account | undefined;
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
  const [near, setNear] = useState<Near | null>(null);
  const [registry, setRegistry] = useState<RegistryContract | null>(null);
  const [networkConfig, setNetworkConfig] = useState<NetworkConfig | null>(
    null
  );
  const [octToken, setOctToken] = useState<TokenContract | null>(null);
  const [nearAccount, setNearAccount] = useState<Account | undefined>(
    undefined
  );
  const [network, setNetwork] = useState<NetworkType>(NetworkType.MAINNET);

  const init = useCallback(async () => {
    const config = await axios
      .get(`${API_HOST}/network-config`)
      .then((res) => res.data);
    setNetworkConfig(config);

    setNetwork(config?.near.networkId ?? NetworkType.MAINNET);
    const _selector = await setupWalletSelector({
      network: config?.near.networkId,
      debug: false,
      modules: [
        setupNearWallet({
          deprecated: false,
        }),
        setupMyNearWallet(),
        // setupLedger({
        //   iconUrl: "/assets/ledger-icon.png",
        //   deprecated: false,
        // }),
        // setupSender({
        //   iconUrl: "/assets/sender-icon.png",
        // }),
        // setupWalletConnect({
        //   iconUrl: "/assets/wallet-connect-icon.png",
        //   projectId: "1799b9adf32c8cef373a6a41699fe8bf",
        //   metadata: {
        //     name: "Octopus Network",
        //     description: "",
        //     url: "https://mainnet.oct.network",
        //     icons: ["https://near-vesting.netlify.app/oct.png"],
        //   },
        // }),
      ],
    });
    const near = new Near({
      keyStore: new keyStores.BrowserLocalStorageKeyStore(),
      headers: {},
      ...config.near,
    });
    setNear(near);

    const wallet = new WalletConnection(
      near,
      config.octopus.registryContractId
    );

    const nearAccount = wallet.account();
    setNearAccount(nearAccount);
    const registry = new RegistryContract(
      nearAccount,
      config.octopus.registryContractId,
      {
        viewMethods: [
          "get_owner",
          "get_upvote_deposit_for",
          "get_downvote_deposit_for",
          "get_registry_settings",
          "get_protocol_settings",
        ],
        changeMethods: [
          "withdraw_upvote_deposit_of",
          "withdraw_downvote_deposit_of",
        ],
      }
    );
    setRegistry(registry);

    const octToken = new TokenContract(
      nearAccount,
      config.octopus.octTokenContractId,
      {
        viewMethods: ["ft_balance_of", "ft_total_supply"],
        changeMethods: ["ft_transfer_call"],
      }
    );
    setOctToken(octToken);

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
        console.log("Accounts Update", nextAccounts);

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
        registry,
        near,
        octToken,
        networkConfig,
        nearAccount,
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
