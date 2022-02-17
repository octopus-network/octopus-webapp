import React, { useEffect } from 'react';
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

import { 
  Validator, 
  AnchorContract, 
  FungibleTokenMetadata 
} from 'types';

import { ValidatorRow } from './ValidatorRow';

type ValidatorsProps = {
  appchainId: string | undefined;
  ftMetadata: FungibleTokenMetadata;
  era: string | undefined;
  anchor: AnchorContract | null;
}

export const Validators: React.FC<ValidatorsProps> = ({ appchainId, anchor, ftMetadata, era }) => {
  const bg = useColorModeValue('white', '#15172c');

  const { data: validators, error } = useSWR<Validator[]>(appchainId && era ? `validators/${appchainId}/${era}` : null);

  return (
    <>
      <Flex justifyContent="space-between" alignItems="center">
        <Heading fontSize="xl">Validators</Heading>
        <HStack>
          <Button variant="octo-white" size="sm">Staker</Button>
          <Button variant="octo-white" size="sm">Voting</Button>
          <Button colorScheme="octo-blue" size="sm">All</Button>
        </HStack>
      </Flex>
      <Box p={2} bg={bg} mt={4} borderRadius="lg" pb={6}>
        <Box p={6}>
          <Grid templateColumns={{ base: 'repeat(6, 1fr)', md: 'repeat(8, 1fr)', lg: 'repeat(10, 1fr)' }}>
            <GridItem colSpan={2}>
              <Text variant="gray">Validator ID</Text>
            </GridItem>
            <GridItem colSpan={1} display={{ base: 'none', md: 'table-cell' }}>
              <Text variant="gray">State</Text>
            </GridItem>
            <GridItem colSpan={2}>
              <Text variant="gray">Total Staked</Text>
            </GridItem>
            <GridItem colSpan={2} display={{ base: 'none', lg: 'table-cell' }}>
              <Text variant="gray">Own Staked</Text>
            </GridItem>
            <GridItem colSpan={1} display={{ base: 'none', md: 'table-cell' }}>
              <Text variant="gray">Delegators</Text>
            </GridItem>
            <GridItem colSpan={2} textAlign="right">
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
                <ValidatorRow validator={v} key={`validator-${idx}`} anchor={anchor} ftMetadata={ftMetadata} />
              ))
            }
          </List>
        }
      </Box>
    </>
  );
}