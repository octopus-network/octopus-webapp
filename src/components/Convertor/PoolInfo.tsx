import { Avatar, Flex, Link, Text } from '@chakra-ui/react'
import { MdSyncAlt, MdTrendingFlat } from 'react-icons/md'
import { ConversionPool, FungibleTokenMetadata } from 'types'
import NEP141 from 'assets/icons/nep141-token.png'
import { useGlobalStore } from 'stores'
import { DecimalUtil } from 'utils'

export default function PoolInfo({
  pool,
  whitelist,
}: {
  pool: ConversionPool
  whitelist: FungibleTokenMetadata[]
}) {
  const { global } = useGlobalStore()
  const inToken = whitelist.find((t) => t.token_id === pool.in_token)
  const outToken = whitelist.find((t) => t.token_id === pool.out_token)

  const inTokenLiq = DecimalUtil.fromString(
    pool.in_token_balance,
    inToken?.decimals
  )
    .toFixed(2)
    .toString()

  const outTokenLiq = DecimalUtil.fromString(
    pool.out_token_balance,
    outToken?.decimals
  )
    .toFixed(2)
    .toString()

  return (
    <Flex direction="column" gap={2}>
      <Text color="#008cd5">
        {`#${pool.id} Owner: `}
        <Link
          href={`${global.network?.near.explorerUrl}/accounts/${pool.creator}`}
        >
          {pool.creator}
        </Link>
      </Text>
      <Flex direction="row" align="center" gap={4}>
        <Flex direction="column" gap={2}>
          <Flex gap={2} align="center">
            {inToken && (
              <Avatar src={inToken.icon || NEP141} width={10} height={10} />
            )}
            <Text fontSize="2xl">{inToken?.symbol}</Text>
          </Flex>
          <Text
            fontSize="sm"
            className="octo-gray"
          >{`Liquidity: ${inTokenLiq}`}</Text>
        </Flex>
        <Flex direction="column" align="center" gap={1}>
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
              <Avatar src={outToken.icon || NEP141} width={10} height={10} />
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
  )
}
