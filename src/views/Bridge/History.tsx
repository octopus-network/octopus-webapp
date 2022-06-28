import React, { useMemo, useState } from "react";
import dayjs from "dayjs";

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
  useColorModeValue,
  VStack,
  Link,
} from "@chakra-ui/react";

import {
  AppchainInfoWithAnchorStatus,
  BridgeHistory,
  BridgeHistoryStatus,
  TokenAsset,
} from "types";

import { encodeAddress } from "@polkadot/util-crypto";
import { isHex } from "@polkadot/util";
import { DecimalUtil } from "utils";
import { Empty } from "components";
import nearLogo from "assets/near.svg";
import relativeTime from "dayjs/plugin/relativeTime";
import { FiArrowRight, FiMoreHorizontal } from "react-icons/fi";

type HistoryProps = {
  appchain: AppchainInfoWithAnchorStatus | undefined;
  histories: BridgeHistory[];
  tokenAssets: TokenAsset[] | undefined;
  onDrawerClose: VoidFunction;
  onClearHistory: VoidFunction;
};

type HistoryItemProps = {
  appchain: AppchainInfoWithAnchorStatus | undefined;
  history: BridgeHistory;
  tokenAssets: TokenAsset[] | undefined;
};

dayjs.extend(relativeTime);

const StatusTag = ({
  message,
  status,
}: {
  message?: string;
  status: BridgeHistoryStatus;
}) => {
  return (
    <HStack alignItems="flex-end" justifyContent="center">
      {status === BridgeHistoryStatus.Pending ? (
        <CircularProgress
          color="octo-blue.400"
          isIndeterminate
          size="16px"
          thickness="16px"
        />
      ) : message ? (
        <Tooltip label={message}>
          <Tag
            colorScheme={
              status === BridgeHistoryStatus.Succeed ? "octo-blue" : "red"
            }
            size="sm"
          >
            {status === BridgeHistoryStatus.Succeed ? "Succeed" : "Failed"}
          </Tag>
        </Tooltip>
      ) : (
        <Tag
          colorScheme={
            status === BridgeHistoryStatus.Succeed ? "octo-blue" : "red"
          }
          size="sm"
        >
          {status === BridgeHistoryStatus.Succeed ? "Succeed" : "Failed"}
        </Tag>
      )}
    </HStack>
  );
};

const HistoryItem: React.FC<HistoryItemProps> = ({
  appchain,
  history,
  tokenAssets,
}) => {
  const bg = useColorModeValue("#eee", "#333");
  const [showDetail, setShowDetail] = useState(false);

  const tokenAsset = useMemo(
    () => tokenAssets?.find((t) => t.contractId === history.tokenContractId),
    [tokenAssets, history]
  );

  return (
    <Box p={3} borderBottomColor="#e3e3e3" borderBottomWidth={1}>
      <Flex alignItems="center" justifyContent="space-between" gap={2}>
        <HStack>
          <Text variant="gray" fontSize="sm">
            {dayjs(Math.floor(history.timestamp)).format("MMM DD, YYYY hh:mm")}
          </Text>
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
          bg={bg}
          p={3}
          mt={2}
          borderRadius={2}
          gap={1}
        >
          <HStack align="flex-start">
            <Text fontSize="sm">Hash:</Text>
            <Link href="#" fontSize="sm">
              {history.hash}
            </Link>
          </HStack>

          <HStack align="flex-start" style={{ marginTop: 0 }}>
            <Text fontSize="sm">From:</Text>
            <Link href="#" fontSize="sm">
              {history.fromAccount}
            </Link>
          </HStack>

          <HStack style={{ marginTop: 0 }}>
            <Text fontSize="sm">To:</Text>
            <Link href="#" fontSize="sm">
              {!history.isAppchainSide && isHex(history.toAccount)
                ? encodeAddress(history.toAccount)
                : history.toAccount}
            </Link>
          </HStack>
        </VStack>
      )}
      {history.isAppchainSide && (
        <Flex mt={2} alignItems="center" justifyContent="flex-end">
          <Button size="sm" colorScheme="octo-blue">
            Finalize
          </Button>

          {/* <StatusTag message={history.message} status={history.status} /> */}
        </Flex>
      )}
    </Box>
  );
};

export const History: React.FC<HistoryProps> = ({
  appchain,
  histories,
  onDrawerClose,
  onClearHistory,
  tokenAssets,
}) => {
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
            {histories.map((h) => (
              <HistoryItem
                appchain={appchain}
                history={h}
                key={h.hash}
                tokenAssets={tokenAssets}
              />
            ))}
          </List>
        ) : (
          <Empty minH="320px" />
        )}
      </DrawerBody>
    </>
  );
};
