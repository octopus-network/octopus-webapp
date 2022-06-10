import {
  Button,
  Flex,
  SimpleGrid,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { AccountId, ConversionPool, FungibleTokenMetadata } from 'types'
import ManagePool from './ManagePool'
import Pool from './Pool'
import PoolInfo from './PoolInfo'

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
          return (
            <Pool
              key={pool.id}
              pool={pool}
              whitelist={whitelist}
              onSelect={(p) => navigate(`/converter/pool/${pool.id}/manage`)}
            />
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
