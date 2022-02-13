import React, { useEffect } from 'react';

import {
  Box,
  useColorModeValue
} from '@chakra-ui/react';

import {
  Header,
  Footer
} from 'components';

import { 
  Near,
  keyStores, 
  WalletConnection
} from 'near-api-js';

import { 
  near as nearConfig, 
  REGISTRY_CONTRACT_ID
} from 'config';

import { RegistryContract } from 'types';

import { Outlet } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

import { useGlobalStore } from 'stores';

export const Root: React.FC = () => {

  const headerBg = useColorModeValue('whiteAlpha.800', 'whiteAlpha.50');
  const homeBodyBg = useColorModeValue('white', '#0b0c21');
  const otherPageBodyBg = useColorModeValue('#f6f7fa', '#0b0c21');
  const location = useLocation();

  const { updateGlobal } = useGlobalStore();

  // init global
  useEffect(() => {
    const near = new Near({
      keyStore: new keyStores.BrowserLocalStorageKeyStore(),
      ...nearConfig,
    });

    const wallet = new WalletConnection(near, REGISTRY_CONTRACT_ID);

    const registry = new RegistryContract(
      wallet.account(),
      REGISTRY_CONTRACT_ID,
      {
        viewMethods: [],
        changeMethods: []
      }
    );

    updateGlobal({
      accountId: wallet.getAccountId(),
      near,
      wallet,
      registry
    });

  }, []);

  // change body bg in different page
  useEffect(() => {
    if (location.pathname === '/home') {
      document.body.style.background = homeBodyBg;
    } else {
      document.body.style.background = otherPageBodyBg;
    }
  }, [location, homeBodyBg, otherPageBodyBg]);

  return (
    <>
      <Box position="relative" zIndex="99" bgColor={headerBg}>
        <Header />
      </Box>
      <Outlet />
      <Box mt={16}>
        <Footer />
      </Box>
    </>
  );
}