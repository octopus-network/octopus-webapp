import React, { useMemo } from "react"
import useSWR from "swr"

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
  Flex,
} from "@chakra-ui/react"

import { FungibleTokenMetadata } from "types"
import { Empty } from "components"
import { DecimalUtil } from "utils"
import Decimal from "decimal.js"
import { useWalletSelector } from "components/WalletSelectorContextProvider"

type Asset = {
  contractId: string
  metadata: FungibleTokenMetadata
  balance: number
}

export const AssetItem: React.FC<{
  asset: Asset
  prices: Record<string, number> | undefined
}> = ({ asset, prices }) => {
  return (
    <Box>
      <Flex justifyContent="space-between" alignItems="center">
        <HStack>
          <Avatar
            name={asset.metadata.name}
            src={asset.metadata.icon as any}
            boxSize={10}
          />
          <VStack alignItems="flex-start" spacing={1}>
            <Heading fontSize="md">{asset.metadata.name}</Heading>
            <Text variant="gray" fontSize="sm">
              {!!prices?.[asset.metadata.symbol]
                ? "$" +
                  DecimalUtil.beautify(
                    new Decimal(prices[asset.metadata.symbol])
                  )
                : "-"}
            </Text>
          </VStack>
        </HStack>
        <VStack spacing={1} alignItems="flex-end">
          <Heading fontSize="md">
            {DecimalUtil.beautify(new Decimal(asset.balance))}{" "}
            {asset.metadata.symbol}
          </Heading>
          <Text variant="gray" fontSize="sm">
            {!!prices?.[asset.metadata.symbol]
              ? "$" +
                DecimalUtil.beautify(
                  new Decimal(prices[asset.metadata.symbol] * asset.balance)
                )
              : "-"}
          </Text>
        </VStack>
      </Flex>
    </Box>
  )
}

export const Assets: React.FC = () => {
  const { accountId } = useWalletSelector()
  const { data: assets, error: assetsError } = useSWR<Asset[]>(
    accountId ? `${accountId}/assets` : null
  )
  const { data: prices } = useSWR<Record<string, number>>(
    assets ? `prices/${assets.map((a) => a.metadata.symbol).join(",")}` : null
  )

  const totalValue = useMemo(() => {
    if (!assets || !prices) {
      return 0
    }

    return assets.reduce(
      (total, { metadata, balance }) =>
        total + (prices?.[metadata.symbol] || 0) * balance,
      0
    )
  }, [assets, prices])

  return (
    <Box minH="320px">
      <Flex alignItems="center" justifyContent="space-between">
        <Heading fontSize="2xl">Assets</Heading>
        <Text variant="gray">
          {totalValue
            ? "$" + DecimalUtil.beautify(new Decimal(totalValue))
            : "-"}
        </Text>
      </Flex>
      {!assets && !assetsError ? (
        <Center minH="160px">
          <Spinner size="md" thickness="4px" speed="1s" color="octo-blue.500" />
        </Center>
      ) : assets?.length ? (
        <List spacing={4} mt={6}>
          {assets
            .sort((a, b) =>
              new Decimal((prices?.[b.metadata.symbol] || 0) * b.balance)
                .sub(
                  new Decimal((prices?.[a.metadata.symbol] || 0) * a.balance)
                )
                .toNumber()
            )
            .map((a, idx) => (
              <AssetItem asset={a} key={`asset-${idx}`} prices={prices} />
            ))}
        </List>
      ) : (
        <Empty message="No Assets" />
      )}
    </Box>
  )
}
