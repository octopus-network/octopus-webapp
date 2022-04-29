import {
  Flex,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Input,
  Text,
  Image,
  ModalCloseButton,
  Box,
} from '@chakra-ui/react'
import { formatBalance } from '@polkadot/util'
import { useNear, useTokenBalance } from 'hooks/useConvertorContract'
import { useEffect } from 'react'
import { useGlobalStore } from 'stores'
import { ConversionPool, FungibleTokenMetadata } from 'types'

export default function ManagePool({
  pool,
  whitelist,
  onClose,
}: {
  pool: ConversionPool | null
  whitelist: FungibleTokenMetadata[]
  onClose: () => void
}) {
  const inToken = whitelist.find((t) => t.token_id === pool?.in_token)
  const outToken = whitelist.find((t) => t.token_id === pool?.out_token)

  const onDepositInToken = async () => {}
  const onDepositOutToken = async () => {}
  const inTokenBalance = useTokenBalance(inToken?.token_id)
  const outTokenBlance = useTokenBalance(outToken?.token_id)

  if (!pool) {
    return null
  }

  return (
    <Modal isOpen onClose={onClose} isCentered size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Manage Pool</ModalHeader>
        <ModalCloseButton onClick={onClose} />
        <ModalBody>
          <Flex direction="column" gap={2}>
            <Text color="blue">{`#${pool.id} Creator: ${pool.creator}`}</Text>

            {pool.reversible && (
              <Box>
                <Flex direction="row" align="flex-end" gap={2} mb={2}>
                  <Text fontSize="2xl" lineHeight={1}>
                    {inToken?.symbol}
                  </Text>
                </Flex>
                <Flex gap={2} align="flex-end">
                  {inToken && (
                    <Image
                      src={inToken.icon || ''}
                      width={10}
                      height={10}
                      alt=""
                    />
                  )}
                  <Flex direction="column" flex={1} gap={1}>
                    <Flex justify="space-between">
                      <Text fontSize="sm">{`Pool balance: ${formatBalance(
                        pool.in_token_balance,
                        undefined,
                        inToken?.decimals
                      )}`}</Text>
                      <Text fontSize="sm">{`Balance: ${formatBalance(
                        inTokenBalance,
                        { withUnit: false },
                        inToken?.decimals
                      )}`}</Text>
                    </Flex>
                    <Input placeholder={inToken?.symbol} />
                  </Flex>
                  <Button colorScheme="blue" onClick={onDepositInToken}>
                    Deposit
                  </Button>
                </Flex>
              </Box>
            )}

            <Flex direction="row" align="flex-end" gap={2} mt={4}>
              <Text fontSize="2xl" lineHeight={1}>
                {outToken?.symbol}
              </Text>
            </Flex>
            <Flex gap={2} align="flex-end">
              {outToken && (
                <Image
                  src={outToken.icon || ''}
                  width={10}
                  height={10}
                  alt=""
                />
              )}
              <Flex direction="column" flex={1} gap={1}>
                <Flex justify="space-between">
                  <Text fontSize="sm">{`Pool balance: ${formatBalance(
                    pool.out_token_balance,
                    undefined,
                    outToken?.decimals
                  )}`}</Text>
                  <Text fontSize="sm">{`Balance:  ${formatBalance(
                    outTokenBlance,
                    { withUnit: false, decimals: outToken?.decimals }
                  )}`}</Text>
                </Flex>
                <Input placeholder={outToken?.symbol} />
              </Flex>
              <Button colorScheme="blue" onClick={onDepositOutToken}>
                Deposit
              </Button>
            </Flex>
          </Flex>
        </ModalBody>

        <ModalFooter gap={2}>
          <Button colorScheme="red">DELETE</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
