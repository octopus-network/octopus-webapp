import React, { useMemo } from 'react';
import { BounceLoader } from 'react-spinners';
import { DecimalUtil, ZERO_DECIMAL } from 'utils';
import { encodeAddress } from '@polkadot/util-crypto';

import {
  Grid,
  GridItem,
  Heading,
  Button,
  Tooltip,
  Switch,
  Text,
  Flex,
  Box,
  Spinner,
  VStack,
  useToast,
  useBoolean
} from '@chakra-ui/react';

import { Validator, AnchorContract, FungibleTokenMetadata } from 'types';

import {
  OCT_TOKEN_DECIMALS,
  COMPLEX_CALL_GAS,
  FAILED_TO_REDIRECT_MESSAGE
} from 'primitives';

import { useGlobalStore } from 'stores';

import { StateBadge } from 'components';

type ValidatorProps = {
  validator: Validator;
  ftMetadata: FungibleTokenMetadata | undefined;
  anchor: AnchorContract | null;
  appchainValidators: string[] | undefined;
  showType: string;
}

export const ValidatorRow: React.FC<ValidatorProps> = ({ validator, ftMetadata, anchor, appchainValidators, showType }) => {

  const { global } = useGlobalStore();
  const toast = useToast();

  const isMyself = useMemo(() => global && validator &&
    (global.accountId === validator?.validator_id), [global, validator]);

  const [isTogglingDelegation, setIsTogglingDelegation] = useBoolean(false);

  const unwithdraedAmount = useMemo(() => {
    if (!validator?.rewards.length) {
      return ZERO_DECIMAL;
    }

    return validator.rewards.reduce(
      (total, next) => total.plus(DecimalUtil.fromString(next.unwithdrawn_reward, ftMetadata?.decimals)),
      ZERO_DECIMAL
    );

  }, [validator]);

  const totalRewards = useMemo(() => validator ?
    validator.rewards.reduce(
      (total, next) => total.plus(DecimalUtil.fromString(next.total_reward, ftMetadata?.decimals)),
      ZERO_DECIMAL
    ) : ZERO_DECIMAL,
    [validator]
  );

  const ss58Address = useMemo(() => {
    let ss58Address;
    try {
      ss58Address = encodeAddress(validator.validator_id_in_appchain);
    } catch (err) {
      ss58Address = '';
    }
    return ss58Address;
  }, [validator]);

  const isInAppchain = useMemo(() => appchainValidators?.some(s => s === ss58Address), [ss58Address, appchainValidators]);

  const toggleDelegation = () => {
    const method = validator.can_be_delegated_to ? anchor?.disable_delegation :
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

  return (isInAppchain && (showType === 'validating' || showType === 'all')) ||
    (!isInAppchain && (showType === 'staker' || showType === 'all')) ?
    (
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
        alignItems="center">
        <GridItem colSpan={2}>
          <VStack spacing={1} alignItems="flex-start">
            <Text whiteSpace="nowrap" textOverflow="ellipsis" overflow="hidden" w="100%">
              {validator.validator_id}
            </Text>

            <Text fontSize="xs" variant="gray" whiteSpace="nowrap" textOverflow="ellipsis" overflow="hidden" w="100%">
              Rewards: {DecimalUtil.beautify(totalRewards)} {ftMetadata?.symbol}
              {
                unwithdraedAmount.gt(ZERO_DECIMAL) ?
                  `, unclaimed: ${DecimalUtil.beautify(unwithdraedAmount)} ${ftMetadata?.symbol}` : ''
              }
            </Text>
          </VStack>
        </GridItem>
        <GridItem colSpan={2} display={{ base: 'none', md: 'table-cell' }}>
          <Flex justifyContent="center">
            {
              !appchainValidators?.length ?
                <BounceLoader size={14} color="#2468f2" /> :
                <StateBadge state={isInAppchain ? 'Validating' : 'Staker'} />
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
        <GridItem colSpan={1} textAlign="right">
          {
            isMyself ?

              isTogglingDelegation ?
                <Spinner size="sm" color="octo-blue.500" /> :
                <Tooltip label="Toggle delegation">
                  <Box>
                    <Switch id="can-be-delegate" isChecked={validator.can_be_delegated_to}
                      onChange={toggleDelegation} size="lg" />
                  </Box>
                </Tooltip> :

              <Button size="sm" colorScheme="octo-blue" variant="outline"
                isDisabled={!validator.can_be_delegated_to}>Delegate</Button>
          }
        </GridItem>
      </Grid>
    ) : null
}