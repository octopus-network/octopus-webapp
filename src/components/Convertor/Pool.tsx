import { Button, Flex, Image, Text, useColorModeValue } from '@chakra-ui/react'
import { ConversionPool, FungibleTokenMetadata } from 'types'
import { DecimalUtil } from 'utils'
import { MdSyncAlt, MdTrendingFlat } from 'react-icons/md'
import { isMobile } from 'react-device-detect'

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

  const inTokenLiq = DecimalUtil.fromString(
    pool.in_token_balance,
    inToken?.decimals
  ).toString()

  const outTokenLiq = DecimalUtil.fromString(
    pool.out_token_balance,
    outToken?.decimals
  ).toString()

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
      <Flex direction="column" gap={2} flexShrink={0}>
        <Text color="#008cd5">{`#${pool.id} Owner: ${pool.creator}`}</Text>
        <Flex direction="row" align="flex-start" gap={4}>
          <Flex direction="column" gap={2}>
            <Flex gap={2} align="center">
              {inToken && (
                <Image src={inToken.icon || ''} width={10} height={10} alt="" />
              )}
              <Text fontSize="2xl">{inToken?.symbol}</Text>
            </Flex>
            {pool.reversible && (
              <Text
                fontSize="sm"
                className="octo-gray"
              >{`Liquidity: ${inTokenLiq}`}</Text>
            )}
          </Flex>
          <Flex direction="column" align="center">
            <Text fontSize="sm">{`${pool.in_token_rate} : ${pool.out_token_rate}`}</Text>
            {pool.reversible ? (
              <MdSyncAlt size={30} className="octo-gray" />
            ) : (
              <MdTrendingFlat size={30} className="octo-gray" />
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

            <Text
              fontSize="sm"
              className="octo-gray"
            >{`Liquidity: ${outTokenLiq}`}</Text>
          </Flex>
        </Flex>
      </Flex>
      <Button
        colorScheme="blue"
        alignSelf="flex-end"
        onClick={() => onSelect(pool)}
      >
        Select
      </Button>
    </Flex>
  )
}
