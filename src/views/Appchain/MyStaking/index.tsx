import React, { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import dayjs from "dayjs";

import {
  Box,
  Heading,
  Text,
  HStack,
  VStack,
  Button,
  Icon,
  Flex,
  useBoolean,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";

import {
  AnchorContract,
  RewardHistory,
  AppchainInfoWithAnchorStatus,
  UnbondedHistory,
  StakingHistory,
  Validator,
} from "types";

import { OCT_TOKEN_DECIMALS } from "primitives";

import { AiOutlineMenu } from "react-icons/ai";
import { BsThreeDots, BsCheckCircle } from "react-icons/bs";
import { AddIcon, MinusIcon } from "@chakra-ui/icons";

import { StakingHistoryModal } from "./StakingHistoryModal";
import { RewardsModal } from "../RewardsModal";
import { StakesModal } from "./StakesModal";
import { StakingPopover } from "../StakingPopover";

import { DecimalUtil, ZERO_DECIMAL } from "utils";
import groupBy from "lodash.groupby";
import { useWalletSelector } from "components/WalletSelectorContextProvider";
import { calcUnwithdrawnReward } from "utils/appchain";
import { API_HOST } from "config";

type MyStakingProps = {
  appchain?: AppchainInfoWithAnchorStatus;
  anchor?: AnchorContract;
  validator?: Validator;
};

export const MyStaking: React.FC<MyStakingProps> = ({
  appchain,
  anchor,
  validator,
}) => {
  const isValidator = !!(validator && !validator?.is_unbonding);

  const [rewardsModalOpen, setRewardsModalOpen] = useBoolean(false);
  const [stakesModalOpen, setStakesModalOpen] = useBoolean(false);
  const [stakingHistoryModalOpen, setStakingHistoryModalOpen] =
    useBoolean(false);
  const [delegatorRewards, setDelegatorRewards] = useState<{
    [key: string]: RewardHistory[];
  }>({});
  const { accountId } = useWalletSelector();
  const [deposit, setDeposit] = useState(ZERO_DECIMAL);

  const [unbonedStakes, setUnbondedStakes] = useState<UnbondedHistory[]>();
  const [stakingHistories, setStakingHistories] = useState<StakingHistory[]>();
  const [delegatedAmount, setDelegatedAmount] = useState(ZERO_DECIMAL);

  const { data: validatorRewards } = useSWR<RewardHistory[]>(
    appchain?.anchor_status && accountId
      ? `rewards/${accountId}/${appchain.appchain_id}/${appchain?.anchor_status?.index_range_of_validator_set_history?.end_index}`
      : null
  );

  useEffect(() => {
    async function fetchDelegateRewards() {
      if (!(accountId && anchor && appchain?.appchain_id)) {
        return;
      }

      try {
        const dRewards = await anchor.get_delegator_rewards({
          delegator_id: accountId,
        });
        const unwithdrawnRewards = dRewards.sort(
          (a, b) => Number(b.era_number) - Number(a.era_number)
        );
        const groupedRewards = groupBy(
          unwithdrawnRewards,
          "delegated_validator"
        );
        setDelegatorRewards(groupedRewards);
        const delegatedValidatorIds = Object.keys(groupedRewards);
        const delegated = await Promise.all(
          delegatedValidatorIds.map(async (id) => {
            return await fetch(
              `${API_HOST}/${id}/${appchain?.appchain_id}/delegators`
            )
              .then((res) => res.json())
              .then((res) =>
                res.find((t: any) => t.delegator_id === accountId)
              );
          })
        );

        const delegatedAmount = delegated.reduce((acc, cur) => {
          if (cur) {
            return acc.plus(cur.delegation_amount);
          }
          return acc;
        }, ZERO_DECIMAL);
        setDelegatedAmount(
          DecimalUtil.fromString(delegatedAmount, OCT_TOKEN_DECIMALS)
        );
      } catch (e) {}
    }

    fetchDelegateRewards();
  }, [accountId, anchor, appchain?.appchain_id]);

  const decimals =
    appchain?.appchain_metadata?.fungible_token_metadata.decimals;
  const total = useMemo(() => {
    const vTotal = calcUnwithdrawnReward(validatorRewards || [], decimals);
    const dTotal = Object.values(delegatorRewards).reduce(
      (total, rewards) => total.plus(calcUnwithdrawnReward(rewards, decimals)),
      ZERO_DECIMAL
    );
    return DecimalUtil.beautify(vTotal.plus(dTotal));
  }, [validatorRewards, delegatorRewards, decimals]);

  const withdrawableStakes = useMemo(() => {
    if (!unbonedStakes?.length) {
      return ZERO_DECIMAL;
    }

    return unbonedStakes.reduce((total, next) => {
      if (Number(next.unlock_time) === 0) {
        return total.plus(
          DecimalUtil.fromString(next.amount, OCT_TOKEN_DECIMALS)
        );
      } else {
        return total.plus(
          dayjs(Math.floor((next.unlock_time as any) / 1e6)).diff() > 0
            ? 0
            : DecimalUtil.fromString(next.amount, OCT_TOKEN_DECIMALS)
        );
      }
    }, ZERO_DECIMAL);
  }, [unbonedStakes]);

  useEffect(() => {
    if (!anchor || !accountId) {
      return;
    }

    Promise.all([
      anchor.get_validator_deposit_of({ validator_id: accountId }),
      anchor.get_unbonded_stakes_of({ account_id: accountId }),
      anchor.get_user_staking_histories_of({ account_id: accountId }),
    ])
      .then(([deposit, stakes, histories]) => {
        setDeposit(DecimalUtil.fromString(deposit, OCT_TOKEN_DECIMALS));
        setUnbondedStakes(stakes);
        setStakingHistories(histories);
      })
      .catch(console.log);
  }, [anchor, accountId]);

  return (
    <>
      <Box position="relative" borderBottomRadius="lg">
        <Box position="relative" zIndex={1}>
          <Flex justifyContent="space-between" alignItems="center">
            <Heading fontSize="lg" color="white">
              My Rewards
            </Heading>
            <HStack spacing={0}>
              <Button
                size="sm"
                borderRadius={4}
                onClick={setRewardsModalOpen.on}
              >
                Claim
              </Button>
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
          <VStack p={6} alignItems="center" justify="center">
            <Heading fontSize="4xl" color="white">
              {total}{" "}
              {appchain?.appchain_metadata?.fungible_token_metadata.symbol}
            </Heading>
          </VStack>
          <HStack alignItems="center" justify="flex-end" spacing={4} mt={0}>
            <Text color="whiteAlpha.800">Staked</Text>
            {isValidator && (
              <StakingPopover
                trigger={
                  <Button variant="whiteAlpha" size="xs">
                    <Icon as={MinusIcon} boxSize={3} />
                  </Button>
                }
                deposited={deposit}
                type="decrease"
                anchor={anchor}
                helper={`Your decreased stake will be claimable after 21 days`}
                appchain={appchain}
                validator={validator}
              />
            )}

            <Heading fontSize="1xl" color="white">
              {DecimalUtil.beautify(deposit.plus(delegatedAmount))} OCT
            </Heading>

            {isValidator && (
              <StakingPopover
                trigger={
                  <Button variant="whiteAlpha" size="xs">
                    <Icon as={AddIcon} boxSize={3} />
                  </Button>
                }
                type="increase"
                anchor={anchor}
                appchain={appchain}
                validator={validator}
              />
            )}
          </HStack>
        </Box>
      </Box>

      <RewardsModal
        isOpen={rewardsModalOpen}
        onClose={setRewardsModalOpen.off}
        appchain={appchain}
        anchor={anchor}
        validatorRewards={validatorRewards}
        delegatorRewards={delegatorRewards}
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
  );
};
