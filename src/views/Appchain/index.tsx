import React, { useMemo, useState, useEffect } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';

import useSWR from 'swr';

import {
  Container,
  Box,
  Grid,
  GridItem
} from '@chakra-ui/react';

import { 
  AppchainInfoWithAnchorStatus, 
  AnchorContract, 
  AppchainSettings, 
  TokenContract
} from 'types';

import { useParams } from 'react-router-dom';
import { Breadcrumb } from 'components';

import { Descriptions } from './Descriptions';
import { MyStaking } from './MyStaking';
import { MyNode } from './MyNode';
import { Validators } from './Validators';
import { useGlobalStore } from 'stores';

export const Appchain: React.FC = () => {
  const { id } = useParams();

  const { global } = useGlobalStore();
  const { data: appchain } = useSWR<AppchainInfoWithAnchorStatus>(id ? `appchain/${id}` : null);
  const { data: appchainSettings } = useSWR<AppchainSettings>(id ? `appchain-settings/${id}` : null);

  const [appchainApi, setAppchainApi] = useState<ApiPromise>();

  const [anchor, setAnchor] = useState<AnchorContract>();
  const [wrappedAppchainToken, setWrappedAppchainToken] = useState<TokenContract>();

  useEffect(() => {
    if (!appchain || !global.accountId) {
      return;
    }

    const anchorContract = new AnchorContract(
      global.wallet?.account() as any,
      appchain.appchain_anchor,
      {
        viewMethods: [
          'get_protocol_settings',
          'get_validator_deposit_of',
          'get_wrapped_appchain_token',
          'get_delegator_deposit_of'
        ],
        changeMethods: [
          'enable_delegation',
          'disable_delegation',
          'decrease_stake',
          'withdraw_validator_rewards'
        ]
      }
    );

    anchorContract.get_wrapped_appchain_token().then(wrappedToken => {
      setWrappedAppchainToken(new TokenContract(
        global.wallet?.account() as any,
        wrappedToken.contract_account,
        {
          viewMethods: ['storage_balance_of', 'ft_balance_of'],
          changeMethods: []
        }
      ));
    });

    setAnchor(anchorContract);

  }, [appchain, global]);

  useEffect(() => {
    if (!appchainSettings) {
      return;
    }

    const provider = new WsProvider(appchainSettings.rpc_endpoint);
    const api = new ApiPromise({ provider });

    api.isReady.then(api => setAppchainApi(api));

  }, [appchainSettings]);

  return (
    <>
      <Container>
        <Box mt={5}>
          <Breadcrumb links={[{ to: '/home', label: 'Home' }, { to: '/appchains', label: 'Appchains' }, { label: id }]} />
        </Box>
        <Grid templateColumns={{ base: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' }} gap={5} mt={5}>
          <GridItem colSpan={3}>
            <Descriptions appchain={appchain} appchainApi={appchainApi} appchainSettings={appchainSettings} />
          </GridItem>
          <GridItem colSpan={{ base: 3, lg: 2 }}>
            <MyStaking appchain={appchain} anchor={anchor} wrappedAppchainToken={wrappedAppchainToken} />
            <Box mt={5}>
              <MyNode appchainId={id} />
            </Box>
          </GridItem>
        </Grid>
        <Box mt={8}>
          <Validators 
            appchain={appchain} 
            appchainApi={appchainApi}
            anchor={anchor} />
        </Box>
      </Container>
    </>
  );
}