import React, { useMemo, useState, useEffect } from "react"
import useSWR from "swr"
import dayjs from "dayjs"

import {
  Box,
  Image,
  Heading,
  SimpleGrid,
  Text,
  HStack,
  Center,
  VStack,
  Button,
  Icon,
  Flex,
  useBoolean,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react"

import {
  AnchorContract,
  RewardHistory,
  AppchainInfoWithAnchorStatus,
  UnbondedHistory,
  StakingHistory,
  Validator,
} from "types"

import { OCT_TOKEN_DECIMALS } from "primitives"

import { AiOutlineMenu } from "react-icons/ai"
import { BsThreeDots, BsCheckCircle } from "react-icons/bs"
import { AddIcon, MinusIcon } from "@chakra-ui/icons"

import empty from "assets/empty.png"

import { StakingHistoryModal } from "./StakingHistoryModal"
import { RewardsModal } from "../RewardsModal"
import { StakesModal } from "./StakesModal"
import { StakingPopover } from "../StakingPopover"

import { DecimalUtil, ZERO_DECIMAL } from "utils"
import { useWalletSelector } from "components/WalletSelectorContextProvider"

type MyStakingProps = {
  appchain?: AppchainInfoWithAnchorStatus
  anchor?: AnchorContract
  validator?: Validator
}

export const MyStaking: React.FC<MyStakingProps> = ({
  appchain,
  anchor,
  validator,
}) => {
  const isUnbonding = !!(validator && validator?.is_unbonding)
  const isValidator = !!(validator && !validator?.is_unbonding)

  const [rewardsModalOpen, setRewardsModalOpen] = useBoolean(false)
  const [stakesModalOpen, setStakesModalOpen] = useBoolean(false)
  const [stakingHistoryModalOpen, setStakingHistoryModalOpen] =
    useBoolean(false)

  const { accountId } = useWalletSelector()
  const [deposit, setDeposit] = useState(ZERO_DECIMAL)

  const [unbonedStakes, setUnbondedStakes] = useState<UnbondedHistory[]>()
  const [stakingHistories, setStakingHistories] = useState<StakingHistory[]>()

  const { data: rewards } = useSWR<RewardHistory[]>(
    appchain?.anchor_status && accountId
      ? `rewards/${accountId}/${appchain.appchain_id}/${appchain?.anchor_status?.index_range_of_validator_set_history?.end_index}`
      : null
  )

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
  }, [rewards])

  const withdrawableStakes = useMemo(() => {
    if (!unbonedStakes?.length) {
      return ZERO_DECIMAL
    }

    return unbonedStakes.reduce(
      (total, next) =>
        total.plus(
          dayjs(Math.floor((next.unlock_time as any) / 1e6)).diff() > 0
            ? 0
            : DecimalUtil.fromString(next.amount, OCT_TOKEN_DECIMALS)
        ),
      ZERO_DECIMAL
    )
  }, [unbonedStakes])

  useEffect(() => {
    if (!anchor || !accountId) {
      return
    }

    Promise.all([
      anchor.get_validator_deposit_of({ validator_id: accountId }),
      anchor.get_unbonded_stakes_of({ account_id: accountId }),
      anchor.get_user_staking_histories_of({ account_id: accountId }),
    ]).then(([deposit, stakes, histories]) => {
      setDeposit(DecimalUtil.fromString(deposit, OCT_TOKEN_DECIMALS))
      setUnbondedStakes(stakes)
      setStakingHistories(histories)
    })
  }, [anchor, accountId])

  return (
    <>
      <Box position="relative" borderBottomRadius="lg">
        <Box position="relative" zIndex={1}>
          <Flex justifyContent="space-between" alignItems="center">
            <Heading fontSize="lg" color="white">
              My Staking
            </Heading>
            <HStack spacing={0}>
              <Box position="relative">
                <Button
                  size="sm"
                  variant="whiteAlphaGhost"
                  onClick={setRewardsModalOpen.on}
                >
                  Rewards
                </Button>
                {unwithdrawnRewards.gt(ZERO_DECIMAL) ? (
                  <Box
                    boxSize={2}
                    borderRadius="full"
                    bg="red"
                    position="absolute"
                    right="2px"
                    top="2px"
                  />
                ) : null}
              </Box>
              <Menu>
                <MenuButton
                  as={Button}
                  size="sm"
                  variant="whiteAlphaGhost"
                  position="relative"
                >
                  <Icon as={BsThreeDots} boxSize={5} />
                  {withdrawableStakes?.gt(ZERO_DECIMAL) ? (
                    <Box
                      position="absolute"
                      top="0px"
                      right="0px"
                      boxSize={2}
                      bg="red"
                      borderRadius="full"
                    />
                  ) : null}
                </MenuButton>
                <MenuList>
                  <MenuItem position="relative" onClick={setStakesModalOpen.on}>
                    <Icon as={BsCheckCircle} mr={2} boxSize={4} /> Withdraw
                    Stakes
                    {withdrawableStakes?.gt(ZERO_DECIMAL) ? (
                      <Box
                        position="absolute"
                        top="10px"
                        right="10px"
                        boxSize={2}
                        bg="red"
                        borderRadius="full"
                      />
                    ) : null}
                  </MenuItem>
                  <MenuItem onClick={setStakingHistoryModalOpen.on}>
                    <Icon as={AiOutlineMenu} mr={2} boxSize={4} /> Staking
                    History
                  </MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          </Flex>
          <VStack p={6} spacing={1}>
            <Heading fontSize="3xl" color="white">
              {DecimalUtil.beautify(deposit)}
            </Heading>
            <Text color="whiteAlpha.800">You Staked (OCT)</Text>
          </VStack>
          {isValidator && (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <StakingPopover
                trigger={
                  <Button variant="whiteAlpha">
                    <Icon as={MinusIcon} mr={2} boxSize={3} /> Decrease
                  </Button>
                }
                deposited={deposit}
                type="decrease"
                anchor={anchor}
                helper={`Your decreased stake will be claimable after 21 days`}
                appchain={appchain}
                validator={validator}
              />

              <StakingPopover
                trigger={
                  <Button variant="white">
                    <Icon as={AddIcon} mr={2} boxSize={3} />
                    Increase
                  </Button>
                }
                type="increase"
                anchor={anchor}
                appchain={appchain}
                validator={validator}
              />
            </SimpleGrid>
          )}
        </Box>
      </Box>

      <RewardsModal
        isOpen={rewardsModalOpen}
        onClose={setRewardsModalOpen.off}
        appchain={appchain}
        anchor={anchor}
        rewards={rewards}
      />

      <StakesModal
        isOpen={stakesModalOpen}
        onClose={setStakesModalOpen.off}
        anchor={anchor}
        stakes={unbonedStakes}
      />

      <StakingHistoryModal
        isOpen={stakingHistoryModalOpen}
        onClose={setStakingHistoryModalOpen.off}
        histories={stakingHistories}
      />
    </>
  )
}
