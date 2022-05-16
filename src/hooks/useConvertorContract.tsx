import axios from 'axios'
import { API_HOST } from 'config'
import { Account, keyStores, Near } from 'near-api-js'
import { useEffect, useState } from 'react'
import { useGlobalStore } from 'stores'
import {
  ConversionPool,
  ConvertorContract,
  FungibleTokenMetadata,
  NetworkConfig,
  TokenContract,
} from 'types'

export const useNear = () => {
  const [near, setNear] = useState<Near | null>()

  useEffect(() => {
    axios
      .get(`${API_HOST}/network-config`)
      .then((res) => res.data)
      .then((network: NetworkConfig) => {
        const near = new Near({
          keyStore: new keyStores.BrowserLocalStorageKeyStore(),
          headers: {},
          ...network.near,
        })
        setNear(near)
      })
      .catch(console.error)
  }, [])

  return near
}

export const useConvertorContract = (account: Account, contractId: string) => {
  const [contract, setContract] = useState<ConvertorContract | null>(null)

  useEffect(() => {
    if (contractId) {
      const _contract = new ConvertorContract(account, contractId, {
        viewMethods: ['get_whitelist', 'get_pools', 'get_storage_fee_gap_of'],
        changeMethods: [],
      })
      setContract(_contract)
    }
  }, [account, contractId])

  return contract
}

export const usePools = (
  contract: ConvertorContract | null,
  from_index: number,
  limit: number
) => {
  const [pools, setPools] = useState<ConversionPool[]>([])
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    if (contract) {
      contract
        .get_pools({ from_index, limit })
        .then((pools) => {
          setPools(pools)
          setIsLoading(false)
        })
        .catch((error) => {
          setIsLoading(false)
        })
    }
  }, [contract, from_index, limit])
  return { pools, isLoading }
}

// export const useMyPools = (
//   contract: ConvertorContract | null,
//   accountId: string
// ) => {
//   const [pools, setPools] = useState<ConversionPool[]>([])
//   useEffect(() => {
//     if (contract) {
//       contract
//         .get_creator_pools({ from_index, limit })
//         .then((pools) => {
//           setPools(pools)
//         })
//         .catch((error) => {
//           console.error(error)
//         })
//     }
//   }, [contract, from_index, limit])
//   return pools
// }

export const useWhitelist = (contract: ConvertorContract | null) => {
  const [whitelist, setWhitelist] = useState<FungibleTokenMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const near = useNear()
  useEffect(() => {
    async function fetch() {
      if (contract && near) {
        try {
          const _whitelist = await contract.get_whitelist()
          const viewAccount = new Account(near.connection, 'dontcare')
          const metas = await Promise.all(
            _whitelist.map((t) => {
              return viewAccount
                .viewFunction(t.token_id, 'ft_metadata')
                .then((meta) => ({ ...meta, token_id: t.token_id }))
                .catch(() => null)
            })
          )
          setWhitelist(metas)
          setIsLoading(false)
        } catch (error) {
          setIsLoading(false)
        }
      }
    }
    fetch()
  }, [contract, near])
  return { whitelist, isLoading }
}

export const useTokenBalance = (contractId: string | undefined) => {
  const [balance, setBalance] = useState('0')
  const { global } = useGlobalStore()
  useEffect(() => {
    if (global && global.wallet && global.accountId && contractId) {
      const contract = new TokenContract(
        global?.wallet?.account(),
        contractId,
        {
          viewMethods: ['ft_balance_of', 'storage_balance_of'],
          changeMethods: ['ft_transfer_call'],
        }
      )
      contract
        .ft_balance_of({ account_id: global.accountId })
        .then((balance) => {
          setBalance(balance)
        })
        .catch(console.error)
    }
  }, [global, contractId])
  return balance
}
