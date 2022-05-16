import { Container, Flex } from '@chakra-ui/react'
import CreatePool from 'components/Convertor/CreatePool'
import MyPool from 'components/Convertor/MyPool'
import PoolList from 'components/Convertor/PoolList'
import {
  useConvertorContract,
  usePools,
  useWhitelist,
} from 'hooks/useConvertorContract'
import { useGlobalStore } from 'stores'
import useSWR from 'swr'
import { ConverterConfig, NetworkType } from 'types'

export function Converter() {
  const { global } = useGlobalStore()
  const { data } = useSWR<ConverterConfig>(`converter-config`)

  const contractId = data
    ? data[global.network?.near.networkId ?? NetworkType.TESTNET].contractId
    : ''

  const contract = useConvertorContract(
    global.wallet?.account() as any,
    contractId
  )
  const { whitelist, isLoading: isLoadingWhitelist } = useWhitelist(contract)

  const { pools, isLoading: isLoadingPools } = usePools(contract, 0, 10)

  const myPools = pools.filter((p) => p.creator === global.accountId)

  return (
    <Container position="relative">
      <Flex direction="column" pt={10}>
        <MyPool pools={myPools} whitelist={whitelist} contractId={contractId} />
        <CreatePool whitelist={whitelist} contractId={contractId} />

        <PoolList
          pools={pools}
          whitelist={whitelist}
          isLoading={isLoadingWhitelist || isLoadingPools}
          contractId={contractId}
        />
      </Flex>
    </Container>
  )
}
