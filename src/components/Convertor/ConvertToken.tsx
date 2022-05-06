import {
  Flex,
  Button,
  Input,
  Text,
  Image,
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
import { COMPLEX_CALL_GAS } from 'primitives'
import { useState } from 'react'
import { FiRepeat } from 'react-icons/fi'
import { useGlobalStore } from 'stores'
import { ConversionPool, FungibleTokenMetadata } from 'types'
import { DecimalUtil } from 'utils'
import { isValidNumber } from 'utils/validate'

const TokenInput = ({
  value,
  onValueChange,
  token,
  liquidity,
  inputDisabled = false,
}: {
  value: string
  onValueChange: (value: string) => void
  token: FungibleTokenMetadata | undefined
  liquidity: string
  inputDisabled?: boolean
}) => {
  const tokenBlance = useTokenBalance(token?.token_id)
  const liq = DecimalUtil.fromString(liquidity, token?.decimals)

  const balance = DecimalUtil.fromString(tokenBlance, token?.decimals)

  return (
    <Flex direction="row" align="flex-end" gap={4}>
      <Flex direction="column" flex={1} gap={1}>
        <Flex justify="space-between">
          <Text>{`Liquidity: ${liq}`}</Text>
          <Text>{`Balance: ${balance}`}</Text>
        </Flex>
        <Input
          placeholder="Amount"
          size="lg"
          value={value}
          disabled={inputDisabled}
          onChange={(e) => onValueChange(e.target.value)}
        />
      </Flex>
      <Flex direction="row" align="center" gap={2} p={2} pr={4}>
        <Text fontWeight={600}>{token?.symbol}</Text>
        <Image src={token?.icon || ''} width={10} height={10} alt="" />
      </Flex>
    </Flex>
  )
}

export default function ConvertToken({
  pool,
  whitelist,
  onClose,
}: {
  pool: ConversionPool | null
  whitelist: FungibleTokenMetadata[]
  onClose: () => void
}) {
  const [inTokenValue, setInTokenValue] = useState<string | number>('')
  const [outTokenValue, setOutTokenValue] = useState<string | number>('')
  const [isReversed, setIsReversed] = useState(false)
  const { global } = useGlobalStore()

  const contract = useConvertorContract(
    global.wallet?.account() as any,
    'contract.convertor.testnet'
  )

  if (!pool) {
    return null
  }

  const inToken = whitelist.find((t) => t.token_id === pool.in_token)
  const outToken = whitelist.find((t) => t.token_id === pool.out_token)

  const onTokenValueChange = (value: string) => {
    setInTokenValue(value)

    if (value.trim() !== '') {
      setOutTokenValue(
        new Decimal(value)
          .mul(isReversed ? pool.in_token_rate : pool.out_token_rate)
          .div(!isReversed ? pool.in_token_rate : pool.out_token_rate)
          .toFixed(inToken?.decimals)
          .toString()
      )
    } else {
      setOutTokenValue('')
    }
  }

  console.log(pool)

  const onConvert = async () => {
    try {
      // const storageFee = await contract?.get_storage_fee_gap_of({
      //   account_id: global.accountId,
      // })
      // await global.wallet?.account().functionCall({
      //   contractId: 'contract.convertor.testnet',
      //   methodName: 'storage_deposit',
      //   args: {
      //     account_id: global.accountId,
      //     registration_only: true,
      //   },
      //   gas: new BN(SIMPLE_CALL_GAS),
      //   attachedDeposit: new BN(storageFee!),
      // })
      const contractId = isReversed ? pool.out_token : pool.in_token
      const amount = isReversed ? outTokenValue : inTokenValue
      const token = whitelist.find((t) => t.token_id === contractId)
      const _amount = DecimalUtil.toU64(
        new Decimal(amount),
        token?.decimals
      ).toString()

      const convertAction = {
        input_token_amount: _amount,
        input_token_id: contractId,
        pool_id: pool.id,
      }

      global.wallet?.account().functionCall({
        contractId,
        methodName: 'ft_transfer_call',
        args: {
          receiver_id: 'contract.convertor.testnet',
          amount: _amount,
          msg: JSON.stringify({ Convert: { convert_action: convertAction } }),
        },
        gas: new BN(COMPLEX_CALL_GAS),
        attachedDeposit: new BN(1),
      })
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Drawer placement="right" isOpen onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerHeader borderBottomWidth="0">
          <Flex justifyContent="space-between" alignItems="center">
            <Heading fontSize="lg">Convert</Heading>
            <CloseButton onClick={onClose} />
          </Flex>
        </DrawerHeader>

        <Flex direction="column" gap={5} pl={6} pr={6}>
          <TokenInput
            value={String(inTokenValue)}
            onValueChange={onTokenValueChange}
            token={isReversed ? outToken : inToken}
            liquidity={
              isReversed ? pool.out_token_balance : pool.in_token_balance
            }
          />
          {pool.reversible && (
            <Flex align="center" justify="center">
              <Button
                colorScheme="blue"
                onClick={() => {
                  setIsReversed(!isReversed)
                  setInTokenValue('')
                  setOutTokenValue('')
                }}
                borderRadius={50}
              >
                <FiRepeat />
              </Button>
            </Flex>
          )}
          <TokenInput
            value={String(outTokenValue)}
            onValueChange={onTokenValueChange}
            token={!isReversed ? outToken : inToken}
            inputDisabled
            liquidity={
              !isReversed ? pool.out_token_balance : pool.in_token_balance
            }
          />
          <Button colorScheme="blue" onClick={onConvert}>
            Convert
          </Button>
        </Flex>
      </DrawerContent>
    </Drawer>
  )
}
