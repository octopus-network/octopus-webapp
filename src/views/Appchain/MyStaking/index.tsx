import React, { useMemo, useState, useEffect } from 'react';
import useSWR from 'swr';
import dayjs from 'dayjs';

import {
  Box,
  useColorModeValue,
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
  MenuItem
} from '@chakra-ui/react';

import {
  AnchorContract,
  RewardHistory,
  AppchainInfoWithAnchorStatus,
  TokenContract,
  UnbondedHistory,
  StakingHistory
} from 'types';

import { OCT_TOKEN_DECIMALS } from 'primitives';

import { AiOutlineMenu } from 'react-icons/ai';
import { BsThreeDots, BsCheckCircle } from 'react-icons/bs';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';

import myStakingBg from 'assets/my-staking-bg.png';
import empty from 'assets/empty.png';

import { useGlobalStore } from 'stores';
import { RegisterValidatorModal } from './RegisterValidatorModal';
import { StakingHistoryModal } from './StakingHistoryModal';
import { RewardsModal } from '../RewardsModal';
import { StakesModal } from './StakesModal';
import { StakingPopover } from '../StakingPopover';

import { DecimalUtil, ZERO_DECIMAL } from 'utils';

type MyStakingProps = {
  appchain: AppchainInfoWithAnchorStatus | undefined;
  anchor: AnchorContract | undefined;
  isValidator: boolean;
  isUnbonding: boolean;
  wrappedAppchainTokenContract: TokenContract | undefined;
}

