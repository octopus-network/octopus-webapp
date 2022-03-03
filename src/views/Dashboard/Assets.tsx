import React from 'react';
import useSWR from 'swr';

import {
  Heading,
  Text,
  List,
  Box,
  Avatar,
  HStack,
  VStack,
  Spinner,
  Center,
  Flex
} from '@chakra-ui/react';

import { FungibleTokenMetadata } from 'types';
import { Empty } from 'components';
import { useGlobalStore } from 'stores';
import { DecimalUtil } from 'utils';
import Decimal from 'decimal.js';

type Asset = {
  contractId: string;
  metadata: FungibleTokenMetadata;
  balance: number;
}

export const AssetItem: React.FC<{
  asset: Asset;
  prices: Record<string, number> | undefined;
}> = ({ asset, prices }) => {

  return (
    <Box>
      <Flex justifyContent="space-between" alignItems="center">
        <HStack>
          <Avatar name={asset.metadata.name} src={asset.metadata.icon as any} boxSize={10} />
          <VStack alignItems="flex-start" spacing={1}>
            <Heading fontSize="md">{asset.metadata.name}</Heading>
            <Text variant="gray" fontSize="sm">
              {
                !!prices?.[asset.metadata.symbol] ?
                '$' + DecimalUtil.beautify(new Decimal(prices[asset.metadata.symbol])) :
                '-'
              }
            </Text>
          </VStack>
        </HStack>
        <VStack spacing={1} alignItems="flex-end">
          <Heading fontSize="md">{DecimalUtil.beautify(new Decimal(asset.balance))}{asset.metadata.symbol}</Heading>
          <Text variant="gray" fontSize="sm">
            {
              !!prices?.[asset.metadata.symbol] ?
              '$' + DecimalUtil.beautify(new Decimal(prices[asset.metadata.symbol] * asset.balance)) :
              '-'
            }
          </Text>
        </VStack>
      </Flex>
    </Box>
  );
}

export const Assets: React.FC = () => {
  const { global } = useGlobalStore();
  const { data: assets, error: assetsError } = useSWR<Asset[]>(global.accountId ? `${global.accountId}/assets` : null);
  const { data: prices } = useSWR<Record<string, number>>(assets ? `prices/${assets.map(a => a.metadata.symbol).join(',')}` : null);

  return (
    <Box minH="320px">
      <Heading fontSize="2xl">Assets</Heading>
      {
        !assets && !assetsError ?
        <Center minH="160px">
          <Spinner size="md" thickness="4px" speed="1s" color="octo-blue.500" />
        </Center> :
        assets?.length ?
        <List spacing={4} mt={6}>
          {
            assets.map((a, idx) => (
              <AssetItem asset={a} key={`asset-${idx}`} prices={prices} />
            ))
          }
        </List> :
        <Empty message="No Assets" />
      }
    </Box>
  );
}