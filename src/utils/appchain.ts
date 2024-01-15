import axios from "axios";
import { RewardHistory } from "types";
import { DecimalUtil, ZERO_DECIMAL } from "./decimal";
import { API_HOST } from "config";
import { providers } from "near-api-js";
import { CodeResult } from "near-api-js/lib/providers/provider";
import groupBy from "lodash.groupby";

export const calcUnwithdrawnReward = (
  rewards: RewardHistory[],
  decimals: number | undefined
) => {
  if (!rewards?.length || typeof decimals !== "number") {
    return ZERO_DECIMAL;
  }

  return rewards.reduce(
    (total, next) =>
      total.plus(
        next.expired
          ? ZERO_DECIMAL
          : DecimalUtil.fromString(next.unwithdrawn_reward, decimals)
      ),
    ZERO_DECIMAL
  );
};

async function getRewards(url: string) {
  try {
    const res = await axios.get(url);
    return res.data;
  } catch (error) {
    return [];
  }
}

export const getAppchainRewards = async (
  appchainId: string,
  accountId: string,
  nodeUrl: string
) => {
  try {
    const appchainRes = await axios.get(`${API_HOST}/appchain/${appchainId}`);
    const appchain = appchainRes.data;

    const validatorRewards = await getRewards(
      `${API_HOST}/rewards/${accountId}/${appchain.appchain_id}/${appchain?.anchor_status?.index_range_of_validator_set_history?.end_index}`
    );

    const provider = new providers.JsonRpcProvider({
      url: nodeUrl,
    });

    const res = await provider.query<CodeResult>({
      request_type: "call_function",
      account_id: appchain.appchain_anchor,
      method_name: "get_delegator_rewards",
      args_base64: btoa(
        JSON.stringify({
          delegator_id: accountId,
        })
      ),
      finality: "final",
    });

    const dRewards = JSON.parse(Buffer.from(res.result).toString());

    const unwithdrawnRewards = dRewards.sort(
      (a: any, b: any) => Number(b.era_number) - Number(a.era_number)
    );
    const groupedRewards = groupBy(unwithdrawnRewards, "delegated_validator");
    return {
      appchain,
      validatorRewards: validatorRewards,
      delegatorRewards: groupedRewards,
    };
  } catch (error) {
    console.log("appchain", appchainId);
    console.error(error);
  }
};
