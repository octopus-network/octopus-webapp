import {
  Box,
  Button,
  Flex,
  Image,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import { FiArrowRight, FiRepeat } from 'react-icons/fi'
import { ConversionPool, FungibleTokenMetadata } from 'types'

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
  const inToken = whitelist.find((t) => t.token_id === pool.in_token)
  const outToken = whitelist.find((t) => t.token_id === pool.out_token)
  return (
    <Flex
      direction="row"
      bg={bg}
      p={6}
      align="center"
      justify="space-between"
      mb={2}
    >
      <Flex direction="column" gap={2}>
        <Text color="blue">{`#${pool.id} Creator: ${pool.creator}`}</Text>
        <Flex direction="row" align="flex-start" gap={8}>
          <Flex direction="column" gap={2}>
            <Flex gap={2} align="center">
              {inToken && (
                <Image src={inToken.icon || ''} width={10} height={10} alt="" />
              )}
              <Text fontSize="2xl">{inToken?.symbol}</Text>
            </Flex>
            {pool.reversible && (
              <Text>{`Balance: ${pool.in_token_balance}`}</Text>
            )}
          </Flex>
          <Flex direction="column" align="center" gap={1}>
            <Text fontSize="sm">{`${pool.in_token_rate} : ${pool.out_token_rate}`}</Text>
            {pool.reversible ? (
              <FiRepeat size={20} />
            ) : (
              <FiArrowRight size={20} />
            )}
          </Flex>
          <Flex direction="column" gap={2}>
            <Flex gap={2} align="center">
              {outToken && (
                <Image
                  src={outToken.icon || ''}
                  width={10}
                  height={10}
                  alt=""
                />
              )}
              <Text fontSize="2xl">{outToken?.symbol}</Text>
            </Flex>

            <Text>{`Balance: ${pool.out_token_balance}`}</Text>
          </Flex>
        </Flex>
      </Flex>
      <Button colorScheme="blue" onClick={() => onSelect(pool)}>
        Select
      </Button>
    </Flex>
  )
}
