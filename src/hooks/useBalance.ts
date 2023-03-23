import { useWalletSelector } from "components/WalletSelectorContextProvider";
import Decimal from "decimal.js";
import { useEffect, useState } from "react";
import { DecimalUtil } from "utils";
import { useTokenContract } from "./useTokenContract";

export default function useBalance(contractId?: string) {
  const [balances, setBalances] = useState<Record<string, Decimal>>({});
  const { accountId } = useWalletSelector();
  const contract = useTokenContract(contractId);

  useEffect(() => {
    async function getBalance() {
      if (!contractId) {
        return;
      }
      try {
        const _balance = await contract?.ft_balance_of({
          account_id: accountId!,
        });
        const metadata = await contract?.ft_metadata();

        // console.log("balance", contractId, _balance?.toString(), metadata);

        setBalances((bs) => ({
          ...bs,
          [contractId]: DecimalUtil.shift(_balance, metadata.decimals),
        }));
      } catch (error) {
        setBalances((bs) => ({
          ...bs,
          [contractId]: new Decimal(0),
        }));
      }
    }

    console.log("contractId", contractId);

    if (accountId && contractId && contract) {
      getBalance();
    }
  }, [accountId, contract, contractId]);

  return contractId ? balances[contractId] || new Decimal(0) : new Decimal(0);
}
