import { ApiPromise } from "@polkadot/api"
import axios from "axios"
import { useWalletSelector } from "components/WalletSelectorContextProvider"
import { API_HOST } from "config"
import Decimal from "decimal.js"
import { providers } from "near-api-js"
import { CodeResult } from "near-api-js/lib/providers/provider"
import { EPOCH_DURATION_MS, OCT_TOKEN_DECIMALS } from "primitives"
import { useEffect, useState } from "react"
import { CrossChainToken, TokenPriceItem } from "types"
import { DecimalUtil, ZERO_DECIMAL } from "utils"

export default function useChainState(
  appchainApi: ApiPromise | undefined,
  anchorId: string | undefined,
  stakedOct: string | undefined
) {
  const [totalAsset, setTotalAsset] = useState(ZERO_DECIMAL)
  const [stakedOctValue, setStakedOctValue] = useState(ZERO_DECIMAL)
  const [currentEra, setCurrentEra] = useState<number>()
  const [totalIssuance, setTotalIssuance] = useState<string>()

  const [nextEraTime, setNextEraTime] = useState(0)
  const [nextEraTimeLeft, setNextEraTimeLeft] = useState(0)
  const { selector } = useWalletSelector()

  useEffect(() => {
    if (!appchainApi) {
      return
    }

    Promise.all([
      appchainApi.query.octopusLpos.activeEra(),
      appchainApi.query.balances?.totalIssuance(),
    ]).then(([era, issuance]) => {
      const eraJSON: any = era.toJSON()

      setCurrentEra(eraJSON?.index)

      setNextEraTime(eraJSON ? EPOCH_DURATION_MS + eraJSON.start : 0)
      setNextEraTimeLeft(
        eraJSON ? eraJSON.start + EPOCH_DURATION_MS - new Date().getTime() : 0
      )
      setTotalIssuance(issuance?.toString() || "0")
    })

    async function calcAssets() {
      if (!anchorId) {
        return
      }
      try {
        const provider = new providers.JsonRpcProvider({
          url: selector.options.network.nodeUrl,
        })
        const res = await provider.query<CodeResult>({
          request_type: "call_function",
          account_id: anchorId,
          method_name: "get_near_fungible_tokens",
          args_base64: "",
          finality: "optimistic",
        })
        const crossChainTokens = JSON.parse(
          Buffer.from(res.result).toString()
        ) as CrossChainToken[]

        if (crossChainTokens.length !== 0) {
          const result = await axios.get(`${API_HOST}/prices`)

          const listedTokens = result.data as TokenPriceItem[]

          const total = crossChainTokens
            .filter((t) => t)
            .reduce((sum, t) => {
              const token: TokenPriceItem | undefined = listedTokens.find(
                (lt) => lt.token_account_id === t.contract_account
              )
              if (token) {
                return new Decimal(t.locked_balance)
                  .mul(new Decimal(token.price))
                  .div(10 ** token.ftInfo.decimals)
                  .add(sum)
              }
              return sum
            }, new Decimal(0))
          setTotalAsset(total)

          const octToken = listedTokens.find((t) => t.ftInfo.symbol === "OCT")
          if (octToken) {
            const staked = DecimalUtil.fromString(
              stakedOct || "0",
              OCT_TOKEN_DECIMALS
            ).mul(new Decimal(octToken.price))

            setStakedOctValue(staked)
          }
        }
      } catch (error) {
        console.log("error", error)
      }
    }

    calcAssets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appchainApi?.genesisHash, anchorId, stakedOct])

  return {
    totalAsset,
    stakedOctValue,
    currentEra,
    totalIssuance,
    nextEraTime,
    nextEraTimeLeft,
  }
}
