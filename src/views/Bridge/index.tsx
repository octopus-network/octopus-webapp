import React, { useMemo } from 'react';

import {
  Container,
  Grid,
  GridItem,
  useBoolean,
  SlideFade,
  ScaleFade,
  Fade
} from '@chakra-ui/react';

import { Appchains } from './Appchains';
import { BridgePanel } from './BridgePanel';
import { Status } from './Status';
import { useLocation } from 'react-router-dom';

export const Bridge: React.FC = () => {
  const location = useLocation();

  const showTxs = useMemo(() => {
    return location.pathname === '/bridge/txs';
  }, [location]);

  return (
    <Container position="relative">

      <SlideFade in={showTxs}>
        {
          showTxs ?
          <Status /> : null
        }
      </SlideFade>
      <SlideFade in={!showTxs}>
        {
          !showTxs ?
          <Grid templateColumns={{ base: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' }} mt={12} gap={6} top={0}>
            <GridItem colSpan={3}>
              <Appchains />
            </GridItem>
            <GridItem colSpan={3}>
              <BridgePanel />
            </GridItem>
          </Grid> : null
        }
      </SlideFade>
    </Container>
  );
}