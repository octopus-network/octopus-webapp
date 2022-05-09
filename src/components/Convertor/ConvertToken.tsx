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
  IconButton,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react'
import { BN } from '@polkadot/util'
import Decimal from 'decimal.js'
import {
  useConvertorContract,
  useTokenBalance,
} from 'hooks/useConvertorContract'
import {
  COMPLEX_CALL_GAS,
  FT_MINIMUM_STORAGE_BALANCE,
  SIMPLE_CALL_GAS,
} from 'primitives'
import { useState } from 'react'
import { MdArrowDownward, MdSwapVert } from 'react-icons/md'
import { useGlobalStore } from 'stores'
import { ConversionPool, FungibleTokenMetadata } from 'types'
import { DecimalUtil } from 'utils'
import { isValidNumber } from 'utils/validate'
import { createTransaction, functionCall } from 'near-api-js/lib/transaction'
import { baseDecode } from 'borsh'
import { PublicKey } from 'near-api-js/lib/utils'

const TokenInput = ({
  value,
  onValueChange,
  token,
  liquidity,
  inputDisabled = false,
  autoFocus = false,
}: {
  value: string
  onValueChange: (value: string) => void
  token: FungibleTokenMetadata | undefined
  liquidity: string
  inputDisabled?: boolean
  autoFocus?: boolean
}) => {
  const tokenBlance = useTokenBalance(token?.token_id)
  const liq = DecimalUtil.fromString(liquidity, token?.decimals).toFixed(2)

  const balance = DecimalUtil.fromString(tokenBlance, token?.decimals).toFixed(
    2
  )
  const inputBg = useColorModeValue('#f5f7fa', 'whiteAlpha.100')

  return (
    <Flex direction="row" align="flex-end" gap={4}>
      <Flex direction="column" flex={1} gap={1}>
        <Flex justify="space-between">
          <Text fontSize="sm" className="octo-gray">{`Liquidity: ${liq}`}</Text>
          <Text
            fontSize="sm"
            className="octo-gray"
          >{`Balance: ${balance}`}</Text>
        </Flex>
        <Input
          placeholder="Amount"
          size="lg"
          bg={inputBg}
          value={value}
          disabled={inputDisabled}
          autoFocus={autoFocus}
          onFocus={() => onValueChange('')}
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
  const bg = useColorModeValue('white', '#15172c')

  const inToken = whitelist.find((t) => t.token_id === pool?.in_token)
  const outToken = whitelist.find((t) => t.token_id === pool?.out_token)

  const _inToken = isReversed ? outToken : inToken
  const _outToken = !isReversed ? outToken : inToken
  const inTokenBalanceRaw = useTokenBalance(_inToken?.token_id)
  const inTokenBalance = DecimalUtil.fromString(
    inTokenBalanceRaw,
    _inToken?.decimals
  ).toString()
  const outTokenBalanceRaw = useTokenBalance(_outToken?.token_id)
  const outTokenBalance = DecimalUtil.fromString(
    outTokenBalanceRaw,
    _inToken?.decimals
  ).toString()

  if (!pool) {
    return null
  }

  const isValid =
    isValidNumber(String(inTokenValue), inTokenBalance) &&
    isValidNumber(String(outTokenValue), outTokenBalance) &&
    isValidNumber(
      String(inTokenValue),
      DecimalUtil.fromString(
        pool?.in_token_balance!,
        _inToken?.decimals
      ).toString()
    ) &&
    isValidNumber(
      String(outTokenValue),
      DecimalUtil.fromString(
        pool?.out_token_balance,
        _outToken?.decimals
      ).toString()
    )

  const onTokenValueChange = (value: string, _isReversed: boolean) => {
    if (value.trim() !== '') {
      if (_isReversed) {
        setOutTokenValue(value)
        setInTokenValue(
          new Decimal(value)
            .mul(!isReversed ? pool.in_token_rate : pool.out_token_rate)
            .div(isReversed ? pool.in_token_rate : pool.out_token_rate)
            .toFixed(inToken?.decimals)
            .toString()
        )
      } else {
        setInTokenValue(value)
        setOutTokenValue(
          new Decimal(value)
            .mul(isReversed ? pool.in_token_rate : pool.out_token_rate)
            .div(!isReversed ? pool.in_token_rate : pool.out_token_rate)
            .toFixed(inToken?.decimals)
            .toString()
        )
      }
    } else {
      setOutTokenValue('')
      setInTokenValue('')
    }
  }

  const onConvert = async () => {
    try {
      const account = global.wallet?.account()
      if (!account) {
        throw new Error('No account')
      }
      const storageFee = await contract?.get_storage_fee_gap_of({
        account_id: global.accountId,
      })
      const actions = []

      if (String(storageFee) !== '0') {
        actions.push({
          receiverId: 'contract.convertor.testnet',
          actions: [
            functionCall(
              'storage_deposit',
              {
                account_id: account?.accountId,
              },
              new BN(SIMPLE_CALL_GAS),
              new BN(storageFee!)
            ),
          ],
        })
      }

      const receiveTokenId = !isReversed ? pool.out_token : pool.in_token
      const storageBalance = await account?.viewFunction(
        receiveTokenId,
        'storage_balance_of',
        { account_id: account.accountId }
      )

      if (!storageBalance || storageBalance === '0') {
        actions.push({
          receiverId: receiveTokenId,
          actions: [
            functionCall(
              'storage_deposit',
              {
                registration_only: true,
                account_id: account?.accountId,
              },
              new BN(SIMPLE_CALL_GAS),
              new BN(FT_MINIMUM_STORAGE_BALANCE!)
            ),
          ],
        })
      }

      const contractId = isReversed ? pool.out_token : pool.in_token
      const amount = inTokenValue
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

      actions.push({
        receiverId: contractId,
        actions: [
          functionCall(
            'ft_transfer_call',
            {
              receiver_id: 'contract.convertor.testnet',
              amount: _amount,
              msg: JSON.stringify({
                Convert: { convert_action: convertAction },
              }),
            },
            new BN(COMPLEX_CALL_GAS),
            new BN(1)
          ),
        ],
      })

      let localKey = await account?.connection.signer.getPublicKey(
        account.accountId,
        account.connection.networkId
      )

      const transactions = await Promise.all(
        actions.map(async (t) => {
          let accessKey = await account.accessKeyForTransaction(
            t.receiverId,
            t.actions,
            localKey
          )

          const block = await account?.connection.provider.block({
            finality: 'final',
          })
          const blockHash = baseDecode(block.header.hash)

          const publicKey = PublicKey.from(accessKey.public_key)
          const nonce = accessKey.access_key.nonce + 1

          return createTransaction(
            account?.accountId!,
            publicKey,
            t.receiverId,
            nonce,
            t.actions,
            blockHash
          )
        })
      )
      await account.walletConnection.requestSignTransactions({ transactions })
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
            onValueChange={(value: string) => onTokenValueChange(value, false)}
            token={isReversed ? outToken : inToken}
            liquidity={
              isReversed ? pool.out_token_balance : pool.in_token_balance
            }
          />
          <Flex align="center" justify="center" gap={4}>
            <IconButton
              aria-label="switch"
              isRound
              size="sm"
              borderWidth={3}
              borderColor={bg}
              transform="scale(1.4)"
              disabled={!pool.reversible}
              onClick={() => {
                setIsReversed(!isReversed)
                setInTokenValue('')
                setOutTokenValue('')
              }}
            >
              <Icon
                as={pool.reversible ? MdSwapVert : MdArrowDownward}
                boxSize={4}
              />
            </IconButton>
            <Text>
              {isReversed
                ? `${pool.out_token_rate} : ${pool.in_token_rate}`
                : `${pool.in_token_rate} : ${pool.out_token_rate}`}
            </Text>
          </Flex>
          <TokenInput
            value={String(outTokenValue)}
            onValueChange={(value: string) => onTokenValueChange(value, true)}
            token={!isReversed ? outToken : inToken}
            liquidity={
              !isReversed ? pool.out_token_balance : pool.in_token_balance
            }
          />
          <Button
            colorScheme="blue"
            onClick={onConvert}
            size="lg"
            disabled={!isValid}
          >
            Convert
          </Button>
        </Flex>
      </DrawerContent>
    </Drawer>
  )
}
