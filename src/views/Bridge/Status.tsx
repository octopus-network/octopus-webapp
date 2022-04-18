import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import Identicon from '@polkadot/react-identicon';
import { encodeAddress } from '@polkadot/util-crypto';

import {
  Box,
  Grid,
  HStack,
  Heading,
  Text,
  Tooltip,
  Spinner,
  Button,
  Skeleton,
  Avatar,
  GridItem,
  Center,
  List,
  Link,
  Flex,
  Tag,
  useColorModeValue
} from '@chakra-ui/react';

import { DecimalUtil } from 'utils';
import { Link as RouterLink } from 'react-router-dom';

import { 
  AppchainInfoWithAnchorStatus
} from 'types';

import nearLogo from 'assets/near.svg';
import { useGlobalStore } from 'stores';

enum BridgeStatus {
  Pending,
  Success,
  Failed
}

type BridgeHistory = {
  direction: string;
  appchain_name: string;
  amount: string;
  from: string;
  to: string;
  outHash: string;
  inHash: string;
  status: BridgeStatus,
  timestamp: number;
  message?: string;
}

type RowProps = {
  data: BridgeHistory;
  network: any;
}

dayjs.extend(relativeTime);

const statusObj: Record<BridgeStatus, {
  color: string;
  label: string;
}> = {
  [BridgeStatus.Pending]: {
    color: 'green',
    label: 'Pending'
  },
  [BridgeStatus.Success]: {
    color: 'blue',
    label: 'Success'
  },
  [BridgeStatus.Failed]: {
    color: 'red',
    label: 'Failed'
  }
}

const Row: React.FC<RowProps> = ({ data, network }) => {
  const bg = useColorModeValue('white', '#15172c');
  const { data: appchain } = useSWR<AppchainInfoWithAnchorStatus>(`appchain/${data.appchain_name.replace(`${network}-`, '')}`);

  const isAppchainSide = useMemo(() => data.direction === 'appchain_to_near', [data]);

  console.log(isAppchainSide, data.from, data.to);

  return (
    <Skeleton isLoaded={!!appchain}>
    <Grid templateColumns="repeat(13, 1fr)" p={6} bg={bg} borderRadius="lg" gap={6} alignItems="center">
      <GridItem colSpan={2}>
        <HStack>
          <Avatar boxSize={6} src={isAppchainSide ? appchain?.appchain_metadata?.fungible_token_metadata?.icon as any : nearLogo} />
          <Heading fontSize="md">
            {
              appchain ?
              DecimalUtil.beautify(DecimalUtil.fromString(data.amount.replaceAll(',', ''), appchain?.appchain_metadata?.fungible_token_metadata?.decimals)) :
              '-'
            }
          </Heading>
          <Text fontSize="sm" color="gray.500">
            -
          </Text>
        </HStack>
      </GridItem>
      <GridItem colSpan={2}>
        <Link href="" _hover={{ textDecoration: 'underline' }} color="#2468f2">
          <HStack>
            {
              isAppchainSide ?
              <Identicon value={data.from} size={18} /> : null
            }
            <Text whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
              {isAppchainSide && data.from ? encodeAddress(data.from) : data.from}
            </Text>
          </HStack>
        </Link>
      </GridItem>
      <GridItem colSpan={2}>
      </GridItem>
      <GridItem colSpan={1}>
      </GridItem>
      <GridItem colSpan={2}>
        <Link href="" _hover={{ textDecoration: 'underline' }} color="#2468f2">
          <HStack>
            {
              !isAppchainSide ?
              <Identicon value={data.to} size={18} /> : null
            }
            <Text whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
              {!isAppchainSide && data.to ? encodeAddress(data.to) : data.to}
            </Text>
          </HStack>
        </Link>
      </GridItem>
      <GridItem colSpan={2}>
      </GridItem>
      <GridItem colSpan={2} textAlign="right">
        <Text fontSize="sm" color="gray.500">{dayjs(data.timestamp).fromNow()}</Text>
      </GridItem>
      {/*
      <GridItem colSpan={2}>
        <Link href="" _hover={{ textDecoration: 'underline' }} color="#2468f2">
          <Text whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">{data.outHash}</Text>
        </Link>
      </GridItem>
      <GridItem colSpan={1}>
        {
          data.message ?
          <Tooltip label={data.message}>
            <Tag size="sm" colorScheme={statusObj[data.status].color}>{statusObj[data.status].label}</Tag>
          </Tooltip> :
          <Tag size="sm" colorScheme={statusObj[data.status].color}>{statusObj[data.status].label}</Tag>
        }
        
      </GridItem>
      <GridItem colSpan={2}>
        <Link href="" _hover={{ textDecoration: 'underline' }} color="#2468f2">
          <HStack>
            {
              !isAppchainSide ?
              <Identicon value={data.toAccount} size={18} /> : null
            }
            <Text whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">{data.toAccount}</Text>
          </HStack>
        </Link>
      </GridItem>
      <GridItem colSpan={2}>
        {
          data.inHash ?
          <Link href="" _hover={{ textDecoration: 'underline' }} color="#2468f2">
            <Text whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">{data.inHash}</Text>
          </Link> : 
          '-'
        }
      </GridItem>
      <GridItem colSpan={2} textAlign="right">
        <Text fontSize="sm" color="gray.500">{dayjs(data.timestamp).fromNow()}</Text>
      </GridItem> */}
    </Grid>
    </Skeleton>
  )
}

