import { Flex, useColorModeValue } from '@chakra-ui/react'
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

  const hoverBg = useColorModeValue('#e3e3e3', '#333')

  return (
    <Flex
      direction={isMobile ? 'column' : 'row'}
      bg={bg}
      p={6}
      gap={isMobile ? 2 : 0}
      align="center"
      justify="space-between"
      onClick={() => onSelect(pool)}
      style={{ cursor: 'pointer' }}
      _hover={{ backgroundColor: hoverBg }}
      borderRadius={10}
    >
      <PoolInfo pool={pool} whitelist={whitelist} />
    </Flex>
  )
}
