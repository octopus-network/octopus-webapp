import { Button, Flex, Text, useColorModeValue } from '@chakra-ui/react'
import { FiArrowRight, FiRepeat } from 'react-icons/fi'

export default function Pool({ pool }: { pool: any }) {
  const bg = useColorModeValue('white', '#25263c')
  return (
    <Flex direction="row" bg={bg} p={10} justify="space-between">
      <Flex direction="row" align="center" gap={8}>
        <Text fontSize="2xl">{pool.token0}</Text>
        {pool.isReverse ? <FiRepeat size={24} /> : <FiArrowRight size={24} />}
        <Text fontSize="2xl">{pool.token1}</Text>
      </Flex>
      <Button colorScheme="blue">Select</Button>
    </Flex>
  )
}
