import {
  Flex,
  Button,
  Input,
  Text,
  Box,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  Heading,
  CloseButton,
  useColorModeValue,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Link,
  Avatar,
} from "@chakra-ui/react"
import Decimal from "decimal.js"
import {
  useConvertorContract,
  useTokenBalance,
} from "hooks/useConvertorContract"
import { SIMPLE_CALL_GAS } from "primitives"
import { useState } from "react"
import { AccountId, ConversionPool, FungibleTokenMetadata } from "types"
import { DecimalUtil } from "utils"
import { isValidNumber } from "utils/validate"
import NEP141 from "assets/icons/nep141-token.png"
import { useWalletSelector } from "components/WalletSelectorContextProvider"
import { Transaction } from "@near-wallet-selector/core"
import { Toast } from "components/common/toast"

function TokenInput({
  token,
  liquidity,
  onSubmit,
  isWithdraw = false,
}: {
  token: FungibleTokenMetadata | undefined
  liquidity: string
  onSubmit: (value: string, token: FungibleTokenMetadata) => void
  isWithdraw?: boolean
}) {
  const [value, setValue] = useState("")
  const balance = useTokenBalance(token?.token_id)
  const inputBg = useColorModeValue("#f5f7fa", "whiteAlpha.100")
  const tokenLiq = DecimalUtil.fromString(liquidity, token?.decimals)
    .toFixed(2)
    .toString()
  const tokenBalance = DecimalUtil.fromString(balance, token?.decimals)
    .toFixed(2)
    .toString()
  return (
    <Box mb={6}>
      <Flex direction="row" align="center" gap={2} mb={2}>
        {token && <Avatar src={token.icon || NEP141} width={10} height={10} />}
        <Text fontSize="2xl" lineHeight={1}>
          {token?.symbol}
        </Text>
      </Flex>
      <Flex direction="column" gap={2}>
        <Flex direction="column" flex={1} gap={1}>
          <Flex justify="space-between">
            <Text
              fontSize="sm"
              className="octo-gray"
            >{`Pool liquidity: ${tokenLiq}`}</Text>
            <Text
              fontSize="sm"
              className="octo-gray"
            >{`Your balance: ${tokenBalance}`}</Text>
          </Flex>
          <Input
            placeholder="Please input deposit amount"
            value={value}
            autoFocus
            onChange={(e) => setValue(e.target.value)}
            type="number"
            bg={inputBg}
          />
        </Flex>
        <Flex justify="center" gap={4}>
          <Button
            flex={1}
            variant="octo-linear"
            disabled={
              !isValidNumber(value, isWithdraw ? liquidity : tokenBalance)
            }
            onClick={() => onSubmit(value, token!)}
          >
            {isWithdraw ? "Withdraw" : "Deposit"}
          </Button>
        </Flex>
      </Flex>
    </Box>
  )
}

