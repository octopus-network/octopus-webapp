import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import dayjs from 'dayjs';
import Decimal from 'decimal.js';

import {
  DrawerHeader,
  DrawerBody,
  Avatar,
  Heading,
  Text,
  Box,
  CloseButton,
  Flex,
  HStack,
  DrawerFooter,
  VStack,
  useColorModeValue
} from '@chakra-ui/react';

import { AppchainInfo } from 'types';
import { StateBadge, LoginButton } from 'components';

import { Links } from './Links';
import { Descriptions } from './Descriptions';
import { UserPanel } from './UserPanel';
import { AdminPanel } from './AdminPanel';
import { useGlobalStore } from 'stores';
import { DecimalUtil } from 'utils';

import octoAvatar from 'assets/icons/avatar.png';

type OverviewProps = {
  appchainId: string | undefined;
  onDrawerClose: VoidFunction;
}

export const Overview: React.FC<OverviewProps> = ({ appchainId, onDrawerClose }) => {

  const { global } = useGlobalStore();
  const [isAdmin, setIsAdmin] = useState(false);

  const { data: appchain } = useSWR<AppchainInfo>(`appchain/${appchainId}`);
  const footerBg = useColorModeValue('#f6f7fa', '#15172c');

  const { data: balances } = useSWR(global.accountId ? `balances/${global.accountId}` : null);

  useEffect(() => {
    global.registry?.get_owner().then(owner => {
      setIsAdmin(owner === global.accountId);
    });
  }, [global]);

  return (
    <>
      <DrawerHeader borderBottomWidth="0">
        <Flex justifyContent="space-between" alignItems="center">
          <Heading fontSize="lg">Overview</Heading>
          <CloseButton onClick={onDrawerClose} />
        </Flex>
      </DrawerHeader>
      <DrawerBody>
        <Flex alignItems="center" justifyContent="space-between">
          <HStack>
            <Avatar src={appchain?.appchain_metadata?.fungible_token_metadata.icon as any} 
              name={appchainId} boxSize={10} />
            <VStack alignItems="flex-start" spacing={0}>
              <Heading fontSize="xl">{appchainId}</Heading>
              <Text variant="gray">{appchain?.appchain_owner}</Text>
            </VStack>
          </HStack>
          <VStack alignItems="flex-end" spacing={0}>
            <StateBadge state={appchain?.appchain_state || ''} />
            <Text variant="gray">
              {appchain ? dayjs(Math.floor(appchain.registered_time as any/1e6)).format('YYYY-MM-DD') : '-'}
            </Text>
          </VStack>
        </Flex>
        <Box mt={6}>
          <Links data={appchain} />
        </Box>
        <Box mt={6}>
          <Descriptions data={appchain} />
        </Box>
        <Box mt={6}>
          {
            isAdmin ?
            <AdminPanel data={appchain} /> :
            global.accountId ?
            <UserPanel data={appchain} /> : null
          }
          
        </Box>
      </DrawerBody>
      <DrawerFooter justifyContent="flex-start">
        <Box bg={footerBg} p={4} borderRadius="lg" w="100%">
          <Flex justifyContent="space-between">
            {
              global.accountId ?
              <HStack>
                <Avatar boxSize={6} src={octoAvatar} display={{ base: 'none', md: 'block' }} />
                <Heading fontSize="sm">{global.accountId}</Heading>
              </HStack> : 
              <LoginButton />
            }
            {
              global.accountId ?
              <HStack>
                <Text variant="gray" display={{ base: 'none', md: 'block' }}>Balance:</Text>
                <Heading fontSize="md" color="octo-blue.500">
                  {DecimalUtil.beautify(new Decimal(balances?.['OCT'] || 0))} OCT
                </Heading>
              </HStack> : null
            }
          </Flex>
        </Box>
      </DrawerFooter>
    </>
  );
}