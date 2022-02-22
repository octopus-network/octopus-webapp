import React from 'react';

import {
  Container,
  Grid,
  GridItem
} from '@chakra-ui/react';

import { Appchains } from './Appchains';
import { BridgePanel } from './BridgePanel';

export const Bridge: React.FC = () => {
  return (
    <Container>
      <Grid templateColumns={{ base: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' }} mt={12} gap={6}>
        <GridItem colSpan={3}>
          <Appchains />
        </GridItem>
        <GridItem colSpan={3}>
          <BridgePanel />
        </GridItem>
      </Grid>
    </Container>
  );
}