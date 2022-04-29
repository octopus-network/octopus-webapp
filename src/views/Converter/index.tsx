import { Container, Flex } from '@chakra-ui/react'
import CreatePool from 'components/Convertor/CreatePool'
import MyPool from 'components/Convertor/MyPool'
import Pool from 'components/Convertor/Pool'
import PoolList from 'components/Convertor/PoolList'
import {
  useConvertorContract,
  usePools,
  useWhitelist,
} from 'hooks/useConvertorContract'
import { useGlobalStore } from 'stores'

export function Converter() {
  const { global } = useGlobalStore()
  const contract = useConvertorContract(
    global.wallet?.account() as any,
    'contract.convertor.testnet'
  )
  const whitelist = useWhitelist(contract)

  const pools = usePools(contract, 0, 10)

  const myPools = pools.filter((p) => p.creator === global.accountId)

  return (
    <Container position="relative">
      <Flex direction="column" padding={4} pt={10}>
        <MyPool pools={myPools} />
        <CreatePool whitelist={whitelist} />

        <PoolList pools={pools} whitelist={whitelist} />
      </Flex>
    </Container>
  )
}
