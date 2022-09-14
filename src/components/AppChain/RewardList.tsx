import { WarningTwoIcon } from "@chakra-ui/icons"
import {
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  HStack,
  Table,
  Tag,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useBoolean,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react"
import { Transaction } from "@near-wallet-selector/core"
import { Toast } from "components/common/toast"
import { Empty } from "components/Empty"
import { useWalletSelector } from "components/WalletSelectorContextProvider"
import Decimal from "decimal.js"
import { useTokenContract } from "hooks/useTokenContract"
import { providers } from "near-api-js"
import { CodeResult } from "near-api-js/lib/providers/provider"
import { COMPLEX_CALL_GAS, SIMPLE_CALL_GAS } from "primitives"
import { useEffect, useMemo, useState } from "react"
import {
  AnchorContract,
  AppchainInfoWithAnchorStatus,
  RewardHistory,
  WrappedAppchainToken,
} from "types"
import { DecimalUtil, ZERO_DECIMAL } from "utils"
import { calcUnwithdrawnReward } from "utils/appchain"

export default function RewardList({
  rewards,
  appchain,
  anchor,
  validatorId,
}: {
  rewards: RewardHistory[]
  appchain?: AppchainInfoWithAnchorStatus
  anchor?: AnchorContract
  validatorId?: string
}) {
  const bg = useColorModeValue("#f6f7fa", "#15172c")

  const { accountId, selector } = useWalletSelector()

  const [isClaiming, setIsClaiming] = useBoolean(false)
  const [isClaimRewardsPaused, setIsClaimRewardsPaused] = useBoolean(false)
  const [wrappedAppchainToken, setWrappedAppchainToken] =
    useState<WrappedAppchainToken>()

  const tokenContract = useTokenContract(wrappedAppchainToken?.contract_account)

  useEffect(() => {
    if (!anchor) {
      setIsClaimRewardsPaused.off()
      return
    }
    anchor.get_anchor_status().then(({ rewards_withdrawal_is_paused }) => {
      rewards_withdrawal_is_paused && setIsClaimRewardsPaused.on()
    })
    anchor.get_wrapped_appchain_token().then((wrappedToken) => {
      setWrappedAppchainToken(wrappedToken)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor])

  const decimals =
    appchain?.appchain_metadata?.fungible_token_metadata?.decimals

  const unwithdrawnRewards = useMemo(() => {
    return calcUnwithdrawnReward(rewards, decimals)
  }, [decimals, rewards])

  const totalRewards = useMemo(
    () =>
      rewards?.length
        ? rewards?.reduce(
            (total, next) =>
              total.plus(DecimalUtil.fromString(next.total_reward, decimals)),
            ZERO_DECIMAL
          )
        : ZERO_DECIMAL,
    [decimals, rewards]
  )

  const onClaimRewards = async () => {
    if (!anchor || !tokenContract || !accountId) {
      return
    }

    try {
      const storageBalance = await tokenContract.storage_balance_of({
        account_id: accountId,
      })
      const provider = new providers.JsonRpcProvider({
        url: selector.options.network.nodeUrl,
      })
      const res = await provider.query<CodeResult>({
        request_type: "call_function",
        account_id: tokenContract?.contractId,
        method_name: "storage_balance_bounds",
        args_base64: "",
        finality: "optimistic",
      })
      const storageBounds = JSON.parse(Buffer.from(res.result).toString())
      const txs: Transaction[] = []
      if (
        !storageBalance ||
        new Decimal(storageBalance?.total).lessThan(storageBounds.min)
      ) {
        txs.push({
          signerId: accountId,
          receiverId: wrappedAppchainToken?.contract_account!,
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: "storage_deposit",
                args: { account_id: accountId },
                gas: SIMPLE_CALL_GAS,
                deposit: storageBounds.min,
              },
            },
          ],
        })
      }

      const wallet = await selector.wallet()

      txs.push({
        signerId: accountId,
        receiverId: anchor.contractId,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: !!validatorId
                ? "withdraw_delegator_rewards"
                : "withdraw_validator_rewards",
              args: !!validatorId
                ? {
                    validator_id: validatorId,
                    delegator_id: accountId || "",
                  }
                : { validator_id: accountId },
              gas: COMPLEX_CALL_GAS,
              deposit: "0",
            },
          },
        ],
      })
      await wallet.signAndSendTransactions({
        transactions: txs,
      })

      setIsClaiming.off()
    } catch (error) {
      Toast.error(error)
      setIsClaiming.off()
    }
  }

  return (
    <>
      <Box p={4} bg={bg} borderRadius="lg">
        <Flex justifyContent="space-between" alignItems="center">
          <Text variant="gray">Total Rewards</Text>
          <Heading fontSize="md">
            {DecimalUtil.beautify(totalRewards)}{" "}
            {appchain?.appchain_metadata?.fungible_token_metadata.symbol}
          </Heading>
        </Flex>
        <Flex justifyContent="space-between" alignItems="flex-start" mt={3}>
          <Text variant="gray">Unclaimed Rewards</Text>
          <VStack spacing={0} alignItems="flex-end">
            <HStack>
              <Heading fontSize="md">
                {DecimalUtil.beautify(unwithdrawnRewards)}{" "}
                {appchain?.appchain_metadata?.fungible_token_metadata.symbol}
              </Heading>
              <Button
                colorScheme="octo-blue"
                size="sm"
                onClick={onClaimRewards}
                isLoading={isClaiming}
                isDisabled={
                  unwithdrawnRewards.lte(ZERO_DECIMAL) ||
                  isClaiming ||
                  isClaimRewardsPaused
                }
              >
                {isClaimRewardsPaused ? "Claim Paused" : "Claim"}
              </Button>
            </HStack>
          </VStack>
        </Flex>
        {unwithdrawnRewards.gt(ZERO_DECIMAL) ? (
          <>
            <Divider mt={3} mb={3} />
            <Flex>
              <HStack color="red">
                <WarningTwoIcon boxSize={3} />
                <Text fontSize="sm">
                  You can only claim the rewards distributed within the last 84
                  eras(days).
                </Text>
              </HStack>
            </Flex>
          </>
        ) : null}
      </Box>
      {rewards?.length ? (
        <Box maxH="40vh" overflow="scroll" mt={3}>
          <Table>
            <Thead>
              <Tr>
                <Th>Day</Th>
                <Th isNumeric>Reward</Th>
                <Th isNumeric>Unclaimed</Th>
              </Tr>
            </Thead>
            <Tbody>
              {rewards?.map((r, idx) => (
                <Tr key={`tr-${idx}`}>
                  <Td>{r.era_number}</Td>
                  <Td isNumeric>
                    {DecimalUtil.beautify(
                      DecimalUtil.fromString(
                        r.total_reward,
                        appchain?.appchain_metadata?.fungible_token_metadata
                          .decimals
                      )
                    )}
                  </Td>
                  <Td isNumeric>
                    {DecimalUtil.beautify(
                      DecimalUtil.fromString(
                        r.unwithdrawn_reward,
                        appchain?.appchain_metadata?.fungible_token_metadata
                          .decimals
                      )
                    )}
                    {DecimalUtil.fromString(r.unwithdrawn_reward).gt(
                      ZERO_DECIMAL
                    ) && r.expired ? (
                      <Tag
                        size="sm"
                        colorScheme="red"
                        mr={-2}
                        transform="scale(.8)"
                      >
                        Expired
                      </Tag>
                    ) : null}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      ) : (
        <Empty message="No Rewards" />
      )}
    </>
  )
}
