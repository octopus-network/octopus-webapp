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
  RegistryContract, 
  TokenContract,
  NetworkConfig,
  BridgeHistory,
  BridgeHistoryStatus
} from 'types';

import { Outlet } from 'react-router-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMatchMutate } from 'hooks';
import { useGlobalStore, useTxnsStore } from 'stores';

import { API_HOST } from 'config';

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
  const { txns, updateTxn } = useTxnsStore();

  const matchMutate = useMatchMutate();

  // initialize
  useEffect(() => {

    axios.get(`${API_HOST}/network-config`).then(res => res.data).then((network: NetworkConfig) => {
      const near = new Near({
        keyStore: new keyStores.BrowserLocalStorageKeyStore(),
        ...network.near,
      });
  
      const wallet = new WalletConnection(near, network.octopus.registryContractId);
  
      const registry = new RegistryContract(
        wallet.account(),
        network.octopus.registryContractId,
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
        network.octopus.octTokenContractId,
        {
          viewMethods: ['ft_balance_of'],
          changeMethods: ['ft_transfer_call']
        }
      );

      updateGlobal({
        accountId: wallet.getAccountId(),
        wallet,
        registry,
        octToken,
        network 
      });
  
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
      axios.post(`${API_HOST}/update-appchains`).then(() => {
        // refresh cache
        matchMutate(/^appchain\//);
        matchMutate(/^appchains\//);
      });
    }
  }, [location.pathname, navigate, matchMutate]);

  const onAppchainTokenBurnt = ({
    hash,
    appchainId,
    nearAccount,
    appchainAccount,
    amount,
    notificationIndex
  }: {
    hash: string;
    appchainId: string;
    nearAccount: string;
    appchainAccount: string;
    amount: string;
    notificationIndex: string;
  }) => {
    
    const tmpHistory: BridgeHistory = {
      isAppchainSide: false,
      appchainId,
      hash,
      sequenceId: notificationIndex as any * 1,
      fromAccount: nearAccount,
      toAccount: appchainAccount,
      amount,
      status: BridgeHistoryStatus.Pending,
      timestamp: new Date().getTime()
    }

    updateTxn(appchainId, tmpHistory);
  }

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
      clearMessageAndHashes();
      return;
    } else if (transactionHashes) {
      if (!/bridge/.test(location.pathname)) {
        toastIdRef.current = toast({
          position: 'top-right',
          render: () => <LoadingSpinner />,
          status: 'info',
          duration: null
        });
      }
    } else {
      return;
    }

    const provider = new providers.JsonRpcProvider(global.network?.near.archivalUrl);
    
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

          if (outcome.logs?.length) {
            
            const log = outcome.logs[0];
            console.log(log, outcome.logs);
            const res = /Wrapped appchain token burnt by '(.+)' for '(.+)' of appchain. Amount: '(.+)', Crosschain notification index: '(.+)'/.exec(log);
            if (res?.length) {
              const nearAccount = res[1],
                appchainAccount = res[2],
                amount = res[3],
                notificationIndex = res[4];

              const appchainId = status.transaction.receiver_id.split('.')?.[0];
              
              onAppchainTokenBurnt({
                hash: status.transaction.hash, 
                appchainId, 
                nearAccount, 
                appchainAccount, 
                amount, 
                notificationIndex
              });
            }
          }
        }
        if (message) {
          throw new Error(message);
        }

        if (toastIdRef.current) {
          toast.update(toastIdRef.current, {
            description: 'Success',
            duration: 2500,
            variant: 'left-accent',
            status: 'success'
          });
        }

        checkRedirect();
  
      }).catch(err => {
        toast.update(toastIdRef.current, {
          description: err?.kind?.ExecutionError || err.toString(),
          duration: 5000,
          status: 'error'
        });
      });
      
    clearMessageAndHashes();

  }, [global, urlParams]);

  const clearMessageAndHashes = useCallback(() => {
    const { protocol, host, pathname, hash } = window.location;
    urlParams.delete('errorMessage');
    urlParams.delete('errorCode');
    urlParams.delete('transactionHashes');
    const params = urlParams.toString();
    const newUrl = `${protocol}//${host}${pathname}${params ? '?' + params : ''}${hash}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  }, [urlParams]);

  return (
    <SWRConfig 
      value={{
        refreshInterval: 60 * 1000,
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