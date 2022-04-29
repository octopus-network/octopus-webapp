import { Button, Flex, Image, Text, useColorModeValue } from '@chakra-ui/react'
import { useState } from 'react'
import { FiArrowRight, FiRepeat } from 'react-icons/fi'
import { ConversionPool, FungibleTokenMetadata } from 'types'
import ManagePool from './ManagePool'

export default function MyPool({
  pools,
  whitelist,
}: {
  pools: ConversionPool[]
  whitelist: FungibleTokenMetadata[]
}) {
  const bg = useColorModeValue('white', '#25263c')
  const [selectedPool, setSelectedPool] = useState<ConversionPool | null>(null)
  return (
    <Flex pb={10} gap={4}>
      {pools.map((pool) => {
        const inToken = whitelist.find((t) => t.token_id === pool.in_token)
        const outToken = whitelist.find((t) => t.token_id === pool.out_token)
        return (
          <Flex key={pool.id} bg={bg} p={4} direction="column" gap={4} w="33%">
            <Flex direction="column" gap={2}>
              <Text color="blue">{`#${pool.id} Creator: ${pool.creator}`}</Text>
              <Flex direction="row" align="center" gap={8}>
                <Flex direction="column" gap={2}>
                  <Flex gap={2} align="center">
                    {inToken && (
                      <Image
                        src={inToken.icon || ''}
                        width={8}
                        height={8}
                        alt=""
                      />
                    )}
                    <Text fontSize="2xl">{inToken?.symbol}</Text>
                  </Flex>
                </Flex>
                <Flex direction="column" align="center" gap={1}>
                  {/* <Text fontSize="sm">{`${pool.in_token_rate} : ${pool.out_token_rate}`}</Text> */}
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
                        width={8}
                        height={8}
                        alt=""
                      />
                    )}
                    <Text fontSize="2xl">{outToken?.symbol}</Text>
                  </Flex>
                </Flex>
              </Flex>
            </Flex>
            <Flex justify="flex-end">
              <Button
                colorScheme="blue"
                size="sm"
                onClick={() => setSelectedPool(pool)}
              >
                Manage
              </Button>
            </Flex>
          </Flex>
        )
      })}
      <ManagePool
        pool={selectedPool}
        whitelist={whitelist}
        onClose={() => setSelectedPool(null)}
      />
    </Flex>
  )
}
