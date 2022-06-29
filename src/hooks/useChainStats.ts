import { request } from "graphql-request"
import { useEffect, useState } from "react"

const GLOBAL_DATA_QUERY = `
  query QueryGlobalData {
    blocks {
      totalCount
    }
    extrinsics {
      totalCount
    }
    accounts {
      totalCount
    }
    systemTokenTransfers {
      totalCount
    }
  }
`

interface Count {
  totalCount: number
}
interface Stats {
  accounts: Count
  blocks: Count
  extrinsics: Count
  systemTokenTransfers: Count
}

export default function useChainStats(chainId: string | undefined) {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    setStats(null)

    if (chainId) {
      request(
        `https://api.subquery.network/sq/octopus-appchains/${chainId}`,
        GLOBAL_DATA_QUERY
      )
        .then((result) => {
          setStats(result)
        })
        .catch(console.error)
    }
  }, [chainId])

  return stats
}
