import { Flex } from '@chakra-ui/react'
import { useState } from 'react'
import { ConversionPool, FungibleTokenMetadata } from 'types'
import ConvertToken from './ConvertToken'
import Pool from './Pool'

export default function PoolList({
  pools,
  whitelist,
}: {
  pools: ConversionPool[]
  whitelist: FungibleTokenMetadata[]
}) {
  const [selectedPool, setSelectedPool] = useState<ConversionPool | null>(null)
  return (
    <Flex direction="column" mt={10}>
      {pools.map((pool, idx) => {
        return (
          <Pool
            key={pool.id}
            pool={pool}
            whitelist={whitelist}
            onSelect={setSelectedPool}
          />
        )
      })}
      <ConvertToken
        pool={selectedPool}
        whitelist={whitelist}
        onClose={() => setSelectedPool(null)}
      />
    </Flex>
  )
}