export const MyStaking: React.FC<MyStakingProps> = ({ appchain, anchor, wrappedAppchainTokenContract, isValidator, isUnbonding }) => {

  const bg = useColorModeValue(
    'linear-gradient(137deg,#1486ff 4%, #0c4df5)',
    'linear-gradient(137deg,#1486ff 4%, #0c4df5)'
  );

  const whiteBg = useColorModeValue('white', '#15172c');

  const [registerValidatorModalOpen, setRegisterValidatorModalOpen] = useBoolean(false);
  const [rewardsModalOpen, setRewardsModalOpen] = useBoolean(false);
  const [stakesModalOpen, setStakesModalOpen] = useBoolean(false);
  const [stakingHistoryModalOpen, setStakingHistoryModalOpen] = useBoolean(false);

  const { global } = useGlobalStore();
  const [deposit, setDeposit] = useState(ZERO_DECIMAL);

  const [unbonedStakes, setUnbondedStakes] = useState<UnbondedHistory[]>();
  const [stakingHistories, setStakingHistories] = useState<StakingHistory[]>();

  const { data: rewards } = useSWR<RewardHistory[]>(
    appchain?.anchor_status && global.accountId ?
      `rewards/${global.accountId}/${appchain.appchain_id}/${appchain?.anchor_status?.index_range_of_validator_set_history?.end_index}` : null
  );

  const unwithdrawnRewards = useMemo(() => {
    if (!rewards?.length) {
      return ZERO_DECIMAL;
    }

    return rewards.reduce((total, next) => total.plus(
      DecimalUtil.fromString(next.unwithdrawn_reward, appchain?.appchain_metadata?.fungible_token_metadata.decimals)
    ), ZERO_DECIMAL);

  }, [rewards]);

  const withdrawableStakes = useMemo(() => {
    if (!unbonedStakes?.length) {
      return ZERO_DECIMAL;
    }

    return unbonedStakes.reduce((total, next) => total.plus(
      dayjs(Math.floor(next.unlock_time as any / 1e6)).diff() > 0 ? 0 :
      DecimalUtil.fromString(next.amount, OCT_TOKEN_DECIMALS)
    ), ZERO_DECIMAL);

  }, [unbonedStakes]);

  useEffect(() => {
    if (!anchor || !global.accountId) {
      return;
    }

    Promise.all([
      anchor.get_validator_deposit_of({ validator_id: global.accountId }),
      anchor.get_unbonded_stakes_of({ account_id: global.accountId }),
      anchor.get_user_staking_histories_of({ account_id: global.accountId })
    ]).then(([deposit, stakes, histories]) => {
      setDeposit(DecimalUtil.fromString(deposit, OCT_TOKEN_DECIMALS));
      setUnbondedStakes(stakes);
      setStakingHistories(histories);
    });
   
  }, [global, anchor]);

  return (
    <>
      <Box bg={isValidator ? bg : whiteBg} position="relative" p={6} pt={4} pb={6} borderRadius="lg">
        {
          isValidator ?
            <>
              <Image position="absolute" bottom="0" right="0" h="110%" src={myStakingBg} zIndex={0} />
              <Box position="relative" zIndex={1}>
                <Flex justifyContent="space-between" alignItems="center">
                  <Heading fontSize="lg" color="white">My Staking</Heading>
                  <HStack spacing={0}>
                    <Box position="relative">
                      <Button size="sm" variant="whiteAlphaGhost" onClick={setRewardsModalOpen.on}>Rewards</Button>
                      {
                        unwithdrawnRewards.gt(ZERO_DECIMAL) ?
                          <Box boxSize={2} borderRadius="full" bg="red" position="absolute" right="2px" top="2px" /> : null
                      }
                    </Box>
                    <Menu>
                      <MenuButton as={Button} size="sm" variant="whiteAlphaGhost" position="relative">
                        <Icon as={BsThreeDots} boxSize={5} />
                        {
                          withdrawableStakes?.gt(ZERO_DECIMAL) ?
                            <Box position="absolute" top="0px" right="0px" boxSize={2} bg="red" borderRadius="full" /> : null
                        }
                      </MenuButton>
                      <MenuList>
                        <MenuItem position="relative" onClick={setStakesModalOpen.on}>
                          <Icon as={BsCheckCircle} mr={2} boxSize={4} /> Withdraw Stakes
                          {
                            withdrawableStakes?.gt(ZERO_DECIMAL) ?
                              <Box position="absolute" top="10px" right="10px" boxSize={2} bg="red" borderRadius="full" /> : null
                          }
                        </MenuItem>
                        <MenuItem  onClick={setStakingHistoryModalOpen.on}>
                          <Icon as={AiOutlineMenu} mr={2} boxSize={4} /> Staking History
                        </MenuItem>
                      </MenuList>
                    </Menu>

                  </HStack>
                </Flex>
                <VStack p={6} spacing={1}>
                  <Heading fontSize="3xl" color="white">{DecimalUtil.beautify(deposit)}</Heading>
                  <Text color="whiteAlpha.800">You Staked (OCT)</Text>
                </VStack>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <StakingPopover
                    trigger={
                      <Button variant="whiteAlpha"><Icon as={MinusIcon} mr={2} boxSize={3} /> Decrease</Button>
                    }
                    type="decrease"
                    anchor={anchor}
                    helper="Your decreased stakes will be claimable after 28 days" />

                  <StakingPopover
                    trigger={
                      <Button variant="white"><Icon as={AddIcon} mr={2} boxSize={3} />Increase</Button>
                    }
                    type="increase"
                    anchor={anchor} />

                </SimpleGrid>
              </Box>
            </> :
            <Box>
              <Flex justifyContent="space-between" alignItems="center">
                <Heading fontSize="lg">My Staking</Heading>
                {
                  isUnbonding || unbonedStakes?.length || stakingHistories?.length ?
                  <Menu>
                    <MenuButton as={Button} size="sm" colorScheme="octo-blue" variant="ghost" position="relative">
                      <Icon as={BsThreeDots} boxSize={5} />
                      {
                        withdrawableStakes?.gt(ZERO_DECIMAL) ?
                          <Box position="absolute" top="0px" right="0px" boxSize={2} bg="red" borderRadius="full" /> : null
                      }
                    </MenuButton>
                    <MenuList>
                      <MenuItem position="relative" onClick={setStakesModalOpen.on}>
                        <Icon as={BsCheckCircle} mr={2} boxSize={4} /> Withdraw Stakes
                        {
                          withdrawableStakes?.gt(ZERO_DECIMAL) ?
                            <Box position="absolute" top="10px" right="10px" boxSize={2} bg="red" borderRadius="full" /> : null
                        }
                      </MenuItem>
                      <MenuItem  onClick={setStakingHistoryModalOpen.on}>
                        <Icon as={AiOutlineMenu} mr={2} boxSize={4} /> Staking History
                      </MenuItem>
                    </MenuList>
                  </Menu> : null
                }
              </Flex>
              <Center minH="115px">
                <Box boxSize={20}>
                  <Image src={empty} w="100%" />
                </Box>
              </Center>
              <Button
                onClick={setRegisterValidatorModalOpen.on}
                colorScheme="octo-blue"
                isDisabled={!global.accountId || isUnbonding}
                isFullWidth>
                {
                  !global.accountId ?
                    'Please Login' :
                    isUnbonding ?
                      'Unbonding' :
                      'Register Validator'
                }
              </Button>
            </Box>
        }
      </Box>
      <RegisterValidatorModal
        isOpen={registerValidatorModalOpen}
        onClose={setRegisterValidatorModalOpen.off}
        anchor={anchor}
        appchain={appchain} />

      <RewardsModal
        isOpen={rewardsModalOpen}
        onClose={setRewardsModalOpen.off}
        appchain={appchain}
        anchor={anchor}
        wrappedAppchainTokenContract={wrappedAppchainTokenContract}
        rewards={rewards} />

      <StakesModal
        isOpen={stakesModalOpen}
        onClose={setStakesModalOpen.off}
        anchor={anchor}
        stakes={unbonedStakes} />

      <StakingHistoryModal
        isOpen={stakingHistoryModalOpen}
        onClose={setStakingHistoryModalOpen.off}
        histories={stakingHistories} />
    </>
  );
}