export default function ManagePool({
  pool,
  whitelist,
  onClose,
  contractId,
}: {
  pool: ConversionPool | null
  whitelist: FungibleTokenMetadata[]
  onClose: () => void
  contractId: AccountId
}) {
  const inToken = whitelist.find((t) => t.token_id === pool?.in_token)
  const outToken = whitelist.find((t) => t.token_id === pool?.out_token)

  const { accountId, selector, networkConfig, nearAccount } =
    useWalletSelector()

  const contract = useConvertorContract(nearAccount!, contractId)

  if (!pool) {
    return null
  }

  const onDepositToken = async (
    amount: string,
    token: FungibleTokenMetadata
  ) => {
    try {
      const wallet = await selector.wallet()
      await wallet.signAndSendTransaction({
        signerId: accountId,
        receiverId: token.token_id,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "ft_transfer_call",
              args: {
                receiver_id: contractId,
                amount: DecimalUtil.toU64(
                  new Decimal(amount),
                  token.decimals
                ).toString(),
                msg: JSON.stringify({ AddLiquidity: { pool_id: pool.id } }),
              },
              gas: SIMPLE_CALL_GAS,
              deposit: "1",
            },
          },
        ],
      })
      onClose()
      Toast.success("Deposited")
    } catch (error) {
      Toast.error(error)
    }
  }

  const onWithdrawToken = async (
    amount: string,
    token: FungibleTokenMetadata
  ) => {
    try {
      const wallet = await selector.wallet()
      await wallet.signAndSendTransaction({
        signerId: accountId,
        receiverId: contractId,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "withdraw_token_in_pool",
              args: {
                pool_id: pool.id,
                token_id: token.token_id,
                amount: DecimalUtil.toU64(
                  new Decimal(amount),
                  token.decimals
                ).toString(),
              },
              gas: SIMPLE_CALL_GAS,
              deposit: "1",
            },
          },
        ],
      })
      onClose()
      Toast.success("Withdrawed")
    } catch (error) {
      Toast.error(error)
    }
  }

  const onDeletePool = async () => {
    try {
      if (!accountId) {
        throw new Error("No account")
      }

      const wallet = await selector.wallet()

      const tx: Transaction = {
        signerId: accountId,
        receiverId: contractId,
        actions: [],
      }
      const storageFee = await contract?.get_storage_fee_gap_of({
        account_id: accountId!,
      })

      if (String(storageFee) !== "0") {
        tx.actions.push({
          type: "FunctionCall",
          params: {
            methodName: "storage_deposit",
            args: {
              account_id: accountId,
            },
            gas: SIMPLE_CALL_GAS,
            deposit: String(storageFee),
          },
        })
      }
      if (pool.in_token_balance !== "0") {
        tx.actions.push({
          type: "FunctionCall",
          params: {
            methodName: "withdraw_token_in_pool",
            args: {
              pool_id: pool.id,
              token_id: pool.in_token,
              amount: pool.in_token_balance,
            },
            gas: SIMPLE_CALL_GAS,
            deposit: String(1),
          },
        })
      }

      if (pool.out_token_balance !== "0") {
        tx.actions.push({
          type: "FunctionCall",
          params: {
            methodName: "withdraw_token_in_pool",
            args: {
              pool_id: pool.id,
              token_id: pool.out_token,
              amount: pool.out_token_balance,
            },
            gas: SIMPLE_CALL_GAS,
            deposit: String(1),
          },
        })
      }

      tx.actions.push({
        type: "FunctionCall",
        params: {
          methodName: "delete_pool",
          args: { pool_id: pool.id },
          gas: SIMPLE_CALL_GAS,
          deposit: String(1),
        },
      })

      await wallet.signAndSendTransaction(tx)
      onClose()
      Toast.success("Deleted")
    } catch (error) {
      Toast.error(error)
    }
  }

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
          <Text color="#008cd5">
            {`#${pool.id} Owner: `}
            <Link
              href={`${networkConfig?.near.explorerUrl}/accounts/${pool.creator}`}
            >
              {pool.creator}
            </Link>
          </Text>

          <Tabs>
            <TabList>
              <Tab>Deposit</Tab>
              <Tab>Withdraw</Tab>
            </TabList>
            <TabPanels>
              <TabPanel gap={4}>
                {pool.reversible && (
                  <TokenInput
                    token={inToken}
                    onSubmit={onDepositToken}
                    liquidity={pool.in_token_balance}
                  />
                )}
                <TokenInput
                  token={outToken}
                  onSubmit={onDepositToken}
                  liquidity={pool.out_token_balance}
                />
              </TabPanel>
              <TabPanel gap={4}>
                <TokenInput
                  token={inToken}
                  onSubmit={onWithdrawToken}
                  liquidity={pool.in_token_balance}
                  isWithdraw
                />
                <TokenInput
                  token={outToken}
                  onSubmit={onWithdrawToken}
                  liquidity={pool.out_token_balance}
                  isWithdraw
                />
              </TabPanel>
            </TabPanels>
          </Tabs>

          <Flex mt={10} direction="column" gap={2}>
            <Text fontSize="xl">Danger zone</Text>
            <Flex>
              <Button onClick={onDeletePool}>
                <Text color="red">DELETE</Text>
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </DrawerContent>
    </Drawer>
  )
}
