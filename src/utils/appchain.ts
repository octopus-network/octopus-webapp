import axios from "axios";
import { NetworkConfig, RewardHistory } from "types";
import { DecimalUtil, ZERO_DECIMAL } from "./decimal";

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
      parameters: ["oct.beta_oct_relay.testnet", delegatorId, appchain_anchor],
      query: `
          SELECT * FROM public.action_receipt_actions 
          WHERE receipt_receiver_account_id = $1
          AND receipt_predecessor_account_id = $2
          AND args->>'method_name' = 'ft_transfer_call'
          AND args->'args_json'->>'receiver_id' = $3
          LIMIT 100;
        `,
    });

    const tmpArr = res.data.map((r: any) => {
      try {
        const obj = JSON.parse(
          decodeURIComponent(r.args.args_json.msg.replace(/\\/g, ""))
        );
        return obj.RegisterDelegator.validator_id;
      } catch (error) {
        return "";
      }
    });

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
