import { ApiPromise } from "@polkadot/api"
import { EPOCH_DURATION_MS } from "primitives"
import { useEffect, useState } from "react"

export default function useChainState(appchainApi: ApiPromise | undefined) {
  const [totalAsset, setTotalAsset] = useState()
  const [bestBlock, setBestBlock] = useState<number>()
  const [currentEra, setCurrentEra] = useState<number>()
  const [totalIssuance, setTotalIssuance] = useState<string>()

  const [nextEraTime, setNextEraTime] = useState(0)
  const [nextEraTimeLeft, setNextEraTimeLeft] = useState(0)

  useEffect(() => {
    if (!appchainApi) {
      return
    }
    let unsubNewHeads: any
    appchainApi.rpc.chain
      .subscribeNewHeads((lastHeader) =>
        setBestBlock(lastHeader.number.toNumber())
      )
      .then((unsub) => (unsubNewHeads = unsub))

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
        const assets = await appchainApi?.query.octopusAppchain.assetIdByName(
          null
        )
        console.log("assets", assets?.toJSON())
      } catch (error) {
        console.log("error", error)
      }
    }

    calcAssets()

    return () => unsubNewHeads && unsubNewHeads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appchainApi?.genesisHash])

  return {
    totalAsset,
    bestBlock,
    currentEra,
    totalIssuance,
    nextEraTime,
    nextEraTimeLeft,
  }
}
