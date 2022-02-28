import React, { useState } from 'react';
import useSWR from 'swr';

import {
  Flex,
  Tooltip,
  Button,
  HStack,
  Heading,
  Icon,
  Box,
  Grid,
  GridItem,
  List,
  Avatar,
  useColorModeValue
} from '@chakra-ui/react';

import { 
  QuestionOutlineIcon, 
  ChevronRightIcon 
} from '@chakra-ui/icons';

import {
  StateBadge,
  Empty
} from 'components';

import { AppchainInfo } from 'types';
import { useNavigate } from 'react-router-dom';

type AppchainItemProps = {
  data: AppchainInfo;
}

const AppchainItem: React.FC<AppchainItemProps> = ({ data }) => {
  const hoverBg = useColorModeValue('gray.100', 'whiteAlpha.100');
  const navigate = useNavigate();
  
  return (
    <Box 
      p={4} 
      cursor="pointer"
      borderRadius="lg"
      className="transition"
      backgroundColor="transparent"
      _hover={{
        backgroundColor: hoverBg,
        transform: 'scale(1.01)'
      }}
      onClick={() => navigate(`/appchains/overview/${data.appchain_id}`)}>
      <Grid templateColumns={{ base: 'repeat(7, 1fr)', md: 'repeat(10, 1fr)' }} alignItems="center" gap={6}>
        <GridItem colSpan={3}>
          <HStack>
            <Avatar src={data.appchain_metadata?.fungible_token_metadata?.icon as any} name={data.appchain_id} boxSize={8} />
            <Heading fontSize="md" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">{data.appchain_id}</Heading>
          </HStack>
        </GridItem>
        <GridItem colSpan={3} display={{ base: 'none', md: 'table-cell' }}>
          <Heading fontSize="md">{data.appchain_owner}</Heading>
        </GridItem>
        <GridItem colSpan={3}>
          <Flex>
            <StateBadge state={data.appchain_state} />
          </Flex>
        </GridItem>
        <GridItem colSpan={1} textAlign="right">
          <Icon as={ChevronRightIcon} boxSize={6} className="octo-gray" opacity=".8" />
        </GridItem>
      </Grid>
    </Box>
  );
}

export const Established: React.FC = () => {
  const bg = useColorModeValue('white', '#25263c');

  const [showType, setShowType] = useState('pre-audit');
  const { data: appchains } = useSWR(`appchains/${showType}`);

  return (
    <>
      <Flex alignItems="center" justifyContent="space-between">
        <Tooltip label="Established Appchains, includes 'Registered' and 'Auditing' Appchains.">
          <HStack>
            <Heading fontSize="xl">Established</Heading>
            <Icon as={QuestionOutlineIcon} boxSize={4} className="octo-gray" />
          </HStack>
        </Tooltip>
        <HStack>
          <Button variant={showType === 'registered' ? 'octo-blue' : 'octo-white'}
            size="sm" onClick={() => setShowType('registered')}>Registered</Button>
          <Button variant={showType === 'auditing' ? 'octo-blue' : 'octo-white'}
            size="sm" onClick={() => setShowType('auditing')}>Auditing</Button>
          <Button variant={showType === 'pre-audit' ? 'octo-blue' : 'octo-white'}
            size="sm" onClick={() => setShowType('pre-audit')}>All</Button>
        </HStack>
      </Flex>
      <Box mt={8} bg={bg} p={6} borderRadius="lg">
        {
          appchains?.length ?
          <>
            <Box p={4}>
              <Grid templateColumns={{ base: 'repeat(7, 1fr)', md: 'repeat(10, 1fr)' }} className="octo-gray" gap={6}>
                <GridItem colSpan={3}>ID</GridItem>
                <GridItem colSpan={3} display={{ base: 'none', md: 'table-cell' }}>Founder</GridItem>
                <GridItem colSpan={3}>State</GridItem>
                <GridItem colSpan={1}/>
              </Grid>
            </Box>
            <List>
              {
                appchains.map((appchain: AppchainInfo, idx: number) => (
                  <AppchainItem data={appchain} key={`established-item-${idx}`} />
                ))
              }
            </List>
          </> :
          <Empty />
        }
      </Box>
    </>
  );
}