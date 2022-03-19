import React, { useMemo } from 'react';
import useSWR from 'swr';
import Identicon from '@polkadot/react-identicon';
import { DecimalUtil, ZERO_DECIMAL } from 'utils';
import { encodeAddress } from '@polkadot/util-crypto';

import {
  Box,
  Grid,
  GridItem,
  Heading,
  Text,
  Flex,
  VStack,
  Skeleton,
  Icon,
  HStack
} from '@chakra-ui/react';

import {
  Validator,
  AnchorContract,
  FungibleTokenMetadata,
  RewardHistory,
  Delegator
} from 'types';

import { OCT_TOKEN_DECIMALS } from 'primitives';
import { RippleDot } from 'components';

import { useGlobalStore } from 'stores';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { StateBadge } from 'components';
import { useNavigate } from 'react-router-dom';

type ValidatorRowProps = {
  validator: Validator;
  appchainId: string | undefined;
  ftMetadata: FungibleTokenMetadata | undefined;
  anchor: AnchorContract | undefined;
  isLoading: boolean;
  isInAppchain: boolean;
  haveSessionKey: boolean;
  validatorSetHistoryEndIndex: string | undefined;
  showType: string;
}

export const ValidatorRow: React.FC<ValidatorRowProps> = ({
  validator,
  ftMetadata,
  isLoading,
  isInAppchain,
  haveSessionKey,
  appchainId,
  validatorSetHistoryEndIndex
}) => {

  const { global } = useGlobalStore();

  const navigate = useNavigate();

  const isMyself = useMemo(() => global && validator &&
    (global.accountId === validator.validator_id), [global, validator]);

  const { data: rewards } = useSWR<RewardHistory[]>(
    appchainId && validatorSetHistoryEndIndex ?
      `rewards/${validator.validator_id}/${appchainId}/${validatorSetHistoryEndIndex}` : null
  );

  const { data: delegators } = useSWR<Delegator[]>(
    appchainId && validatorSetHistoryEndIndex ?
      `${validator.validator_id}/${appchainId}/delegators` : null
  );
  
  const isDelegated = useMemo(() => global.accountId && !!delegators?.find(d => d.delegator_id === global.accountId), [delegators, global]);

  const { data: delegatorRewards } = useSWR<RewardHistory[]>(
    isDelegated && appchainId && validatorSetHistoryEndIndex ?
      `rewards/${validator.validator_id}/${appchainId}/${global?.accountId}/${validatorSetHistoryEndIndex}` : null
  );

  const unwithdrawnDelegatorRewards = useMemo(() => {
    if (!delegatorRewards?.length || !ftMetadata) {
      return ZERO_DECIMAL;
    }

    return delegatorRewards.reduce((total, next) => total.plus(
      DecimalUtil.fromString(next.unwithdrawn_reward, ftMetadata?.decimals)
    ), ZERO_DECIMAL);

  }, [delegatorRewards, ftMetadata]);

  const ss58Address = useMemo(() => {

    let address = '';
    if (!validator) {
      return address;
    }
    
    try {
      address = encodeAddress(validator.validator_id_in_appchain);
    } catch(err) {}

    return address;
  }, [validator]);

  const totalRewards = useMemo(() =>
    rewards?.length ?
      rewards?.reduce(
        (total, next) => total.plus(DecimalUtil.fromString(next.total_reward, ftMetadata?.decimals)),
        ZERO_DECIMAL
      ) : ZERO_DECIMAL,
    [rewards]
  );

  return (
    <Grid
      transition="transform 0.2s ease-in-out 0s, box-shadow 0.2s ease-in-out 0s"
      borderRadius="lg"
      _hover={{
        boxShadow: 'rgb(0 0 123 / 10%) 0px 0px 15px',
        transform: 'scaleX(0.99)'
      }}
      templateColumns={{ base: 'repeat(5, 1fr)', md: 'repeat(8, 1fr)', lg: 'repeat(10, 1fr)' }}
      pl={6}
      pr={6}
      gap={2}
      minH="65px"
      cursor="pointer"
      alignItems="center"
      onClick={() => navigate(`/appchains/${appchainId}/validator/${validator.validator_id}`)}>
      <GridItem colSpan={2} w="100%">
        <VStack spacing={1} alignItems="flex-start">
          <HStack w="100%">
            <Identicon value={ss58Address} size={24} />
            <Heading fontSize="md" whiteSpace="nowrap" textOverflow="ellipsis" overflow="hidden">
              {validator.validator_id}
            </Heading>
          </HStack>
          <Skeleton isLoaded={!!rewards}>
            <Text fontSize="xs" variant="gray" whiteSpace="nowrap" textOverflow="ellipsis" overflow="hidden" w="100%">
              Rewards: {DecimalUtil.beautify(totalRewards)} {ftMetadata?.symbol}
            </Text>
          </Skeleton>
        </VStack>
      </GridItem>
      <GridItem colSpan={2} display={{ base: 'none', md: 'table-cell' }}>
        <Flex justifyContent="center">
          {
            isLoading ?
              <RippleDot size={24} color="#2468f2" /> :
              <StateBadge state={
                validator?.is_unbonding ? 'Unbonding' :
                isInAppchain && haveSessionKey ? 'Validating' : isInAppchain ? 'Need Keys' : 'Registered'
              } />
          }
        </Flex>
      </GridItem>
      <GridItem colSpan={2} textAlign="center">
        <Heading fontSize="md">
          {
            DecimalUtil.beautify(
              DecimalUtil.fromString(validator.total_stake, OCT_TOKEN_DECIMALS)
            )
          } OCT
        </Heading>
      </GridItem>
      <GridItem colSpan={2} display={{ base: 'none', lg: 'table-cell' }} textAlign="center">
        <Heading fontSize="md">
          {
            DecimalUtil.beautify(
              DecimalUtil.fromString(validator.deposit_amount, OCT_TOKEN_DECIMALS)
            )
          } OCT
        </Heading>
      </GridItem>
      <GridItem colSpan={1} display={{ base: 'none', md: 'table-cell' }} textAlign="center">
        <Heading fontSize="md">{validator.delegators_count}</Heading>
      </GridItem>
      <GridItem colSpan={1}>
        <HStack justifyContent="flex-end" alignItems="center" position="relative">
          {
            isMyself && !validator?.is_unbonding ? 
            <Text variant="gray" fontSize="sm">Manage</Text> :
            isDelegated ?
            <Text variant="gray" fontSize="sm">Delegated</Text> : null
          }
          <Icon as={ChevronRightIcon} boxSize={5} className="octo-gray" />
          {
            unwithdrawnDelegatorRewards.gt(ZERO_DECIMAL) ?
            <Box position="absolute" top="-3px" right="15px" boxSize={2} bg="red" borderRadius="full" /> : null  
          }
        </HStack>
      </GridItem>
    </Grid>
  );
}