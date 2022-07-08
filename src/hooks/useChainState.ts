import { ApiPromise } from "@polkadot/api"
import { u8aToBuffer } from "@polkadot/util"
import Decimal from "decimal.js"
import { EPOCH_DURATION_MS } from "primitives"
import { useEffect, useState } from "react"

export default function useChainState(appchainApi: ApiPromise | undefined) {
  const [totalAsset, setTotalAsset] = useState("0")
  const [currentEra, setCurrentEra] = useState<number>()
  const [totalIssuance, setTotalIssuance] = useState<string>()

  const [nextEraTime, setNextEraTime] = useState(0)
  const [nextEraTimeLeft, setNextEraTimeLeft] = useState(0)

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
      try {
        const keys = await appchainApi?.rpc.state.getKeysPaged(
          "0x18878563306ebb9373c9e8590d9f405e32324c1f19077ebd896ac99badc0dd34",
          1000,
          "0x18878563306ebb9373c9e8590d9f405e32324c1f19077ebd896ac99badc0dd34"
        )

        const assets = await appchainApi?.rpc.state.queryStorageAt(keys!)

        Promise.all(
          (assets as any).map(async (t: any) => {
            try {
              const assetId = u8aToBuffer(t.toU8a(true))
                ?.reverse()
                .toString("hex")

              // console.log("assetid", t.toHuman(), new Decimal(assetId).toNumber())
              const asset = await appchainApi?.query.octopusAssets.asset(
                Number(assetId)
              )
              const _supply = (asset?.toJSON() as any)?.supply

              const meta = await appchainApi?.query.octopusAssets.metadata(
                assetId
              )

              const symbol = (meta?.toHuman() as any)?.symbol
              const decimals = (meta?.toHuman() as any)?.decimals

              const supply = new Decimal(_supply ?? 0).toFixed(0)
              if (supply === "0") {
                return undefined
              }
              return {
                supply,
                symbol,
                decimals,
              }
            } catch (error) {
              return undefined
            }
          })
        )
          .then((results) => {
            console.log("results", results)
          })
          .catch(console.error)
      } catch (error) {
        console.log("error", error)
      }
    }

    calcAssets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appchainApi?.genesisHash])

  return {
    totalAsset,
    currentEra,
    totalIssuance,
    nextEraTime,
    nextEraTimeLeft,
  }
}
