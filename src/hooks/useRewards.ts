import { useWalletSelector } from "components/WalletSelectorContextProvider";
import { useEffect, useState } from "react";
import { request } from "graphql-request";
import Decimal from "decimal.js";
import _ from "lodash";
import { isMainnet } from "config";

export interface RewardItem {
  id: string;
  receiver: string;
  validator: string;
  amount: string;
  is_withdrawn: boolean;
  type: "ValidatorReward" | "DelegatorReward";
  appchain_contract: string;
  era: number;
}

export default function useRewards(appchain_contract?: string) {
  const [rewards, setRewards] = useState<RewardItem[]>([]);

  const { accountId } = useWalletSelector();
  useEffect(() => {
    const fetchRewards = async () => {
      try {
        if (!accountId || !appchain_contract) {
          return;
        }
        if (!isMainnet) {
          return;
        }
        const rewardsQuery = `
          {
            rewards(first: 300, where: { receiver: "${accountId}", appchain_contract: "${appchain_contract}"}) {
              id
              receiver
              validator
              amount
              is_withdrawn
              type
              appchain_contract
              era
            }
          }
        `;
        const result = await request(
          "https://gateway-arbitrum.network.thegraph.com/api/2ce522b548669c2665faebea047254df/subgraphs/id/5tSoErooFHWnCgZeU15ipm7eMmMyvPiyGhFZtDYY1fYk",
          rewardsQuery
        );
        const rewards = result.rewards;
        setRewards(rewards);
      } catch (error) {}
    };
    fetchRewards();
  }, [appchain_contract, accountId]);

  const pendingRewards = rewards.filter((r) => !r.is_withdrawn);
  const total = pendingRewards.reduce(
    (total, next) => total.add(next.amount),
    new Decimal(0)
  );
  const delegatorRewards = rewards.filter((r) => r.type === "DelegatorReward");

  return {
    validatorRewards: rewards.filter((r) => r.type === "ValidatorReward"),
    delegatorRewards: _.groupBy(delegatorRewards, "validator"),
    total,
  };
}
