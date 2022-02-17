import React, { useMemo } from 'react';
import useSWR from 'swr';

import {
  Container,
  Box,
  Grid,
  GridItem
} from '@chakra-ui/react';

import { useParams } from 'react-router-dom';
import { Breadcrumb } from 'components';

import { Descriptions } from './Descriptions';
import { MyStaking } from './MyStaking';
import { MyNode } from './MyNode';
import { Validators } from './Validators';
import { AppchainInfoWithAnchorStatus, AnchorContract } from 'types';
import { useGlobalStore } from 'stores';

export const Appchain: React.FC = () => {
  const { id } = useParams();

  const { global } = useGlobalStore();
  const { data: appchain } = useSWR<AppchainInfoWithAnchorStatus>(`appchain/${id}`);

  const anchor = useMemo(() => appchain ? new AnchorContract(
    global.wallet?.account() as any,
    appchain.appchain_anchor,
    {
      viewMethods: [
        'get_protocol_settings',
        'get_validator_deposit_of'
      ],
      changeMethods: [
        'enable_delegation',
        'disable_delegation',
        'decrease_stake'
      ]
    }
  ) : null, [appchain, global]);

  return (
    <>
      <Container>
        <Box mt={5}>
          <Breadcrumb links={[{ to: '/home', label: 'Home' }, { to: '/appchains', label: 'Appchains' }, { label: id }]} />
        </Box>
        <Grid templateColumns={{ base: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' }} gap={5} mt={5}>
          <GridItem colSpan={3}>
            <Descriptions data={appchain} />
          </GridItem>
          <GridItem colSpan={{ base: 3, lg: 2 }}>
            <MyStaking appchain={appchain} anchor={anchor} />
            <Box mt={5}>
              <MyNode appchainId={id} />
            </Box>
          </GridItem>
        </Grid>
        <Box mt={8}>
          <Validators 
            appchainId={appchain?.appchain_id} 
            anchor={anchor} 
            era={appchain?.anchor_status?.index_range_of_validator_set_history?.end_index}
            ftMetadata={appchain?.appchain_metadata?.fungible_token_metadata as any} />
        </Box>
      </Container>
    </>
  );
}