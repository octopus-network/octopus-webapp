import { Flex } from '@chakra-ui/react'
import { ConversionPool, FungibleTokenMetadata } from 'types'
import Pool from './Pool'

export default function PoolList({
  pools,
  whitelist,
}: {
  pools: ConversionPool[]
  whitelist: FungibleTokenMetadata[]
}) {
  return (
    <Flex direction="column" mt={10}>
      {pools.map((pool, idx) => {
        return <Pool key={pool.id} pool={pool} whitelist={whitelist} />
      })}
    </Flex>
  )
}
