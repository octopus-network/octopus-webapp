import React, { useEffect, useMemo, useCallback, useRef } from 'react';

import { SWRConfig } from 'swr';
import axios from 'axios';

import {
  Box,
  useColorModeValue,
  useToast,
  Spinner
} from '@chakra-ui/react';

import {
  Header,
  Footer
} from 'components';

import { 
  Near,
  keyStores, 
  WalletConnection,
  providers
} from 'near-api-js';

import { 
  near as nearConfig, 
  REGISTRY_CONTRACT_ID,
  OCT_TOKEN_CONTRACT_ID,
  API_HOST
} from 'config';

import { 
  RegistryContract, 
  TokenContract 
} from 'types';

import { Outlet } from 'react-router-dom';
import { useLocation, useNavigate } from 'react-router-dom';

import { useGlobalStore } from 'stores';

const LoadingSpinner = () => {
  return (
    <Box p={2}>
      <Spinner
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.200"
        color="octo-blue.500"
        size="md"
      />
    </Box>
  );
}

export const Root: React.FC = () => {

  const headerBg = useColorModeValue('whiteAlpha.800', 'whiteAlpha.50');
  const homeBodyBg = useColorModeValue('white', '#0b0c21');
  const otherPageBodyBg = useColorModeValue('#f6f7fa', '#0b0c21');
  const location = useLocation();

  const navigate = useNavigate();

  const toast = useToast();
  const toastIdRef = useRef<any>();
  const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);

  const { updateGlobal, global } = useGlobalStore();

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
        viewMethods: [
          'get_owner',
          'get_upvote_deposit_for',
          'get_downvote_deposit_for'
        ],
        changeMethods: [
          'withdraw_upvote_deposit_of',
          'withdraw_downvote_deposit_of'
        ]
      }
    );

    const octToken = new TokenContract(
      wallet.account(),
      OCT_TOKEN_CONTRACT_ID,
      {
        viewMethods: ['ft_balance_of'],
        changeMethods: ['ft_transfer_call']
      }
    );

    updateGlobal({
      accountId: wallet.getAccountId(),
      near,
      wallet,
      registry,
      octToken
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

  const checkRedirect = useCallback(() => {
    if (/appchains\/join/.test(location.pathname)) {
      navigate('/appchains');
    } else if (/appchains\/overview/.test(location.pathname)) {
      axios.post(`${API_HOST}/update-appchains`);
    }
  }, [location.pathname, navigate]);

  // check tx status
  useEffect(() => {
    if (!global?.accountId) {
      return;
    }

    const transactionHashes = urlParams.get('transactionHashes') || '';
    const errorMessage = urlParams.get('errorMessage') || '';

    if (errorMessage) {
      toast({
        position: 'top-right',
        description: decodeURIComponent(errorMessage),
        status: 'error'
      });
      return;
    } else if (transactionHashes) {
      toastIdRef.current = toast({
        position: 'top-right',
        render: () => <LoadingSpinner />,
        status: 'info',
        duration: null
      });
    } else {
      return;
    }

    const provider = new providers.JsonRpcProvider(nearConfig.archivalUrl);
    
    provider
      .txStatus(transactionHashes, global.accountId)
      .then(status => {
        const { receipts_outcome } = status;
        let message = '';
        for (let i = 0; i < receipts_outcome.length; i++) {
          const { outcome } = receipts_outcome[i];
          if ((outcome.status as any).Failure) {
            message = JSON.stringify((outcome.status as any).Failure);
            break;
          }
        }
        if (message) {
          throw new Error(message);
        } else {

          toast.update(toastIdRef.current, {
            description: 'Success',
            duration: 2500,
            variant: 'left-accent',
            status: 'success'
          });

          checkRedirect();
        }
      });
      
    // clear message
    const { protocol, host, pathname, hash } = window.location;
    urlParams.delete('errorMessage');
    urlParams.delete('transactionHashes');
    const params = urlParams.toString();
    const newUrl = `${protocol}//${host}${pathname}${params ? '?' + params : ''}${hash}`;
    window.history.pushState({ path: newUrl }, '', newUrl);

  }, [global, urlParams]);

  return (
    <SWRConfig 
      value={{
        refreshInterval: 10 * 1000,
        fetcher: api => axios.get(`${API_HOST}/${api}`).then(res => res.data)
      }}
    >
      <Box position="relative" zIndex="99" bgColor={headerBg}>
        <Header />
      </Box>
      <Outlet />
      <Box mt={16}>
        <Footer />
      </Box>
    </SWRConfig>
  );
}