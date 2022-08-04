import { useBoolean } from "@chakra-ui/react"
import { providers } from "near-api-js"
import { CodeResult } from "near-api-js/lib/providers/provider"
import { useEffect, useState } from "react"
import { TokenAsset } from "types"
import { DecimalUtil, ZERO_DECIMAL } from "utils"

export default function useTokenBalance(
  tokenAsset: TokenAsset,
  accountId: string,
  nodeUrl: string
) {
  const [balance, setBalance] = useState(DecimalUtil.fromNumber(0))
  const [isLoadingBalance, setIsLoadingBalance] = useBoolean()

  useEffect(() => {
    setIsLoadingBalance.on()
    if (!accountId || !nodeUrl) {
      setBalance(ZERO_DECIMAL)
      setIsLoadingBalance.off()
      return
    }

    const provider = new providers.JsonRpcProvider({
      url: nodeUrl,
    })
    provider
      .query<CodeResult>({
        request_type: "call_function",
        account_id: tokenAsset.contractId,
        method_name: "ft_balance_of",
        args_base64: btoa(JSON.stringify({ account_id: accountId })),
        finality: "optimistic",
      })
      .then((res) => {
        const bal = JSON.parse(Buffer.from(res.result).toString())
        setBalance(
          DecimalUtil.fromString(
            bal,
            Array.isArray(tokenAsset?.metadata.decimals)
              ? tokenAsset?.metadata.decimals[0]
              : tokenAsset?.metadata.decimals
          )
        )
        setIsLoadingBalance.off()
      })
  }, [
    nodeUrl,
    accountId,
    setIsLoadingBalance,
    tokenAsset.contractId,
    tokenAsset?.metadata.decimals,
  ])

  return {
    balance,
    isLoading: isLoadingBalance,
  }
}
