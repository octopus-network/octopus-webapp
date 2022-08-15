import React, { useMemo, useEffect, useState } from "react"

import {
  Flex,
  Heading,
  Text,
  HStack,
  Button,
  Divider,
  useBoolean,
  Table,
  Thead,
  Tbody,
  VStack,
  Tr,
  Th,
  Td,
  Tag,
  Box,
  SimpleGrid,
  useColorModeValue,
} from "@chakra-ui/react"

import {
  AppchainInfoWithAnchorStatus,
  RewardHistory,
  AnchorContract,
  WrappedAppchainToken,
} from "types"

import { BaseModal, Empty } from "components"
import { DecimalUtil, ZERO_DECIMAL } from "utils"
import { WarningTwoIcon } from "@chakra-ui/icons"

import { SIMPLE_CALL_GAS, COMPLEX_CALL_GAS } from "primitives"
import { useWalletSelector } from "components/WalletSelectorContextProvider"
import { Toast } from "components/common/toast"
import { useTokenContract } from "hooks/useTokenContract"

type RewardsModalProps = {
  rewards?: RewardHistory[]
  appchain?: AppchainInfoWithAnchorStatus
  anchor?: AnchorContract
  validatorId?: string
  isOpen: boolean
  onClose: () => void
}

export const RewardsModal: React.FC<RewardsModalProps> = ({
  isOpen,
  onClose,
  rewards,
  appchain,
  anchor,
  validatorId,
}) => {
  const bg = useColorModeValue("#f6f7fa", "#15172c")

  const { accountId, selector } = useWalletSelector()

  const [isClaiming, setIsClaiming] = useBoolean(false)
  const [isClaimRewardsPaused, setIsClaimRewardsPaused] = useState(false)
  const [isDepositingStorage, setIsDepositingStorage] = useBoolean(false)
  const [needDepositStorage, setNeedDepositStorage] = useBoolean(false)
  const [wrappedAppchainToken, setWrappedAppchainToken] =
    useState<WrappedAppchainToken>()

  const [
    wrappedAppchainTokenStorageBalance,
    setWrappedAppchainTokenStorageBalance,
  ] = useState(ZERO_DECIMAL)

  const tokenContract = useTokenContract(wrappedAppchainToken?.contract_account)

  useEffect(() => {
    if (!isOpen) {
      setNeedDepositStorage.off()
    }
  }, [isOpen])

  useEffect(() => {
    if (!anchor) {
      setIsClaimRewardsPaused(false)
      return
    }
    anchor.get_anchor_status().then(({ rewards_withdrawal_is_paused }) => {
      setIsClaimRewardsPaused(rewards_withdrawal_is_paused as boolean)
    })
    anchor.get_wrapped_appchain_token().then((wrappedToken) => {
      setWrappedAppchainToken(wrappedToken)
    })
  }, [anchor])

  useEffect(() => {
    if (!tokenContract || !accountId) {
      return
    }
    tokenContract
      .storage_balance_of({ account_id: accountId })
      .then((storage) => {
        setWrappedAppchainTokenStorageBalance(
          storage?.total
            ? DecimalUtil.fromString(storage.total, 24)
            : ZERO_DECIMAL
        )
      })
  }, [tokenContract, accountId])

  const unwithdrawnRewards = useMemo(() => {
    if (!rewards?.length) {
      return ZERO_DECIMAL
    }

    return rewards.reduce(
      (total, next) =>
        total.plus(
          next.expired
            ? ZERO_DECIMAL
            : DecimalUtil.fromString(
                next.unwithdrawn_reward,
                appchain?.appchain_metadata?.fungible_token_metadata.decimals
              )
        ),
      ZERO_DECIMAL
    )
  }, [appchain?.appchain_metadata?.fungible_token_metadata.decimals, rewards])

  const totalRewards = useMemo(
    () =>
      rewards?.length
        ? rewards?.reduce(
            (total, next) =>
              total.plus(
                DecimalUtil.fromString(
                  next.total_reward,
                  appchain?.appchain_metadata?.fungible_token_metadata?.decimals
                )
              ),
            ZERO_DECIMAL
          )
        : ZERO_DECIMAL,
    [appchain?.appchain_metadata?.fungible_token_metadata?.decimals, rewards]
  )

  const onClaimRewards = async () => {
    if (!anchor) {
      return
    }

    if (wrappedAppchainTokenStorageBalance.lte(ZERO_DECIMAL)) {
      setNeedDepositStorage.on()
      return
    }
    try {
      const wallet = await selector.wallet()
      wallet.signAndSendTransaction({
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

      setIsClaiming.off()
    } catch (error) {
      Toast.error(error)
      setIsClaiming.off()
    }
  }

  const onDepositStorage = async () => {
    try {
      setIsDepositingStorage.on()

      const wallet = await selector.wallet()
      await wallet.signAndSendTransaction({
        signerId: wallet.id,
        receiverId: wrappedAppchainToken?.contract_account,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "storage_deposit",
              args: { account_id: accountId },
              gas: SIMPLE_CALL_GAS,
              deposit: "1250000000000000000000",
            },
          },
        ],
      })
      setIsDepositingStorage.off()
    } catch (error) {
      setIsDepositingStorage.off()
      Toast.error(error)
    }
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxW="520px"
      title={needDepositStorage ? "Tips" : "Rewards"}
    >
      {needDepositStorage ? (
        <Box p={4} borderRadius="lg">
          <Heading fontSize="lg" lineHeight="35px">
            It seems that you haven't setup your account on wrapped{" "}
            {appchain?.appchain_metadata?.fungible_token_metadata.symbol} token
            yet.
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={6}>
            <Button onClick={setNeedDepositStorage.off}>Maybe Later</Button>
            <Button
              colorScheme="octo-blue"
              onClick={onDepositStorage}
              isDisabled={isDepositingStorage}
              isLoading={isDepositingStorage}
            >
              Setup Right Now!
            </Button>
          </SimpleGrid>
        </Box>
      ) : (
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
                    {
                      appchain?.appchain_metadata?.fungible_token_metadata
                        .symbol
                    }
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
                      You can only claim the rewards distributed within the last
                      84 eras(days).
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
      )}
    </BaseModal>
  )
}
