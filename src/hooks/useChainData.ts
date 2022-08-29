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

export default function useChainData(
  chainId: string | undefined,
  subqEndpoint: string | undefined
) {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    setStats(null)

    if (chainId && subqEndpoint) {
      request(subqEndpoint, GLOBAL_DATA_QUERY)
        .then((result) => {
          setStats(result)
        })
        .catch(console.error)
    }
  }, [chainId, subqEndpoint])

  return stats
}
