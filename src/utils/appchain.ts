import axios from "axios"
import { NetworkConfig, RewardHistory } from "types"
import { DecimalUtil, ZERO_DECIMAL } from "./decimal"

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
    })

    const tmpArr = res.data.map((r: any) => r.receipt_predecessor_account_id)
    return Array.from(new Set(tmpArr))
  } catch (error) {
    return []
  }
}

export const getDelegatorUnbondedValidators = async (
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
      parameters: [appchain_anchor, delegatorId],
      query: `
          SELECT * FROM public.action_receipt_actions 
          WHERE receipt_receiver_account_id = $1
          AND receipt_predecessor_account_id = $2
          AND args->>'method_name' = 'unbond_delegation'
          LIMIT 100;
        `,
    })

    const tmpArr = res.data.map((r: any) => r.args.args_json.validator_id)
    return Array.from(new Set(tmpArr))
  } catch (error) {
    return []
  }
}

export const calcUnwithdrawnReward = (
  rewards: RewardHistory[],
  decimals: number | undefined
) => {
  if (!rewards?.length || typeof decimals !== "number") {
    return ZERO_DECIMAL
  }

  return rewards.reduce(
    (total, next) =>
      total.plus(
        next.expired
          ? ZERO_DECIMAL
          : DecimalUtil.fromString(next.unwithdrawn_reward, decimals)
      ),
    ZERO_DECIMAL
  )
}
