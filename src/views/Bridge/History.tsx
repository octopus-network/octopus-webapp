import React, { useMemo, useState } from "react"
import dayjs from "dayjs"

import {
  DrawerHeader,
  Flex,
  Heading,
  CloseButton,
  DrawerBody,
  List,
  Text,
  Box,
  Button,
  HStack,
  Avatar,
  useColorModeValue,
  VStack,
  Link,
} from "@chakra-ui/react"

import {
  AppchainInfoWithAnchorStatus,
  BridgeHistory,
  BridgeProcessParams,
  NetworkConfig,
  TokenAsset,
} from "types"

import { encodeAddress } from "@polkadot/util-crypto"
import { isHex } from "@polkadot/util"
import { DecimalUtil } from "utils"
import { Empty } from "components"
import nearLogo from "assets/near.svg"
import relativeTime from "dayjs/plugin/relativeTime"
import { FiArrowRight, FiMoreHorizontal } from "react-icons/fi"
import { useGlobalStore } from "stores"

type HistoryProps = {
  appchain: AppchainInfoWithAnchorStatus | undefined
  histories: BridgeHistory[]
  tokenAssets: TokenAsset[] | undefined
  onDrawerClose: VoidFunction
  onClearHistory: VoidFunction
  onProcessTx: (history: BridgeHistory) => void
  processParams: (BridgeProcessParams | void)[]
}

type HistoryItemProps = {
  appchain: AppchainInfoWithAnchorStatus | undefined
  history: BridgeHistory
  tokenAssets: TokenAsset[] | undefined
  onProcessTx: (history: BridgeHistory) => void
  processParam: BridgeProcessParams | void
  network: NetworkConfig | null
}

dayjs.extend(relativeTime)

const HistoryItem: React.FC<HistoryItemProps> = ({
  appchain,
  history,
  tokenAssets,
  onProcessTx,
  processParam,
  network,
}) => {
  const grayBg = useColorModeValue("#f2f4f7", "#1e1f34")
  const [showDetail, setShowDetail] = useState(false)

  const tokenAsset = useMemo(
    () => tokenAssets?.find((t) => t.contractId === history.tokenContractId),
    [tokenAssets, history]
  )

  const fromAccountUrl = `${
    history.isAppchainSide
      ? network?.octopus.explorerUrl
      : network?.near.explorerUrl
  }${history.isAppchainSide ? `/${appchain?.appchain_id}` : ``}/accounts/${
    history.fromAccount
  }`

  const toAccountUrl = `${
    !history.isAppchainSide
      ? network?.octopus.explorerUrl
      : network?.near.explorerUrl
  }${history.isAppchainSide ? `/${appchain?.appchain_id}` : ``}/accounts/${
    history.toAccount
  }`

  return (
    <Box p={3} borderBottomColor="#e3e3e3" borderBottomWidth={1}>
      <Flex alignItems="center" justifyContent="space-between" gap={2}>
        <HStack>
          <Avatar
            name={tokenAsset?.metadata.symbol}
            src={tokenAsset?.metadata.icon as any}
            boxSize={8}
            size="sm"
          />

          <Heading fontSize="lg">
            {DecimalUtil.beautify(
              DecimalUtil.fromString(
                history.amount,
                Array.isArray(tokenAsset?.metadata?.decimals)
                  ? tokenAsset?.metadata?.decimals[
                      history.isAppchainSide ? 0 : 0
                    ]
                  : tokenAsset?.metadata?.decimals
              )
            )}
          </Heading>
          <Text variant="gray" fontSize="sm">
            {tokenAsset?.metadata?.symbol}
          </Text>
        </HStack>
        <HStack>
          <Avatar
            boxSize={7}
            name={history.fromAccount}
            borderRadius={4}
            src={
              history.isAppchainSide
                ? (appchain?.appchain_metadata?.fungible_token_metadata
                    ?.icon as any)
                : nearLogo
            }
          />
          <FiArrowRight />
          <Avatar
            boxSize={7}
            name={history.toAccount}
            borderRadius={4}
            src={
              !history.isAppchainSide
                ? (appchain?.appchain_metadata?.fungible_token_metadata
                    ?.icon as any)
                : nearLogo
            }
          />

          <FiMoreHorizontal
            cursor="pointer"
            style={{ marginLeft: 10 }}
            onClick={() => setShowDetail(!showDetail)}
          />
        </HStack>
      </Flex>
      {showDetail && (
        <VStack
          align="flex-start"
          bg={grayBg}
          p={3}
          mt={2}
          borderRadius={2}
          gap={1}
        >
          <HStack align="flex-start">
            <Text fontSize="sm">Time:</Text>
            <Text fontSize="sm">
              {dayjs(Math.floor(history.timestamp)).format(
                "MMM DD, YYYY HH:mm"
              )}
            </Text>
          </HStack>

          <HStack align="flex-start" style={{ marginTop: 0 }}>
            <Text fontSize="sm">From:</Text>
            <Link href={fromAccountUrl} fontSize="sm" target="_blank">
              {history.fromAccount}
            </Link>
          </HStack>

          <HStack style={{ marginTop: 0 }}>
            <Text fontSize="sm">To:</Text>
            <Link href={toAccountUrl} fontSize="sm" target="_blank">
              {!history.isAppchainSide && isHex(history.toAccount)
                ? encodeAddress(history.toAccount)
                : history.toAccount}
            </Link>
          </HStack>
        </VStack>
      )}
      {history.isAppchainSide && history.status !== 1 && !history.processed && (
        <Flex mt={2} alignItems="center" justifyContent="flex-end">
          <Button
            size="sm"
            colorScheme="octo-blue"
            onClick={() => onProcessTx(history)}
            isLoading={!processParam}
            borderRadius="sm"
          >
            Finalize
          </Button>
        </Flex>
      )}
    </Box>
  )
}

export const History: React.FC<HistoryProps> = ({
  appchain,
  histories,
  onDrawerClose,
  onClearHistory,
  tokenAssets,
  onProcessTx,
  processParams,
}) => {
  const historyGroup: {
    [key: string]: BridgeHistory[]
  } = {}
  histories.forEach((h) => {
    const day = dayjs(h.timestamp).format("MMM DD, YYYY")
    if (historyGroup[day]) {
      historyGroup[day].push(h)
    } else {
      historyGroup[day] = [h]
    }
  })

  const { global } = useGlobalStore()

  return (
    <>
      <DrawerHeader borderBottomWidth="0">
        <Flex justifyContent="space-between" alignItems="center">
          <HStack>
            <Heading fontSize="lg">History</Heading>
            <Button
              size="sm"
              onClick={onClearHistory}
              colorScheme="octo-blue"
              variant="ghost"
            >
              Clear
            </Button>
          </HStack>
          <CloseButton onClick={onDrawerClose} />
        </Flex>
      </DrawerHeader>
      <DrawerBody pb={6}>
        {histories.length ? (
          <List spacing={0}>
            {Object.keys(historyGroup).map((key) => {
              return (
                <Box key={key} pt={3}>
                  <Heading fontSize="large" pb={2} opacity={0.7}>
                    {key}
                  </Heading>
                  {historyGroup[key].map((h) => (
                    <HistoryItem
                      appchain={appchain}
                      history={h}
                      key={h.hash}
                      tokenAssets={tokenAssets}
                      onProcessTx={onProcessTx}
                      processParam={processParams.find(
                        (t) => t?.hash === h.hash
                      )}
                      network={global.network}
                    />
                  ))}
                </Box>
              )
            })}
          </List>
        ) : (
          <Empty minH="320px" />
        )}
      </DrawerBody>
    </>
  )
}
