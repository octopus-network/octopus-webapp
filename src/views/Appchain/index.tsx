import React, { useMemo, useState, useEffect } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';

import useSWR from 'swr';

import {
  Container,
  Box,
  Grid,
  GridItem,
  Drawer,
  DrawerOverlay,
  DrawerContent
} from '@chakra-ui/react';

import { 
  AppchainInfoWithAnchorStatus, 
  AnchorContract, 
  AppchainSettings, 
  ValidatorSessionKey,
  TokenContract,
  Validator
} from 'types';

import { useParams, useNavigate } from 'react-router-dom';
import { Breadcrumb } from 'components';

import { Descriptions } from './Descriptions';
import { MyStaking } from './MyStaking';
import { ValidatorProfile } from './ValidatorProfile';
import { MyNode } from './MyNode';
import { Validators } from './Validators';
import { useGlobalStore } from 'stores';

export const Appchain: React.FC = () => {
  const { id = '', validatorId = '' } = useParams();

  const { global } = useGlobalStore();
  const { data: appchain } = useSWR<AppchainInfoWithAnchorStatus>(id ? `appchain/${id}` : null);
  const { data: appchainSettings } = useSWR<AppchainSettings>(id ? `appchain-settings/${id}` : null);
  const { data: validators, error: validatorsError } = useSWR<Validator[]>(appchain ? `validators/${appchain.appchain_id}` : null);

  const [appchainValidators, setAppchainValidators] = useState<string[]>();
  const [validatorSessionKeys, setValidatorSessionKeys] = useState<Record<string, ValidatorSessionKey>>();

  const [appchainApi, setAppchainApi] = useState<ApiPromise>();
  const navigate = useNavigate();

  const [anchor, setAnchor] = useState<AnchorContract>();
  const [wrappedAppchainToken, setWrappedAppchainToken] = useState<TokenContract>();

  const drawerIOpen = useMemo(() => !!id && !!validatorId, [validatorId]);

  useEffect(() => {
    if (drawerIOpen) {
      (document.getElementById('root') as any).style = 'transition: all .3s ease-in-out; transform: translateX(-5%)';
    } else {
      (document.getElementById('root') as any).style = 'transition: all .15s ease-in-out; transform: translateX(0)';
    }
  }, [drawerIOpen]);

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
          'get_delegator_deposit_of',
          'get_validator_profile',
          'get_delegators_of_validator_in_era',
          'get_unbonded_stakes_of'
        ],
        changeMethods: [
          'enable_delegation',
          'disable_delegation',
          'decrease_stake',
          'withdraw_validator_rewards',
          'unbond_stake'
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

  useEffect(() => {
    appchainApi?.query?.session?.validators()
      .then(vs => {
        setAppchainValidators(vs.map(v => v.toString()));
      });

    if (validators) {
      appchainApi?.query?.session?.nextKeys.multi(
        validators.map(v => v.validator_id_in_appchain)
      ).then(keys => {
        let tmpObj: Record<string, ValidatorSessionKey> = {};
        keys.forEach(
          (key, idx) => tmpObj[validators[idx].validator_id] = key.toJSON() as ValidatorSessionKey
        );

        setValidatorSessionKeys(tmpObj);
      });
    }
    
  }, [appchainApi, validators]);

  const isValidator = useMemo(() => validators?.some(v => v.validator_id === global.accountId && !v.is_unbonding) || false, [validators, global]);
  const isUnbonding = useMemo(() => validators?.some(v => v.validator_id === global.accountId && v.is_unbonding) || false, [validators, global]);
  
  const needKeys = useMemo(() => {
    if (!validatorSessionKeys || !global.accountId) {
      return false;
    }
    return isValidator && !validatorSessionKeys[global.accountId];
  }, [isValidator, global, validatorSessionKeys]);

  const onDrawerClose = () => {
    navigate(`/appchains/${id}`);
  }

  return (
    <>
      <Container>
        <Box mt={5}>
          <Breadcrumb links={[{ to: '/home', label: 'Home' }, { to: '/appchains', label: 'Appchains' }, { label: id }]} />
        </Box>
        <Grid templateColumns={{ base: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' }} gap={5} mt={5}>
          <GridItem colSpan={3}>

            <Descriptions 
              appchain={appchain} 
              appchainApi={appchainApi} 
              appchainSettings={appchainSettings} />
              
          </GridItem>
          <GridItem colSpan={{ base: 3, lg: 2 }}>

            <MyStaking 
              appchain={appchain}
              anchor={anchor}
              isUnbonding={isUnbonding}
              isValidator={isValidator}
              wrappedAppchainToken={wrappedAppchainToken} />

            <Box mt={5}>
              <MyNode appchainId={id} needKeys={needKeys} appchainApi={appchainApi} />
            </Box>

          </GridItem>
        </Grid>
        <Box mt={8}>
          <Validators 
            appchain={appchain}
            isLoadingValidators={!validators && !validatorsError}
            validators={validators}
            appchainValidators={appchainValidators}
            validatorSessionKeys={validatorSessionKeys}
            anchor={anchor} />
        </Box>
      </Container>
      <Drawer 
        placement="right" 
        isOpen={drawerIOpen} 
        onClose={onDrawerClose} 
        size="lg">
        <DrawerOverlay />
        <DrawerContent>
          <ValidatorProfile 
            appchainId={id}
            anchor={anchor}
            validatorId={validatorId}
            appchainValidators={appchainValidators}
            validators={validators}
            validatorSessionKeys={validatorSessionKeys}
            lastEra={appchain?.anchor_status?.index_range_of_validator_set_history?.end_index}
            onDrawerClose={onDrawerClose} />
        </DrawerContent>
      </Drawer>
    </>
  );
}