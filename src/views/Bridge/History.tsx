import React, { useMemo } from 'react';
import dayjs from 'dayjs';

import {
  DrawerHeader,
  Flex,
  Heading,
  CloseButton,
  DrawerBody,
  List,
  Tooltip,
  Text,
  Box,
  Button,
  HStack,
  Avatar,
  Tag,
  CircularProgress,
  useColorModeValue
} from '@chakra-ui/react';

import {
  AppchainInfoWithAnchorStatus,
  BridgeHistory,
  BridgeHistoryStatus,
  TokenAssset
} from 'types';

import { encodeAddress } from '@polkadot/util-crypto';
import { isHex } from '@polkadot/util';
import { DecimalUtil } from 'utils';
import { Empty } from 'components';
import nearLogo from 'assets/near.svg';
import relativeTime from 'dayjs/plugin/relativeTime';

type HistoryProps = {
  appchain: AppchainInfoWithAnchorStatus | undefined;
  histories: BridgeHistory[];
  tokenAssets: TokenAssset[] | undefined;
  onDrawerClose: VoidFunction;
  onClearHistory: VoidFunction;
}

type HistoryItemProps = {
  appchain: AppchainInfoWithAnchorStatus | undefined;
  history: BridgeHistory;
  tokenAssets: TokenAssset[] | undefined;
}

dayjs.extend(relativeTime);

const HistoryItem: React.FC<HistoryItemProps> = ({ appchain, history, tokenAssets }) => {
  const bg = useColorModeValue('#f6f7fa', '#15172c');

  const tokenAsset = useMemo(() => tokenAssets?.find(t => t.contractId === history.tokenContractId), [tokenAssets, history]);

  return (
    <Box p={3} bg={bg} borderRadius="lg">
      <Flex justifyContent="space-between" alignItems="center">
        <HStack maxW="50%">
          <Text variant="gray" fontSize="sm">From</Text>
          <Avatar boxSize={5} name={history.fromAccount} src={history.isAppchainSide ? appchain?.appchain_metadata?.fungible_token_metadata?.icon as any : nearLogo} />
          <Heading fontSize="md" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">{history.fromAccount}</Heading>
        </HStack>
        <HStack alignItems="flex-end" justifyContent="center">
          <Heading fontSize="lg">
            {DecimalUtil.beautify(DecimalUtil.fromString(history.amount, tokenAsset?.metadata?.decimals))}
          </Heading>
          <Heading fontSize="lg">
            {tokenAsset?.metadata?.symbol}
          </Heading>
          {
            history.status === BridgeHistoryStatus.Pending ?
              <CircularProgress color="octo-blue.400" isIndeterminate size="16px" thickness="16px" /> :
              history.message ?
                <Tooltip label={history.message}>
                  <Tag colorScheme={history.status === BridgeHistoryStatus.Succeed ? 'octo-blue' : 'red'} size="sm">
                    {history.status === BridgeHistoryStatus.Succeed ? 'Succeed' : 'Failed'}
                  </Tag>
                </Tooltip> :
                <Tag colorScheme={history.status === BridgeHistoryStatus.Succeed ? 'octo-blue' : 'red'} size="sm">
                  {history.status === BridgeHistoryStatus.Succeed ? 'Succeed' : 'Failed'}
                </Tag>
          }
        </HStack>
      </Flex>
      <Flex mt={2} alignItems="center" justifyContent="space-between">
        <HStack maxW="50%">
          <Text fontSize="md" variant="gray">to</Text>
          <Avatar boxSize={4} name={history.toAccount} src={!history.isAppchainSide ? appchain?.appchain_metadata?.fungible_token_metadata?.icon as any : nearLogo} />
          <Text fontSize="md" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
            {!history.isAppchainSide && isHex(history.toAccount) ? encodeAddress(history.toAccount) : history.toAccount}
          </Text>
        </HStack>
        <Text variant="gray">{dayjs(Math.floor(history.timestamp)).fromNow()}</Text>
      </Flex>
    </Box>
  );
}

export const History: React.FC<HistoryProps> = ({ appchain, histories, onDrawerClose, onClearHistory, tokenAssets }) => {

  return (
    <>
      <DrawerHeader borderBottomWidth="0">
        <Flex justifyContent="space-between" alignItems="center">
          <HStack>
            <Heading fontSize="lg">History</Heading>
            <Button size="sm" onClick={onClearHistory} colorScheme="octo-blue" variant="ghost">Clear</Button>
          </HStack>
          <CloseButton onClick={onDrawerClose} />
        </Flex>
      </DrawerHeader>
      <DrawerBody pb={6}>
        {
          histories.length ?
            <List spacing={6}>
              {
                histories.map(h => (
                  <HistoryItem appchain={appchain} history={h} key={h.hash} tokenAssets={tokenAssets} />
                ))
              }
            </List> :
            <Empty minH="320px" />
        }
      </DrawerBody>
    </>
  );
}