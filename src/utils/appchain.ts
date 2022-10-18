import axios from "axios";
import { NetworkConfig, RewardHistory } from "types";
import { DecimalUtil, ZERO_DECIMAL } from "./decimal";
import { API_HOST } from "config";

export const getUnbondedValidators = async (
  networkConfig: NetworkConfig,
  appchain_anchor: string
) => {
  try {
    const res = await axios.post(`${networkConfig?.near.restApiUrl}/explorer`, {
      user: "public_readonly",
      host: `${networkConfig?.near.networkId}.db.explorer.indexer.near.dev`,
      database: `${networkConfig?.near.networkId}_explorer`,
      password: "nearprotocol",
      port: 5432,
      parameters: [appchain_anchor],
      query: `
          SELECT * FROM public.action_receipt_actions 
          WHERE receipt_receiver_account_id = $1
          AND args->>'method_name' = 'unbond_stake'
          LIMIT 100;
        `,
    });

    const tmpArr = res.data.map((r: any) => r.receipt_predecessor_account_id);
    return Array.from(new Set(tmpArr));
  } catch (error) {
    return [];
  }
};

export const getDelegatedValidators = async (
  networkConfig: NetworkConfig,
  appchain_anchor: string,
  delegatorId: string
): Promise<string[]> => {
  try {
    const res = await axios.post(`${networkConfig?.near.restApiUrl}/explorer`, {
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
    });

    const tmpArr = res.data
      .map((r: any) => {
        try {
          const obj = JSON.parse(
            decodeURIComponent(r.args.args_json.msg.replace(/\\/g, ""))
          );
          return obj.RegisterDelegator.validator_id;
        } catch (error) {
          return "";
        }
      })
      .filter((t: string) => t !== "");

    return Array.from(new Set(tmpArr));
  } catch (error) {
    return [];
  }
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
  networkConfig: NetworkConfig
) => {
  try {
    const appchainRes = await axios.get(`${API_HOST}/appchain/${appchainId}`);
    const appchain = appchainRes.data;
    const validatorRewards = await getRewards(
      `${API_HOST}/rewards/${accountId}/${appchain.appchain_id}/${appchain?.anchor_status?.index_range_of_validator_set_history?.end_index}`
    );
    const delegatedValidatorIds = await getDelegatedValidators(
      networkConfig,
      appchain.appchain_anchor,
      accountId
    );

    const delegatorRewards = await Promise.all(
      delegatedValidatorIds.map(async (id) => {
        return await fetch(
          `${API_HOST}/rewards/${id}/${appchain.appchain_id}/${accountId}/${appchain?.anchor_status?.index_range_of_validator_set_history?.end_index}`
        ).then((res) => res.json());
      })
    );
    const rewards: { [key: string]: RewardHistory[] } = {};

    delegatorRewards.forEach((reward, idx) => {
      rewards[delegatedValidatorIds[idx]] = reward;
    });

    return {
      appchain,
      validatorRewards: validatorRewards,
      delegatorRewards: rewards,
    };
  } catch (error) {}
};
