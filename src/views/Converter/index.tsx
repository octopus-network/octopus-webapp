import React from 'react'
import { Container, Flex } from '@chakra-ui/react'
import CreatePool from 'components/Convertor/CreatePool'
import Pool from 'components/Convertor/Pool'

export function Converter() {
  const pools = [
    {
      isReverse: true,
      token0: 'USDT',
      token1: 'TAO',
    },
  ]

  return (
    <Container position="relative">
      <Flex direction="column" padding={4} pt={10}>
        <CreatePool />

        <Flex direction="column" mt={10}>
          {pools.map((pool, idx) => {
            return <Pool key={idx} pool={pool} />
          })}
        </Flex>
      </Flex>
    </Container>
  )
}
