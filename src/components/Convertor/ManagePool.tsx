import {
  Flex,
  Button,
  Input,
  Text,
  Image,
  Box,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  Heading,
  CloseButton,
} from '@chakra-ui/react'
import { BN, formatBalance } from '@polkadot/util'
import Decimal from 'decimal.js'
import {
  useConvertorContract,
  useTokenBalance,
} from 'hooks/useConvertorContract'
import { SIMPLE_CALL_GAS } from 'primitives'
import { useState } from 'react'
import { useGlobalStore } from 'stores'
import { ConversionPool, FungibleTokenMetadata } from 'types'
import { DecimalUtil } from 'utils'
import { isValidNumber } from 'utils/validate'

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

  const inTokenBalanceRaw = useTokenBalance(inToken?.token_id)
  const outTokenBlance = useTokenBalance(outToken?.token_id)

  const [inTokenValue, setInTokenValue] = useState('')
  const [outTokenValue, setOutTokenValue] = useState('')

  const { global } = useGlobalStore()
  // const contract = useConvertorContract(global.wallet?.account() as any, 'contract.convertor.testnet')

  if (!pool) {
    return null
  }

  const onDepositToken = async (
    amount: string,
    token: FungibleTokenMetadata
  ) => {
    try {
      global.wallet?.account().functionCall({
        contractId: token.token_id!,
        methodName: 'ft_transfer_call',
        args: {
          receiver_id: 'contract.convertor.testnet',
          amount: DecimalUtil.toU64(
            new Decimal(amount),
            token.decimals
          ).toString(),
          msg: JSON.stringify({ AddLiquidity: { pool_id: pool.id } }),
        },
        gas: new BN(SIMPLE_CALL_GAS),
        attachedDeposit: new BN(1),
      })
    } catch (error) {
      console.error(error)
    }
  }

  const onWithdrawToken = async (
    amount: string,
    token: FungibleTokenMetadata
  ) => {
    try {
      global.wallet?.account().functionCall({
        contractId: 'contract.convertor.testnet',
        methodName: 'withdraw_token_in_pool',
        args: {
          pool_id: pool.id,
          token_id: token.token_id,
          amount: DecimalUtil.toU64(
            new Decimal(amount),
            token.decimals
          ).toString(),
        },
        gas: new BN(SIMPLE_CALL_GAS),
        attachedDeposit: new BN(1),
      })
    } catch (error) {}
  }

  const inTokenLiq = DecimalUtil.fromString(
    pool.in_token_balance,
    inToken?.decimals
  ).toString()
  const inTokenBalance = DecimalUtil.fromString(
    inTokenBalanceRaw,
    inToken?.decimals
  ).toString()
  const outTokenLiq = DecimalUtil.fromString(
    pool.out_token_balance,
    outToken?.decimals
  ).toString()
  const outTokenBalance = DecimalUtil.fromString(
    outTokenBlance,
    outToken?.decimals
  ).toString()

  return (
    <Drawer placement="right" isOpen onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerHeader borderBottomWidth="0">
          <Flex justifyContent="space-between" alignItems="center">
            <Heading fontSize="lg">Manage Pool</Heading>
            <CloseButton onClick={onClose} />
          </Flex>
        </DrawerHeader>
        <Flex direction="column" gap={2} pl={6} pr={6}>
          <Text color="#008cd5">{`#${pool.id} Owner: ${pool.creator}`}</Text>

          <Box>
            <Flex direction="row" align="center" gap={2} mb={2}>
              {inToken && (
                <Image src={inToken.icon || ''} width={8} height={8} alt="" />
              )}
              <Text fontSize="2xl" lineHeight={1}>
                {inToken?.symbol}
              </Text>
            </Flex>
            <Flex direction="column" gap={2}>
              <Flex direction="column" flex={1} gap={1}>
                <Flex justify="space-between">
                  <Text fontSize="sm">{`Pool liquidity: ${inTokenLiq}`}</Text>
                  <Text fontSize="sm">{`Your balance: ${inTokenBalance}`}</Text>
                </Flex>
                <Input
                  placeholder="Please input deposit amount"
                  value={inTokenValue}
                  onChange={(e) => setInTokenValue(e.target.value)}
                  type="number"
                />
              </Flex>
              <Flex justify="center" gap={2}>
                <Button
                  colorScheme="blue"
                  width={150}
                  disabled={!isValidNumber(inTokenValue, inTokenLiq)}
                  onClick={() => onWithdrawToken(inTokenValue, inToken!)}
                >
                  Withdraw
                </Button>

                {pool.reversible && (
                  <Button
                    colorScheme="blue"
                    width={150}
                    disabled={!isValidNumber(inTokenValue, inTokenBalance)}
                    onClick={() => onDepositToken(inTokenValue, inToken!)}
                  >
                    Deposit
                  </Button>
                )}
              </Flex>
            </Flex>
          </Box>

          <Flex direction="row" align="center" gap={2} mt={4}>
            {outToken && (
              <Image src={outToken.icon || ''} width={8} height={8} alt="" />
            )}

            <Text fontSize="2xl" lineHeight={1}>
              {outToken?.symbol}
            </Text>
          </Flex>
          <Flex direction="column" gap={4}>
            <Flex direction="column" flex={1} gap={1}>
              <Flex justify="space-between">
                <Text fontSize="sm">{`Pool liquidity: ${outTokenLiq}`}</Text>
                <Text fontSize="sm">{`Your balance:  ${outTokenBalance}`}</Text>
              </Flex>
              <Input
                placeholder="Please input deposit amount"
                value={outTokenValue}
                onChange={(e) => setOutTokenValue(e.target.value)}
                type="number"
              />
            </Flex>
            <Flex justify="center" gap={2}>
              <Button
                colorScheme="blue"
                width={150}
                disabled={!isValidNumber(outTokenValue, outTokenLiq)}
                onClick={() => onWithdrawToken(outTokenValue, outToken!)}
              >
                Withdraw
              </Button>
              <Button
                colorScheme="blue"
                width={150}
                disabled={!isValidNumber(outTokenValue, outTokenBalance)}
                onClick={() => onDepositToken(outTokenValue, outToken!)}
              >
                Deposit
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </DrawerContent>
    </Drawer>
  )
}
