import React, { useMemo } from "react";
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
  HStack,
  Avatar,
  Tag,
  CircularProgress,
  useColorModeValue,
} from "@chakra-ui/react";

import {
  AppchainInfoWithAnchorStatus,
  BridgeHistory,
  BridgeHistoryStatus,
  TokenAsset,
} from "types";

import { isHex } from "@polkadot/util";
import { DecimalUtil } from "utils";
import { Empty } from "components";
import nearLogo from "assets/near.svg";
import relativeTime from "dayjs/plugin/relativeTime";
import { formatAppChainAddress } from "utils/format";
import OctIdenticon from "components/common/OctIdenticon";

type HistoryProps = {
  appchain: AppchainInfoWithAnchorStatus | undefined;
  histories: BridgeHistory[];
  tokenAssets: TokenAsset[] | undefined;
  onDrawerClose: VoidFunction;
};

type HistoryItemProps = {
  appchain: AppchainInfoWithAnchorStatus | undefined;
  history: BridgeHistory;
  tokenAssets: TokenAsset[] | undefined;
};

dayjs.extend(relativeTime);

const HistoryItem: React.FC<HistoryItemProps> = ({
  appchain,
  history,
  tokenAssets,
}) => {
  const bg = useColorModeValue("#f6f7fa", "#15172c");

  const tokenAsset = useMemo(
    () => tokenAssets?.find((t) => t.contractId === history.tokenContractId),
    [tokenAssets, history]
  );

  return (
    <Box p={3} bg={bg} borderRadius="md">
      <Flex justifyContent="space-between" alignItems="center">
        <HStack maxW="50%">
          <Text variant="gray" fontSize="sm">
            From
          </Text>
          {history.isAppchainSide ? (
            <Box boxSize={6}>
              <OctIdenticon value={history.fromAccount} size={26} />
            </Box>
          ) : (
            <Avatar boxSize={6} name={history.fromAccount} src={nearLogo} />
          )}
          <Heading
            fontSize="md"
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
          >
            {history.fromAccount}
          </Heading>
        </HStack>
        <HStack alignItems="flex-end" justifyContent="center">
          <Heading fontSize="lg">
            {DecimalUtil.formatAmount(
              history.amount,
              Array.isArray(tokenAsset?.metadata?.decimals)
                ? tokenAsset?.metadata?.decimals[history.isAppchainSide ? 0 : 0]
                : tokenAsset?.metadata?.decimals,
              4
            )}
          </Heading>
          <Heading fontSize="lg">{tokenAsset?.metadata?.symbol}</Heading>
          {history.status === BridgeHistoryStatus.Pending ? (
            <CircularProgress
              color="octo-blue.400"
              isIndeterminate
              size="16px"
              thickness="16px"
            />
          ) : history.message ? (
            <Tooltip label={history.message}>
              <Tag
                colorScheme={
                  history.status === BridgeHistoryStatus.Succeed
                    ? "octo-blue"
                    : "red"
                }
                size="sm"
              >
                {history.status === BridgeHistoryStatus.Succeed
                  ? "Succeed"
                  : "Failed"}
              </Tag>
            </Tooltip>
          ) : (
            <Tag
              colorScheme={
                history.status === BridgeHistoryStatus.Succeed
                  ? "octo-blue"
                  : "red"
              }
              size="sm"
            >
              {history.status === BridgeHistoryStatus.Succeed
                ? "Succeed"
                : "Failed"}
            </Tag>
          )}
        </HStack>
      </Flex>
      <Flex mt={2} alignItems="center" justifyContent="space-between">
        <HStack maxW="50%">
          <Text fontSize="md" variant="gray">
            to
          </Text>

          {!history.isAppchainSide ? (
            <Box boxSize={6}>
              <OctIdenticon value={history.toAccount} size={26} />
            </Box>
          ) : (
            <Avatar boxSize={6} name={history.toAccount} src={nearLogo} />
          )}

          <Text
            fontSize="md"
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
          >
            {!history.isAppchainSide && isHex(history.toAccount)
              ? formatAppChainAddress(history.toAccount, appchain)
              : history.toAccount}
          </Text>
        </HStack>
        <Text variant="gray">
          {dayjs(Math.floor(history.timestamp)).fromNow()}
        </Text>
      </Flex>
    </Box>
  );
};

export const History: React.FC<HistoryProps> = ({
  appchain,
  histories,
  onDrawerClose,
  tokenAssets,
}) => {
  return (
    <>
      <DrawerHeader borderBottomWidth="0">
        <Flex justifyContent="space-between" alignItems="center">
          <HStack>
            <Heading fontSize="lg">History</Heading>
          </HStack>
          <CloseButton onClick={onDrawerClose} />
        </Flex>
      </DrawerHeader>
      <DrawerBody pb={6}>
        {histories.length ? (
          <List spacing={6}>
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
