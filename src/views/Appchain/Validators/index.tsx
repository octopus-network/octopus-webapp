import React, { useEffect, useState } from 'react';
import useSWR from 'swr';

import {
  Flex,
  Heading,
  HStack,
  Center,
  Spinner,
  Button,
  Box,
  Text,
  useColorModeValue,
  Grid,
  GridItem,
  List
} from '@chakra-ui/react';

import type { ApiPromise } from '@polkadot/api';

import { 
  Validator, 
  AnchorContract, 
  AppchainInfoWithAnchorStatus
} from 'types';

import { ValidatorRow } from './ValidatorRow';

type ValidatorsProps = {
  appchain: AppchainInfoWithAnchorStatus | undefined;
  appchainApi: ApiPromise | undefined;
  anchor: AnchorContract | null;
}

export const Validators: React.FC<ValidatorsProps> = ({ appchain, anchor, appchainApi }) => {
  const bg = useColorModeValue('white', '#15172c');

  const [showType, setShowType] = useState('all');
  const [appchainValidators, setAppchainValidators] = useState<string[]>();

  useEffect(() => {
    appchainApi?.query?.session?.validators()
      .then(vs => {
        setAppchainValidators(vs.map(v => v.toString()));
      });
  }, [appchainApi]);

  const { data: validators, error } = useSWR<Validator[]>(
    appchain?.anchor_status ? 
    `validators/${appchain.appchain_id}/${appchain.anchor_status.index_range_of_validator_set_history.end_index}` : null
  );

  return (
    <>
      <Flex justifyContent="space-between" alignItems="center">
        <Heading fontSize="xl">Validators</Heading>
        <HStack>
          <Button variant={ showType === 'staker' ? 'octo-blue' : 'octo-white' } 
            size="sm" onClick={() => setShowType('staker')}>Staker</Button>
          <Button variant={ showType === 'validating' ? 'octo-blue' : 'octo-white' } 
            size="sm" onClick={() => setShowType('validating')}>Validating</Button>
          <Button variant={ showType === 'all' ? 'octo-blue' : 'octo-white' } 
            size="sm" onClick={() => setShowType('all')}>All</Button>
        </HStack>
      </Flex>
      <Box p={2} bg={bg} mt={4} borderRadius="lg" pb={6}>
        <Box p={6}>
          <Grid templateColumns={{ base: 'repeat(5, 1fr)', md: 'repeat(8, 1fr)', lg: 'repeat(10, 1fr)' }} gap={2}>
            <GridItem colSpan={2}>
              <Text variant="gray">Validator ID</Text>
            </GridItem>
            <GridItem colSpan={2} display={{ base: 'none', md: 'table-cell' }} textAlign="center">
              <Text variant="gray">State</Text>
            </GridItem>
            <GridItem colSpan={2} textAlign="center">
              <Text variant="gray">Total Staked</Text>
            </GridItem>
            <GridItem colSpan={2} display={{ base: 'none', lg: 'table-cell' }} textAlign="center">
              <Text variant="gray">Own Staked</Text>
            </GridItem>
            <GridItem colSpan={1} display={{ base: 'none', md: 'table-cell' }} textAlign="center">
              <Text variant="gray">Delegators</Text>
            </GridItem>
            <GridItem colSpan={1} textAlign="right">
              <Text variant="gray">Operation</Text>
            </GridItem>
          </Grid>
        </Box>
        {
          !validators && !error ?
          <Center minH="260px">
            <Spinner size="lg" thickness="5px" speed="1s" color="octo-blue.500" />
          </Center> :
          <List spacing={3} mt={2}>
            {
              validators?.map((v, idx) => (
                <ValidatorRow validator={v} key={`validator-${idx}`} anchor={anchor} appchainValidators={appchainValidators}
                  ftMetadata={appchain?.appchain_metadata.fungible_token_metadata} showType={showType} />
              ))
            }
          </List>
        }
      </Box>
    </>
  );
}