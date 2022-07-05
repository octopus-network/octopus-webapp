import { Flex, SimpleGrid, Skeleton, Stack } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { AccountId, ConversionPool, FungibleTokenMetadata } from 'types'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import ConvertToken from './ConvertToken'
import Pool from './Pool'

export default function PoolList({
  isLoading,
  pools,
  whitelist,
  contractId,
}: {
  contractId: AccountId
  isLoading: boolean
  pools: ConversionPool[]
  whitelist: FungibleTokenMetadata[]
}) {
  const [selectedPool, setSelectedPool] = useState<ConversionPool | null>(null)

  const { poolId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => {
    if (pools.length && /^\/converter\/pool\/\d{1,}$/.test(location.pathname)) {
      setSelectedPool(pools.find((p) => String(p.id) === poolId) ?? null)
    } else {
      setSelectedPool(null)
    }
  }, [poolId, pools, location])

  return (
    <Flex direction="column" mt={10}>
      {isLoading && pools.length === 0 && (
        <Stack>
          <Skeleton height="160px" />
          <Skeleton height="160px" />
          <Skeleton height="160px" />
        </Stack>
      )}
      <SimpleGrid gap={3} mt={1} columns={{ base: 1, md: 3 }}>
        {pools.map((pool, idx) => {
          return (
            <Pool
              key={pool.id}
              pool={pool}
              whitelist={whitelist}
              onSelect={(p) => navigate(`/converter/pool/${p.id}`)}
            />
          )
        })}
      </SimpleGrid>
      <ConvertToken
        pool={selectedPool}
        whitelist={whitelist}
        onClose={() => navigate('/converter')}
        contractId={contractId}
      />
    </Flex>
  )
}
