import { Button, Flex, useColorModeValue } from '@chakra-ui/react'
import { ConversionPool, FungibleTokenMetadata } from 'types'
import { isMobile } from 'react-device-detect'
import PoolInfo from './PoolInfo'

export default function Pool({
  pool,
  whitelist,
  onSelect,
}: {
  pool: ConversionPool
  whitelist: FungibleTokenMetadata[]
  onSelect: (pool: ConversionPool) => void
}) {
  const bg = useColorModeValue('white', '#25263c')

  return (
    <Flex
      direction={isMobile ? 'column' : 'row'}
      bg={bg}
      p={6}
      gap={isMobile ? 2 : 0}
      align="center"
      justify="space-between"
      mb={2}
    >
      <PoolInfo pool={pool} whitelist={whitelist} />
      <Button
        variant="octo-linear"
        alignSelf="flex-end"
        size="sm"
        onClick={() => onSelect(pool)}
      >
        Select
      </Button>
    </Flex>
  )
}
