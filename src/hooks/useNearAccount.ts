import { useWalletSelector } from "components/WalletSelectorContextProvider";
import { keyStores, Near, WalletConnection } from "near-api-js";
import { useMemo } from "react";

export default function useNearAccount() {
  const { accountId, networkConfig } = useWalletSelector();

  const nearAccount = useMemo(() => {
    if (!accountId || !networkConfig) {
      return null;
    }
    const near = new Near({
      keyStore: new keyStores.BrowserLocalStorageKeyStore(),
      headers: {},
      ...networkConfig.near,
    });

    const wallet = new WalletConnection(
      near,
      networkConfig.octopus.registryContractId
    );

    return wallet.account();
  }, [accountId, networkConfig]);

  return nearAccount;
}
