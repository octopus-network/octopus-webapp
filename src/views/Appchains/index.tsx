import React, { useState, useMemo, useEffect } from 'react';

import {
  Container,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  Box
} from '@chakra-ui/react';

import { 
  JoinBanner, 
  RunningAppchains 
} from 'components';

import { Statistics } from './Statistics';
import { Booting } from './Booting';
import { Voting } from './Voting';
import { Established } from './Established';

import { Overview } from './Overview';
import { useParams, useNavigate } from 'react-router-dom';

export const Appchains: React.FC = () => {
  const { appchainId } = useParams();
  const navigate = useNavigate();

  const drawerIOpen = useMemo(() => !!appchainId, [appchainId]);

  useEffect(() => {
    if (drawerIOpen) {
      (document.getElementById('root') as any).style = 'transition: all .3s ease-in-out; transform: translateX(-15%)';
    } else {
      (document.getElementById('root') as any).style = 'transition: all .15s ease-in-out; transform: translateX(0)';
    }
  }, [drawerIOpen]);

  const onDrawerClose = () => {
    navigate(`/appchains`);
  }

  return (
    <>
      <Container>
        <Box mt={10} display={{ base: 'none', md: 'block' }}>
          <JoinBanner />
        </Box>
        <Box mt={10}>
          <RunningAppchains showMore={false} />
        </Box>
        <Box mt={10}>
          <Statistics />
        </Box>
        <Box mt={10}>
          <Booting />
        </Box>
        <Box mt={10}>
          <Voting />
        </Box>
        <Box mt={10}>
          <Established />
        </Box>
      </Container>
      <Drawer 
        placement="right" 
        isOpen={drawerIOpen} 
        onClose={onDrawerClose} 
        size="lg">
        <DrawerOverlay />
        <DrawerContent>
          <Overview appchainId={appchainId} onDrawerClose={onDrawerClose} />
        </DrawerContent>
      </Drawer>
    </>
  );
}