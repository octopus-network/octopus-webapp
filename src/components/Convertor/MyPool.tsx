import {
  Button,
  Flex,
  Image,
  Link,
  SimpleGrid,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { AccountId, ConversionPool, FungibleTokenMetadata } from 'types'
import { MdSyncAlt, MdTrendingFlat } from 'react-icons/md'
import ManagePool from './ManagePool'
import { useGlobalStore } from 'stores'

export default function MyPool({
  pools,
  whitelist,
  contractId,
}: {
  pools: ConversionPool[]
  whitelist: FungibleTokenMetadata[]
  contractId: AccountId
}) {
  const bg = useColorModeValue('white', '#25263c')
  const [selectedPool, setSelectedPool] = useState<ConversionPool | null>(null)
  const { poolId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (
      pools.length &&
      /^\/converter\/pool\/\d{1,}\/manage$/.test(location.pathname)
    ) {
      setSelectedPool(pools.find((p) => String(p.id) === poolId) ?? null)
    } else {
      setSelectedPool(null)
    }
  }, [poolId, pools, location])

  const { global } = useGlobalStore()
  if (pools.length === 0) {
    return null
  }

  return (
    <Flex direction="column" gap={6} mb={10}>
      <Text fontSize="2xl" fontWeight="bold">
        My pools
      </Text>
      <SimpleGrid gap={3} mt={1} columns={{ base: 1, md: 3 }}>
        {pools.map((pool) => {
          const inToken = whitelist.find((t) => t.token_id === pool.in_token)
          const outToken = whitelist.find((t) => t.token_id === pool.out_token)
          return (
            <Flex key={pool.id} bg={bg} p={4} direction="column" gap={4}>
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
                  variant="octo-linear"
                  size="sm"
                  onClick={() => {
                    navigate(`/converter/pool/${pool.id}/manage`)
                  }}
                >
                  Manage
                </Button>
              </Flex>
            </Flex>
          )
        })}
      </SimpleGrid>
      <ManagePool
        pool={selectedPool}
        whitelist={whitelist}
        contractId={contractId}
        onClose={() => {
          navigate('/converter')
        }}
      />
    </Flex>
  )
}
