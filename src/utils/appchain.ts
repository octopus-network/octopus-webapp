import axios from "axios"
import { CLOUD_VENDOR, NetworkConfig, NetworkType, NodeDetail } from "types"

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

export const getNodeDetail = async ({
  appchainId,
  accountId,
  network,
  cloudVendor,
  accessKey,
}: {
  appchainId: string
  accountId: string
  network: NetworkType
  cloudVendor: CLOUD_VENDOR
  accessKey: string
}) => {
  const authStr = `appchain-${appchainId}-network-${network}-cloud-${cloudVendor}-account-${accountId}-${accessKey}`

  const res = await axios.get(
    `https://3jd9s8zf1l.execute-api.us-west-2.amazonaws.com/api/tasks`,
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        authorization: authStr,
      },
    }
  )

  const nodes: NodeDetail[] = res.data

  if (nodes.length) {
    return nodes.find((t) => t?.state === "12") || nodes[0]
  }
  return null
}
