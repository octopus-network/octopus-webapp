import React from 'react';
import useSWR from 'swr';

import {
  Flex,
  Heading,
  Grid,
  Button,
  GridItem
} from '@chakra-ui/react';

import { RewardHistory } from 'types';

import { StateBadge } from 'components';
import { useGlobalStore } from 'stores';

type UnbondedValidatorRowProps = {
  id: string;
  appchainId: string | undefined;
  validatorSetHistoryEndIndex: string | undefined;
  onClaimRewards: (validator: string, rewards: RewardHistory[]) => void;
}

export const UnbondedValidatorRow: React.FC<UnbondedValidatorRowProps> = ({ 
  id,
  appchainId,
  validatorSetHistoryEndIndex,
  onClaimRewards
}) => {

  const { global } = useGlobalStore();

  const { data: delegatorRewards } = useSWR<RewardHistory[]>(
    appchainId && validatorSetHistoryEndIndex ?
      `rewards/${id}/${appchainId}/${global?.accountId}/${validatorSetHistoryEndIndex}` : null
  );

  return (
    delegatorRewards?.length ?
    <Grid 
      templateColumns={{ base: 'repeat(5, 1fr)', md: 'repeat(8, 1fr)', lg: 'repeat(10, 1fr)' }}
      minH="55px"
      borderBottomWidth={1}
      alignItems="center"
      ml={6} mr={6} gap={2}>
      <GridItem colSpan={2} w="100%" opacity={.5}>
        <Heading fontSize="md" whiteSpace="nowrap" textOverflow="ellipsis" overflow="hidden">
          {id}
        </Heading>
      </GridItem>
      <GridItem colSpan={2} display={{ base: 'none', md: 'table-cell' }} opacity={.5}>
        <Flex justifyContent="center">
          <StateBadge state="Unbonded" />
        </Flex>
      </GridItem>
      <GridItem colSpan={2} textAlign="center" opacity={.5}>-</GridItem>
      <GridItem colSpan={2} display={{ base: 'none', lg: 'table-cell' }} textAlign="center" opacity={.5}>-</GridItem>
      <GridItem colSpan={1} display={{ base: 'none', md: 'table-cell' }} textAlign="center" opacity={.5}>
        -
      </GridItem>
      <GridItem colSpan={1}>
        <Button size="sm" variant="outline" colorScheme="octo-blue" 
          onClick={() => onClaimRewards(id, delegatorRewards)}>Claim Rewards</Button>
      </GridItem>
    </Grid> : null
  );
}