import axios from "axios";
import { NetworkConfig, RewardHistory } from "types";
import { DecimalUtil, ZERO_DECIMAL } from "./decimal";
import { API_HOST } from "config";
import posthog from "posthog-js";
import { providers } from "near-api-js";
import { CodeResult } from "near-api-js/lib/providers/provider";
import groupBy from "lodash.groupby";

export const getRedelegateHistory = async (
  networkConfig: NetworkConfig,
  appchain_anchor: string,
  delegatorId: string
) => {
  const arr: string[] = [];
  let success = true;
  try {
    const redelegateRes = await axios.post(
      `${networkConfig?.near.restApiUrl}/explorer`,
      {
        user: "public_readonly",
        host: `${networkConfig?.near.networkId}.db.explorer.indexer.near.dev`,
        database: `${networkConfig?.near.networkId}_explorer`,
        password: "nearprotocol",
        port: 5432,
        parameters: [appchain_anchor, delegatorId],
        query: `
          SELECT * FROM public.action_receipt_actions 
          WHERE receipt_receiver_account_id = $1
          AND args->>'method_name' = 'change_delegated_validator'
          AND receipt_predecessor_account_id = $2
          LIMIT 100;
        `,
      }
    );

    redelegateRes.data.forEach((t: any) => {
      if (t.args.args_json) {
        arr.push(t.args.args_json.new_validator_id);
        arr.push(t.args.args_json.old_validator_id);
      }
    });
  } catch (error) {
    success = false;
    posthog.capture("get_redelegate_error");
  }
  return {
    success,
    arr: Array.from(new Set(arr)),
  };
};

export const getDelegatedValidators = async (
  networkConfig: NetworkConfig,
  appchain_anchor: string,
  delegatorId: string
): Promise<string[]> => {
  let arr = [];
  try {
    const registerRes = await axios.post(
      `${networkConfig?.near.restApiUrl}/explorer`,
      {
        user: "public_readonly",
        host: `${networkConfig?.near.networkId}.db.explorer.indexer.near.dev`,
        database: `${networkConfig?.near.networkId}_explorer`,
        password: "nearprotocol",
        port: 5432,
        parameters: [
          networkConfig?.octopus.octTokenContractId,
          delegatorId,
          appchain_anchor,
        ],
        query: `
          SELECT * FROM public.action_receipt_actions 
          WHERE receipt_receiver_account_id = $1
          AND receipt_predecessor_account_id = $2
          AND args->>'method_name' = 'ft_transfer_call'
          AND args->'args_json'->>'receiver_id' = $3
          LIMIT 100;
        `,
      }
    );
    arr = registerRes.data.map((r: any) => {
      try {
        const obj = JSON.parse(
          decodeURIComponent(r.args.args_json.msg.replace(/\\/g, ""))
        );
        return obj.RegisterDelegator.validator_id;
      } catch (error) {
        return "";
      }
    });
  } catch (error) {
    posthog.capture("get_registed_validator_error");
  }
  const { success, arr: redelegates } = await getRedelegateHistory(
    networkConfig,
    appchain_anchor,
    delegatorId
  );
  if (success) {
    arr = arr.concat(redelegates);
  } else {
    const { arr: redelegates } = await getRedelegateHistory(
      networkConfig,
      appchain_anchor,
      delegatorId
    );
    arr = arr.concat(redelegates);
  }

  return Array.from(new Set(arr.filter((t: string) => t !== "")));
};

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
