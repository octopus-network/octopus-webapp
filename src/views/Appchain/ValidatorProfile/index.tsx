import React, { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import Decimal from 'decimal.js';

import {
  DrawerHeader,
  DrawerBody,
  Flex,
  VStack,
  Box,
  Heading,
  CloseButton,
  Button,
  HStack,
  Skeleton,
  Icon,
  Avatar,
  Text,
  Center,
  Spinner,
  Link,
  useClipboard,
  useBoolean,
  SimpleGrid,
  useColorModeValue,
  useToast,
  IconButton,
  DrawerFooter,
  Divider
} from '@chakra-ui/react';

import {
  ValidatorSessionKey,
  Validator,
  ValidatorProfile as ValidatorProfileType,
  AnchorContract,
  Delegator,
  RewardHistory,
  TokenContract,
  AppchainInfoWithAnchorStatus
} from 'types';

import {
  COMPLEX_CALL_GAS,
  FAILED_TO_REDIRECT_MESSAGE,
  OCT_TOKEN_DECIMALS
} from 'primitives';

import { CheckIcon, CopyIcon, AddIcon, MinusIcon } from '@chakra-ui/icons';
import { BiDoorOpen, BiLogOut } from 'react-icons/bi';
import { Empty, Alert } from 'components';
import { AiOutlineTwitter, AiOutlineCloseCircle } from 'react-icons/ai';
import { MdEmail } from 'react-icons/md';
import { StateBadge, LoginButton } from 'components';
import { encodeAddress } from '@polkadot/util-crypto';
import Identicon from '@polkadot/react-identicon';

import { DelegatorsTable } from './DelegatorsTable';
import { StakingPopover } from '../StakingPopover';
import { DelegateModal } from './DelegateModal';
import { RewardsModal } from '../RewardsModal';
import { useGlobalStore } from 'stores';
import { DecimalUtil, ZERO_DECIMAL } from 'utils';

import octoAvatar from 'assets/icons/avatar.png';

type ValidatorProfileProps = {
  wrappedAppchainTokenContract?: TokenContract;
  appchain?: AppchainInfoWithAnchorStatus;
  anchor?: AnchorContract;
  validatorId: string;
  appchainValidators?: string[];
  validators?: Validator[];
  validatorSessionKeys?: Record<string, ValidatorSessionKey>;
  onDrawerClose: () => void;
}

export const ValidatorProfile: React.FC<ValidatorProfileProps> = ({
  appchain,
  wrappedAppchainTokenContract,
  validatorId,
  anchor,
  validators,
  appchainValidators,
  validatorSessionKeys,
  onDrawerClose
}) => {

  const validator = useMemo(() => validators?.find(v => v.validator_id === validatorId), [validators, validatorId]);

  const bg = useColorModeValue('#f6f7fa', '#15172c');
  const footerBg = useColorModeValue('#f6f7fa', '#15172c');

  const [validatorProfile, setValidatorProfile] = useState<ValidatorProfileType>();
  const [delegatedDeposits, setDelegatedDeposits] = useState(ZERO_DECIMAL);

  const [isTogglingDelegation, setIsTogglingDelegation] = useBoolean();
  const [delegatorRewardsModalOpen, setDelegatorRewardsModalOpen] = useBoolean();

  const [unbondAlertOpen, setUnbondAlertOpen] = useBoolean();
  const [unbondDelegationAlertOpen, setUnbondDelegationAlertOpen] = useBoolean();
  const [isUnbonding, setIsUnbonding] = useBoolean();
  const [isUnbondingDelegation, setIsUnbondingDelegation] = useBoolean();
  const [delegateModalOpen, setDelegateModalOpen] = useBoolean();

  const { global } = useGlobalStore();
  const toast = useToast();

  const { data: delegators } = useSWR<Delegator[]>(
    appchain && validatorId ? `${validatorId}/${appchain?.appchain_id}/delegators` : null
  );

  const isDelegated = useMemo(() => global?.accountId && !!delegators?.find(d => d.delegator_id === global.accountId), [delegators, global]);

  const { data: delegatorRewards } = useSWR<RewardHistory[]>(
    isDelegated && appchain?.anchor_status ?
      `rewards/${validator?.validator_id}/${appchain?.appchain_id}/${global?.accountId}/${appchain?.anchor_status?.index_range_of_validator_set_history?.end_index}` : null
  );

  const { data: balances } = useSWR(global.accountId ? `balances/${global.accountId}` : null);

  useEffect(() => {
    if (!anchor || !appchain) {
      return;
    }
    anchor?.get_delegator_deposit_of({
      delegator_id: global.accountId,
      validator_id: validator?.validator_id || ''
    }).then((deposit) => {
      setDelegatedDeposits(
        DecimalUtil.fromString(deposit, OCT_TOKEN_DECIMALS)
      );
    });
  }, [anchor, global, validator, appchain]);

  const unwithdrawnDelegatorRewards = useMemo(() => {
    if (!delegatorRewards?.length) {
      return ZERO_DECIMAL;
    }

    return delegatorRewards.reduce((total, next) => total.plus(
      DecimalUtil.fromString(next.unwithdrawn_reward, appchain?.appchain_metadata?.fungible_token_metadata.decimals)
    ), ZERO_DECIMAL);

  }, [delegatorRewards]);

  useEffect(() => {
    if (!validator || !anchor) {
      return;
    }

    anchor.get_validator_profile({ validator_id: validator.validator_id }).then((profile) => {
      setValidatorProfile(profile);
    });

  }, [validator]);

  const ss58Address = useMemo(() => {

    let address = 'loading';
    if (!validator) {
      return address;
    }

    try {
      address = encodeAddress(validator.validator_id_in_appchain);
    } catch (err) { }

    return address;
  }, [validator]);

  const { hasCopied: hasSS58AddressCopied, onCopy: onSS58AddressCopy } = useClipboard(ss58Address);

  const isMyself = useMemo(() => global && validator &&
    (global.accountId === validator.validator_id), [global, validator]);

  const validatorState = useMemo(() => {
    if (!validator || !appchainValidators || !validatorSessionKeys || !ss58Address) {
      return 'Unknown';
    }

    const sessionKey = validatorSessionKeys[validator.validator_id];
    if (validator?.is_unbonding) {
      return 'Unbonding';
    } else if (appchainValidators.some(s => s === ss58Address) && sessionKey) {
      return 'Validating';
    } else if (appchainValidators.some(s => s === ss58Address) && !sessionKey) {
      return 'Need Keys';
    } else if (!appchainValidators.some(s => s === ss58Address)) {
      return 'Registered';
    }

    return 'Unknown';

  }, [validator, appchainValidators, validatorSessionKeys, ss58Address]);

  const toggleDelegation = () => {
    const method = validator?.can_be_delegated_to ? anchor?.disable_delegation :
      anchor?.enable_delegation;

    setIsTogglingDelegation.on();

    method?.({}, COMPLEX_CALL_GAS).catch((err: any) => {
      if (err.message === FAILED_TO_REDIRECT_MESSAGE) {
        return;
      }
      toast({
        position: 'top-right',
        title: 'Error',
        description: err.toString(),
        status: 'error'
      });
      setIsTogglingDelegation.off();
    });
  }

  const onUnbondValidator = () => {
    setIsUnbonding.on();
    anchor?.unbond_stake({}, COMPLEX_CALL_GAS)
      .catch(err => {
        if (err.message === FAILED_TO_REDIRECT_MESSAGE) {
          return;
        }
        toast({
          position: 'top-right',
          title: 'Error',
          description: err.toString(),
          status: 'error'
        });
        setIsUnbonding.off();
      });
  }

  const onUnbondDelegation = () => {
    setIsUnbondingDelegation.on();
    anchor?.unbond_delegation({ validator_id: validator?.validator_id || '' }, COMPLEX_CALL_GAS)
      .catch(err => {
        setIsUnbondingDelegation.off();
        if (err.message === FAILED_TO_REDIRECT_MESSAGE) {
          return;
        }
        toast({
          position: 'top-right',
          title: 'Error',
          description: err.toString(),
          status: 'error'
        });
      });
  }

  return (
    <>
      <>
        <DrawerHeader borderBottomWidth="0">
          <Flex justifyContent="space-between" alignItems="center">
            <Heading fontSize="lg">Validator Profile</Heading>
            <CloseButton onClick={onDrawerClose} />
          </Flex>
        </DrawerHeader>
        <DrawerBody>
          <Box p={4} bg={bg} borderRadius="lg">

            <Skeleton isLoaded={validatorState !== 'Unknown'}>
              <Flex justifyContent="space-between" alignItems="center">
                <HStack maxW="calc(100% - 120px)">
                  <Identicon size={32} value={ss58Address} />
                  <Heading
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    w="100%"
                    fontSize="lg">{validatorId}@{appchain?.appchain_id}</Heading>
                </HStack>
                <StateBadge state={validatorState} />
              </Flex>
            </Skeleton>
            <HStack w="100%" mt={3} className="octo-gray" spacing={5}>
              <Skeleton isLoaded={!(ss58Address === 'loading')}>
                <Button variant="link" onClick={onSS58AddressCopy} size="sm">
                  {hasSS58AddressCopied ? <CheckIcon /> : <CopyIcon />}
                  <Text ml={2}>SS58 Address</Text>
                </Button>
              </Skeleton>
              {
                validatorProfile?.profile?.email &&
                <Link href={`mailto:${validatorProfile?.profile?.email}`}>
                  <HStack>
                    <Icon as={MdEmail} boxSize={5} />
                    <Text>Email</Text>
                  </HStack>
                </Link>
              }

              {
                validatorProfile?.profile?.socialMediaHandle &&
                <Link href={`https://www.twitter.com/${validatorProfile?.profile?.socialMediaHandle}`}>
                  <HStack>
                    <Icon as={AiOutlineTwitter} boxSize={5} />
                    <Text>Twitter</Text>
                  </HStack>
                </Link>
              }

            </HStack>
          </Box>
          <Box mt={4}>
            {
              isMyself && !validator?.is_unbonding ?
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                  <Button colorScheme={validator?.can_be_delegated_to ? 'gray' : 'octo-blue'} onClick={toggleDelegation}
                    isLoading={isTogglingDelegation} isDisabled={isTogglingDelegation}>
                    <Icon as={validator?.can_be_delegated_to ? AiOutlineCloseCircle : BiDoorOpen} mr={2} />
                    {validator?.can_be_delegated_to ? 'Disable Delegation' : 'Enable Delegation'}
                  </Button>
                  <Button colorScheme="red" onClick={setUnbondAlertOpen.on}>
                    <Icon as={BiLogOut} mr={2} /> Unbond Validator
                  </Button>
                </SimpleGrid> : null
            }
          </Box>
          {
            isDelegated ?
              <Box mt={4} p={4} borderWidth={1} borderRadius="lg">
                <Flex alignItems="center" justifyContent="space-between">
                  <Heading fontSize="md">Delegated</Heading>
                  <HStack spacing={4}>
                    <StakingPopover
                      trigger={
                        <IconButton aria-label="Decrease Delegation" size="sm">
                          <Icon as={MinusIcon} boxSize={3} />
                        </IconButton>
                      }
                      type="decrease"
                      anchor={anchor}
                      deposit={delegatedDeposits}
                      validatorId={validatorId}
                      helper={`Your decreased stakes will be claimable after ${appchain?.appchain_id === 'debionetwork' ? 21 : 28} days`}
                      validator={validator}
                      appchain={appchain}
                    />

                    <Heading fontSize="md">{DecimalUtil.beautify(delegatedDeposits)} OCT</Heading>

                    <StakingPopover
                      trigger={
                        <IconButton aria-label="Increase Delegation" size="sm" colorScheme="octo-blue">
                          <Icon as={AddIcon} boxSize={3} />
                        </IconButton>
                      }
                      type="increase"
                      validatorId={validatorId}
                      anchor={anchor}
                      validator={validator}
                      appchain={appchain}
                    />

                  </HStack>
                </Flex>
                <Divider mt={4} mb={4} />
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                  <Button colorScheme="red" onClick={setUnbondDelegationAlertOpen.on}>
                    <Icon as={BiLogOut} mr={2} /> Unbond Delegation
                  </Button>
                  <Button colorScheme="octo-blue" onClick={setDelegatorRewardsModalOpen.on} position="relative">
                    Rewards
                    {
                      unwithdrawnDelegatorRewards.gt(ZERO_DECIMAL) ?
                        <Box position="absolute" top="-5px" right="-5px" boxSize={2} bg="red" borderRadius="full" /> : null
                    }
                  </Button>
                </SimpleGrid>
              </Box> : null
          }

          <Box mt={4} p={4} borderWidth={1} borderRadius="lg">
            <Flex alignItems="center" justifyContent="space-between">
              <Heading fontSize="md">Delegators</Heading>
              {
                global.accountId && validator && !isDelegated ?
                  <Button colorScheme="octo-blue" size="sm" onClick={setDelegateModalOpen.on}
                    isDisabled={!validator?.can_be_delegated_to || validatorState !== 'Validating'}>
                    { 
                      validator && !validator.can_be_delegated_to ? 'Delegation Disabled' :
                      <>
                        <Icon as={AddIcon} mr={2} boxSize={3} /> 
                        <Text>Delegate</Text>
                      </>
                    }
                  </Button> : null
              }
            </Flex>
            <Divider mt={4} mb={4} />
            <Box>
              {
                !delegators ?
                  <Center minH="160px">
                    <Spinner size="md" thickness="4px" speed="1s" color="octo-blue.500" />
                  </Center> :
                  !delegators.length ?
                    <Empty message="No Delegators" /> :
                    <DelegatorsTable delegators={delegators} />
              }
            </Box>
          </Box>
        </DrawerBody>
        <DrawerFooter justifyContent="flex-start">
          <Box bg={footerBg} p={4} borderRadius="lg" w="100%">
            <Flex justifyContent="space-between" alignItems="center">
              {
                global.accountId ?
                  <HStack>
                    <Avatar boxSize={8} src={octoAvatar} display={{ base: 'none', md: 'block' }} />
                    <Heading fontSize="lg">{global.accountId}</Heading>
                  </HStack> :
                  <LoginButton />
              }
              {
                global.accountId ?
                  <VStack alignItems="flex-end" spacing={0}>
                    <HStack>
                      <Text variant="gray" display={{ base: 'none', md: 'block' }}>Balance:</Text>
                      <Heading fontSize="md" color="octo-blue.500">
                        {
                          DecimalUtil.beautify(
                            new Decimal(balances?.[appchain?.appchain_metadata?.fungible_token_metadata?.symbol as any] || 0)
                          )
                        } {appchain?.appchain_metadata?.fungible_token_metadata?.symbol}
                      </Heading>
                    </HStack>
                    <Text fontSize="sm" className="octo-gray">
                      {DecimalUtil.beautify(new Decimal(balances?.['OCT'] || 0))} OCT
                    </Text>
                  </VStack> : null
              }
            </Flex>
          </Box>
        </DrawerFooter>
      </>
      <Alert
        isOpen={unbondAlertOpen}
        onClose={setUnbondAlertOpen.off}
        title="Unbond Validator"
        confirmButtonText="Unbond"
        isConfirming={isUnbonding}
        message={`Your unbonded stakes will be claimable after ${appchain?.appchain_id === 'debionetwork' ? 21 : 28} days. Are you confirm to unbond?`}
        onConfirm={onUnbondValidator}
        confirmButtonColor="red" />

      <Alert
        isOpen={unbondDelegationAlertOpen}
        onClose={setUnbondDelegationAlertOpen.off}
        title="Unbond Delegation"
        confirmButtonText="Unbond"
        isConfirming={isUnbondingDelegation}
        message={`Are you confirm to unbond delegation? (Your unbonded stakes will be claimable after ${appchain?.appchain_id === 'debionetwork' ? 21 : 28} days)`}
        onConfirm={onUnbondDelegation}
        confirmButtonColor="red" />

      <DelegateModal
        isOpen={delegateModalOpen}
        anchor={anchor}
        onClose={setDelegateModalOpen.off}
        validatorId={validator?.validator_id || ''} />

      <RewardsModal
        isOpen={delegatorRewardsModalOpen}
        onClose={setDelegatorRewardsModalOpen.off}
        appchain={appchain}
        anchor={anchor}
        validatorId={validatorId}
        wrappedAppchainTokenContract={wrappedAppchainTokenContract}
        rewards={delegatorRewards} />
    </>
  )
}