export const Status: React.FC = () => {

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { global } = useGlobalStore();

  const { data: txns } = useSWR<any[]>(
    `bridge-helper/bridge_txs?start=${((page - 1) * pageSize)}&size=${pageSize}`, 
    { refreshInterval: 3000 }
  );

  // const [list, setList] = useState<BridgeHistory[]>([
  //   {
  //     isAppchainSide: false,
  //     appchainId: 'fusotao',
  //     amount: '1234567800000000000',
  //     outHash: 'GWUekaQbgobaAKm8gYPoSECn6p8c3qiKUBTt4WX3n8KJ',
  //     inHash: '',
  //     fromAccount: 'cz.testnet',
  //     toAccount: '5G3nCM9xhWe4TeoqUpavKXqHPHoCEThn7oR9SJkCV6XirvHQ',
  //     status: BridgeStatus.Pending,
  //     timestamp: new Date().getTime()
  //   },
  //   {
  //     isAppchainSide: true,
  //     appchainId: 'fusotao',
  //     amount: '1234567800000000000',
  //     outHash: '0x99aae7cedb06c42f9d961b8134700c1198dbe800d9ddec4284caa4a8321406fe',
  //     inHash: 'GWUekaQbgobaAKm8gYPoSECn6p8c3qiKUBTt4WX3n8KJ',
  //     fromAccount: '5G3nCM9xhWe4TeoqUpavKXqHPHoCEThn7oR9SJkCV6XirvHQ',
  //     toAccount: 'cz.testnet',
  //     status: BridgeStatus.Success,
  //     timestamp: new Date().getTime() - 50 * 1000
  //   },
  //   {
  //     isAppchainSide: false,
  //     appchainId: 'fusotao',
  //     amount: '1234567800000000000',
  //     outHash: 'GWUekaQbgobaAKm8gYPoSECn6p8c3qiKUBTt4WX3n8KJ',
  //     inHash: '',
  //     fromAccount: 'cz.testnet',
  //     toAccount: '5G3nCM9xhWe4TeoqUpavKXqHPHoCEThn7oR9SJkCV6XirvHQ',
  //     status: BridgeStatus.Failed,
  //     message: 'Burn Asset Failed',
  //     timestamp: new Date().getTime() - 100 * 1000
  //   },
  //   {
  //     isAppchainSide: true,
  //     appchainId: 'fusotao',
  //     amount: '1234567800000000000',
  //     outHash: '0x99aae7cedb06c42f9d961b8134700c1198dbe800d9ddec4284caa4a8321406fe',
  //     inHash: '',
  //     fromAccount: '5G3nCM9xhWe4TeoqUpavKXqHPHoCEThn7oR9SJkCV6XirvHQ',
  //     toAccount: 'cz.testnet',
  //     status: BridgeStatus.Pending,
  //     timestamp: new Date().getTime() - 150 * 1000
  //   },
  //   {
  //     isAppchainSide: false,
  //     appchainId: 'fusotao',
  //     amount: '1234567800000000000',
  //     outHash: 'GWUekaQbgobaAKm8gYPoSECn6p8c3qiKUBTt4WX3n8KJ',
  //     inHash: '0x99aae7cedb06c42f9d961b8134700c1198dbe800d9ddec4284caa4a8321406fe',
  //     fromAccount: 'cz.testnet',
  //     toAccount: '5G3nCM9xhWe4TeoqUpavKXqHPHoCEThn7oR9SJkCV6XirvHQ',
  //     status: BridgeStatus.Success,
  //     timestamp: new Date().getTime() - 200 * 1000
  //   },
  //   {
  //     isAppchainSide: true,
  //     appchainId: 'fusotao',
  //     amount: '1234567800000000000',
  //     outHash: '0x99aae7cedb06c42f9d961b8134700c1198dbe800d9ddec4284caa4a8321406fe',
  //     inHash: '',
  //     fromAccount: '5G3nCM9xhWe4TeoqUpavKXqHPHoCEThn7oR9SJkCV6XirvHQ',
  //     message: 'Max amount limit',
  //     toAccount: 'cz.testnet',
  //     status: BridgeStatus.Failed,
  //     timestamp: new Date().getTime() - 250 * 1000
  //   }
  // ]);

  return (
    <Box mt={12}>
      <Flex justifyContent="space-between" alignItems="center">
        <Heading fontSize="xl">Recent Transactions</Heading>
        <RouterLink to="/bridge">
          <Button variant="link" color="#2468f2" size="sm">Back to Bridge</Button>
        </RouterLink>
      </Flex>
      <Grid templateColumns="repeat(13, 1fr)" p={4} color="gray.500" gap={6} fontSize="sm">
        <GridItem colSpan={2}>
          <Text>Token</Text>
        </GridItem>
        <GridItem colSpan={2}>
          <Text>From</Text>
        </GridItem>
        <GridItem colSpan={2}>
          <Text>Out Hash</Text>
        </GridItem>
        <GridItem colSpan={1}>
          <Text>Status</Text>
        </GridItem>
        <GridItem colSpan={2}>
          <Text>To</Text>
        </GridItem>
        <GridItem colSpan={2}>
          <Text>In Hash</Text>
        </GridItem>
        <GridItem colSpan={2} textAlign="right">
          <Text>Time</Text>
        </GridItem>
      </Grid>
      {
        txns?.length ?
        <List spacing={5}>
          {
            txns.map((tx, idx) => (
              <Row data={tx} key={`row-${idx}`} network={global.network?.near.networkId} />
            ))
          }
        </List> :
        <Center minH="320px">
          <Spinner size="md" thickness="4px" speed="1s" color="octo-blue.500" />
        </Center>
      }
    </Box>
  );
}