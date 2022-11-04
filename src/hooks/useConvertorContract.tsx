import { useWalletSelector } from "components/WalletSelectorContextProvider";
import { Account, providers } from "near-api-js";
import { CodeResult } from "near-api-js/lib/providers/provider";
import { useEffect, useState } from "react";
import {
  ConversionPool,
  ConvertorContract,
  FungibleTokenMetadata,
} from "types";

export const useConvertorContract = (account: Account, contractId: string) => {
  const [contract, setContract] = useState<ConvertorContract | null>(null);

  useEffect(() => {
    if (contractId) {
      const _contract = new ConvertorContract(account, contractId, {
        viewMethods: ["get_whitelist", "get_pools", "get_storage_fee_gap_of"],
        changeMethods: [],
      });
      setContract(_contract);
    }
  }, [account, contractId]);

  return contract;
};

export const usePools = (
  contractId: string,
  from_index: number,
  limit: number
) => {
  const [pools, setPools] = useState<ConversionPool[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { selector } = useWalletSelector();
  useEffect(() => {
    async function fetchPools() {
      try {
        setIsLoading(true);
        const provider = new providers.JsonRpcProvider({
          url: selector.options.network.nodeUrl,
        });

        const res = await provider.query<CodeResult>({
          request_type: "call_function",
          account_id: contractId,
          method_name: "get_pools",
          args_base64: btoa(
            JSON.stringify({
              from_index,
              limit,
            })
          ),
          finality: "final",
        });
        const pools = JSON.parse(Buffer.from(res.result).toString());
        setPools(pools);
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
      }
    }
    fetchPools();
  }, [contractId, from_index, limit, selector.options.network.nodeUrl]);
  return { pools, isLoading };
};

export const useWhitelist = (contractId: string) => {
  const [whitelist, setWhitelist] = useState<FungibleTokenMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selector, near } = useWalletSelector();
  useEffect(() => {
    async function fetch() {
      if (!(contractId && near)) {
        return;
      }
      try {
        const provider = new providers.JsonRpcProvider({
          url: selector.options.network.nodeUrl,
        });

        const res = await provider.query<CodeResult>({
          request_type: "call_function",
          account_id: contractId,
          method_name: "get_whitelist",
          args_base64: "",
          finality: "final",
        });
        const _whitelist = JSON.parse(Buffer.from(res.result).toString());

        const viewAccount = new Account(near.connection, "dontcare");
        const metas = await Promise.all(
          _whitelist.map((t: any) => {
            return viewAccount
              .viewFunction(t.token_id, "ft_metadata")
              .then((meta) => ({ ...meta, token_id: t.token_id }))
              .catch(() => null);
          })
        );
        setWhitelist(metas);
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
      }
    }
    fetch();
  }, [contractId, near, selector.options.network.nodeUrl]);

  return { whitelist, isLoading };
};

export const useTokenBalance = (contractId: string | undefined) => {
  const [balance, setBalance] = useState("0");
  const { accountId, selector } = useWalletSelector();
  useEffect(() => {
    async function getTokenBalance() {
      if (!contractId) {
        return;
      }

      try {
        const provider = new providers.JsonRpcProvider({
          url: selector.options.network.nodeUrl,
        });

        const res = await provider.query<CodeResult>({
          request_type: "call_function",
          account_id: contractId,
          method_name: "ft_balance_of",
          args_base64: btoa(
            JSON.stringify({
              account_id: accountId,
            })
          ),
          finality: "final",
        });
        const bal = JSON.parse(Buffer.from(res.result).toString());
        setBalance(bal);
      } catch (error) {
        setBalance("0");
      }
    }

    getTokenBalance();
  }, [contractId, accountId, selector.options.network.nodeUrl]);
  return balance;
};
