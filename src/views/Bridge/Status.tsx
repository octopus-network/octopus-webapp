/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import {
  Box,
  Grid,
  HStack,
  Heading,
  Text,
  Tag,
  Icon,
  Spinner,
  Button,
  Skeleton,
  Avatar,
  GridItem,
  Center,
  List,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  Link,
  Flex,
  useColorModeValue,
  VStack,
  useBoolean,
} from "@chakra-ui/react";

import { Select } from "chakra-react-select";

import { DecimalUtil, decodeNearAccount } from "utils";
import { Link as RouterLink, useParams, useNavigate } from "react-router-dom";

import {
  ExternalLinkIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from "@chakra-ui/icons";

import { AppchainInfoWithAnchorStatus, NetworkConfig } from "types";

import { BiTimeFive } from "react-icons/bi";
import { AiOutlineArrowRight } from "react-icons/ai";
import nearLogo from "assets/near.svg";
import { TxDetail } from "./TxDetail";
import { formatAppChainAddress } from "utils/format";
import OctIdenticon from "components/common/OctIdenticon";
import { useWalletSelector } from "components/WalletSelectorContextProvider";
import { BRIDGE_HELPER_API } from "config";

enum BridgeStatus {
  Pending,
  Success,
  Failed,
}

type Token = {
  name: string;
  symbol: string;
  decimals: number;
  contract_id: string;
};

type TokensMap = {
  [key: string]: Token[];
};

type BridgeHistory = {
  id: string;
  direction: string;
  appchain_id: string;
  event: string;
  amount: string;
  from: string;
  to: string;
  outHash: string;
  inHashes: (string | null)[];
  status: BridgeStatus;
  timestamp: number;
  token: Token;
  message?: string;
};

type RowProps = {
  data: BridgeHistory;
  network: NetworkConfig | null;
};

type Filters = {
  appchain: string;
  direction: string;
  token: string;
  byStatus: string;
};

dayjs.extend(relativeTime);

const statusObj: Record<
  string,
  {
    color: string;
    label: string;
  }
> = {
  Pending: {
    color: "green",
    label: "Pending",
  },
  Success: {
    color: "blue",
    label: "Success",
  },
  Failed: {
    color: "red",
    label: "Failed",
  },
};

const Row: React.FC<RowProps> = ({ data, network }) => {
  const bg = useColorModeValue("white", "#15172c");

  const [isAppchainSide, appchainId] = useMemo(
    () => [data.direction === "appchain_to_near", data.appchain_id],
    [data]
  );

  const { data: appchain } = useSWR<AppchainInfoWithAnchorStatus>(
    appchainId ? `appchain/${appchainId}` : null
  );

  return (
    <Skeleton isLoaded={!!appchain || !network}>
      <Box left={0} top={0} right={0} pb={1} opacity={0.6}>
        <Flex justifyContent="space-between">
          <Box p={1} borderRadius="md">
            <HStack>
              <HStack spacing={1}>
                <Avatar
                  boxSize={3}
                  src={
                    isAppchainSide
                      ? (appchain?.appchain_metadata?.fungible_token_metadata
                          ?.icon as any)
                      : nearLogo
                  }
                />
                <Text fontSize="xs">
                  {isAppchainSide ? appchainId : "NEAR"}
                </Text>
              </HStack>
              <Icon as={AiOutlineArrowRight} boxSize={3} />
              <HStack spacing={1}>
                <Avatar
                  boxSize={3}
                  src={
                    !isAppchainSide
                      ? (appchain?.appchain_metadata?.fungible_token_metadata
                          ?.icon as any)
                      : nearLogo
                  }
                />
                <Text fontSize="xs">
                  {!isAppchainSide ? appchainId : "NEAR"}
                </Text>
              </HStack>
            </HStack>
          </Box>
          <Box p={1} borderRadius="md">
            <HStack spacing={1}>
              <Icon as={BiTimeFive} boxSize={3} />
              <Text fontSize="xs">{dayjs(data.timestamp).fromNow()}</Text>
            </HStack>
          </Box>
        </Flex>
      </Box>
      <RouterLink to={`/bridge/txs/${data.id}`}>
        <Grid
          templateColumns="repeat(12, 1fr)"
          p={6}
          pr={4}
          bg={bg}
          borderRadius="md"
          gap={6}
          alignItems="center"
          cursor="pointer"
          transition="all .3s ease"
          _hover={{
            boxShadow: "0 10px 10px -5px rgba(0,0,12,.06)",
            transform: "translateY(-3px) scale(1.01)",
          }}
        >
          <GridItem colSpan={2}>
            <VStack spacing={2} align="start">
              <Heading
                fontSize="sm"
                color={data.event === "Burnt" ? "green.500" : "blue.500"}
              >
                {data.event}
              </Heading>
              <HStack>
                <Heading
                  fontSize="md"
                  whiteSpace="nowrap"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  className="tx-hash-ellipsis"
                >
                  {appchain && data.token
                    ? DecimalUtil.formatAmount(
                        data.amount.replaceAll(",", ""),
                        data.token.decimals
                      )
                    : "-"}
                </Heading>

                <Text fontSize="sm" color="gray.500">
                  {data.token?.symbol}
                </Text>
              </HStack>
            </VStack>
          </GridItem>

          <GridItem colSpan={4}>
            <VStack align="start">
              <HStack>
                <Text>Account:</Text>
                <Link
                  href={
                    isAppchainSide
                      ? `${
                          network?.octopus.explorerUrl
                        }/${appchainId}/accounts/${formatAppChainAddress(
                          data.from,
                          appchain
                        )}`
                      : `${
                          network?.near.explorerUrl
                        }/accounts/${decodeNearAccount(data.from)}`
                  }
                  _hover={{ textDecoration: "underline" }}
                  color="#2468f2"
                  isExternal
                  onClick={(e) => e.stopPropagation()}
                >
                  <HStack spacing={1}>
                    {isAppchainSide ? (
                      <OctIdenticon value={data.from} size={18} />
                    ) : null}
                    <Text
                      whiteSpace="nowrap"
                      overflow="hidden"
                      textOverflow="ellipsis"
                      className="tx-hash-ellipsis"
                    >
                      {isAppchainSide && data.from
                        ? formatAppChainAddress(data.from, appchain)
                        : decodeNearAccount(data.from)}
                    </Text>
                    <Icon as={ExternalLinkIcon} boxSize={3} color="gray" />
                  </HStack>
                </Link>
              </HStack>

              <HStack>
                <Text>Hash:</Text>
                <Link
                  href={
                    isAppchainSide
                      ? `${network?.octopus.explorerUrl}/${appchainId}/extrinsics/${data.outHash}`
                      : `${network?.near.explorerUrl}/transactions/${data.outHash}`
                  }
                  _hover={{ textDecoration: "underline" }}
                  color="#2468f2"
                  isExternal
                  onClick={(e) => e.stopPropagation()}
                >
                  <HStack spacing={1}>
                    <Text
                      whiteSpace="nowrap"
                      overflow="hidden"
                      textOverflow="ellipsis"
                      className="tx-hash-ellipsis"
                    >
                      {data.outHash}
                    </Text>
                    <Icon as={ExternalLinkIcon} boxSize={3} color="gray" />
                  </HStack>
                </Link>
              </HStack>
            </VStack>
          </GridItem>

          <GridItem colSpan={4}>
            <VStack align="start">
              <HStack>
                <Text>Account:</Text>
                <Link
                  href={
                    !isAppchainSide
                      ? `${
                          network?.octopus.explorerUrl
                        }/${appchainId}/accounts/${formatAppChainAddress(
                          data.to,
                          appchain
                        )}`
                      : `${
                          network?.near.explorerUrl
                        }/accounts/${decodeNearAccount(data.to)}`
                  }
                  _hover={{ textDecoration: "underline" }}
                  color="#2468f2"
                  isExternal
                  onClick={(e) => e.stopPropagation()}
                >
                  <HStack spacing={1}>
                    {!isAppchainSide ? (
                      <OctIdenticon value={data.to} size={18} />
                    ) : null}
                    <Text
                      whiteSpace="nowrap"
                      overflow="hidden"
                      textOverflow="ellipsis"
                      className="tx-hash-ellipsis"
                    >
                      {!isAppchainSide && data.to
                        ? formatAppChainAddress(data.to, appchain)
                        : decodeNearAccount(data.to)}
                    </Text>
                    <Icon as={ExternalLinkIcon} boxSize={3} color="gray" />
                  </HStack>
                </Link>
              </HStack>

              <HStack>
                <Text>Hash:</Text>

                {data.inHashes?.[0] ? (
                  <Link
                    href={
                      !isAppchainSide
                        ? `${network?.octopus.explorerUrl}/${appchainId}/extrinsics/${data.inHashes?.[0]}`
                        : `${network?.near.explorerUrl}/transactions/${data.inHashes?.[0]}`
                    }
                    _hover={{ textDecoration: "underline" }}
                    color="#2468f2"
                    isExternal
                    onClick={(e) => e.stopPropagation()}
                  >
                    <HStack spacing={1}>
                      <Text
                        whiteSpace="nowrap"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        className="tx-hash-ellipsis"
                      >
                        {data.inHashes?.[0]}
                      </Text>
                      <Icon as={ExternalLinkIcon} boxSize={3} color="gray" />
                    </HStack>
                  </Link>
                ) : null}
              </HStack>
            </VStack>
          </GridItem>

          <GridItem colSpan={2}>
            <HStack justifyContent="flex-end">
              <Tag size="sm" colorScheme={statusObj[data.status].color}>
                {statusObj[data.status].label}
              </Tag>
              <Icon as={ChevronRightIcon} boxSize={4} opacity={0.3} />
            </HStack>
          </GridItem>
        </Grid>
      </RouterLink>
    </Skeleton>
  );
};

function Page({
  page,
  network,
  filters,
  loaded,
}: {
  page: number;
  filters: Filters;
  network: NetworkConfig | null;
  loaded: Function;
}) {
  const pageSize = 20;
  const { appchain, direction, token, byStatus } = filters;
  const [txns, setTxns] = useState();

  useEffect(() => {
    fetch(
      `${BRIDGE_HELPER_API}/bridge_txs?start=${
        (page - 1) * pageSize
      }&size=${pageSize}&appchain=${appchain}&direction=${direction}&token=${token}&by_status=${byStatus}`
    )
      .then((res) => res.json())
      .then((res) => {
        setTxns(res);
        loaded();
      })
      .catch(() => {
        console.log("error");
      });
  }, [page, appchain, direction, token, byStatus]);

  return (
    <>
      {(txns ?? []).map((tx, idx) => (
        <Row data={tx} key={`row-${idx}`} network={network} />
      ))}
    </>
  );
}

export const Status: React.FC = () => {
  const [page, setPage] = useState(1);
  const [selectedAppchain, setSlectedAppchain] = useState("all");
  const [selectedDirection, setSlectedDirection] = useState("all");
  const [selectedTokenType, setSlectedTokenType] = useState("all");
  const [selectedStatus, setSlectedStatus] = useState("all");
  const [filters, setFilters] = useState({
    appchain: "all",
    direction: "all",
    token: "all",
    byStatus: "all",
  });
  const [isApplying, setIsApplying] = useBoolean();
  const { txId } = useParams();
  const navigate = useNavigate();
  const { networkConfig } = useWalletSelector();

  const pages: any[] = [];
  for (let i = 1; i < page + 1; i++) {
    pages.push(
      <Page
        page={i}
        key={i}
        network={networkConfig}
        filters={filters}
        loaded={() => {
          setIsApplying.off();
        }}
      />
    );
  }

  useEffect(() => {
    const onScroll = (e: any) => {
      if (document.body.getBoundingClientRect().bottom <= window.innerHeight) {
        setPage(page + 1);
      }
    };
    document?.addEventListener("scroll", onScroll);

    return () => document?.removeEventListener("scroll", onScroll);
  }, [page]);

  const onDetailDrawerClose = () => {
    navigate(`/bridge/txs`);
  };

  const { data: appchains } = useSWR<any[]>("appchains/running");
  const { data: tokensMap } = useSWR<TokensMap>(
    `${BRIDGE_HELPER_API}/bridge-helper/bridge_tokens`
  );

  const appchainNames = appchains?.map(({ appchain_id }) => appchain_id);
  const appchainOptions = [
    {
      label: "all appchains",
      value: "all",
    },
  ];
  if (appchainNames && appchainNames.length > 0) {
    appchainOptions.push(
      ...appchainNames.map((appchainName) => ({
        label: appchainName,
        value: appchainName,
      }))
    );
  }

  const directionOptions = [
    {
      label: "all directions",
      value: "all",
    },
    {
      label: "appchain to near",
      value: "appchain_to_near",
    },
    {
      label: "near to appchain",
      value: "near_to_appchain",
    },
  ];

  const tokenOptions = [
    {
      label: "all tokens",
      value: "all",
    },
  ];

  const statusOptions = [
    {
      label: "all status",
      value: "all",
    },
    {
      label: "success",
      value: "Success",
    },
    {
      label: "failed",
      value: "Failed",
    },
  ];

  if (tokensMap) {
    const totalTokens: Token[] = [];
    Object.values(tokensMap as TokensMap).forEach((tokens) => {
      tokens.forEach((token) => {
        if (totalTokens.findIndex((tk: Token) => tk?.name === token.name) < 0) {
          totalTokens.push(token);
        }
      });
    });

    const tokensForOption: Token[] =
      selectedAppchain === "all"
        ? totalTokens
        : (tokensMap as TokensMap)[selectedAppchain];

    if (tokensForOption && tokensForOption.length > 0) {
      tokenOptions.push(
        ...tokensForOption.map(({ name, symbol }) => ({
          label: symbol,
          value: name,
        }))
      );
    }
  }

  const onApplyFilter = () => {
    setIsApplying.on();
    setPage(1);
    setFilters({
      appchain: selectedAppchain,
      direction: selectedDirection,
      token: selectedTokenType,
      byStatus: selectedStatus,
    });
  };

  return (
    <>
      <Box mt={12}>
        <Flex justifyContent="space-between" alignItems="center">
          <Heading fontSize="xl">Recent Transactions</Heading>
          <RouterLink to="/bridge">
            <Button variant="link" color="#2468f2" size="sm">
              <Icon as={ChevronLeftIcon} mr={1} /> Back to Bridge
            </Button>
          </RouterLink>
        </Flex>
        <Grid mt={10} mb={5} templateColumns="repeat(5, 1fr)" gap={6}>
          <GridItem w="100%">
            <Select
              placeholder="Select appchains"
              options={appchainOptions}
              onChange={(newValue) => {
                setSlectedAppchain(newValue?.value as string);
              }}
            />
          </GridItem>
          <GridItem w="100%">
            <Select
              placeholder="Select directions"
              options={directionOptions}
              onChange={(newValue) => {
                setSlectedDirection(newValue?.value as string);
              }}
            />
          </GridItem>
          <GridItem w="100%">
            <Select
              placeholder="Select token type"
              options={tokenOptions}
              onChange={(newValue) => {
                setSlectedTokenType(newValue?.value as string);
              }}
            />
          </GridItem>
          <GridItem w="100%">
            <Select
              placeholder="Select status"
              options={statusOptions}
              onChange={(newValue) => {
                setSlectedStatus(newValue?.value as string);
              }}
            />
          </GridItem>
          <GridItem w="50%">
            <Flex>
              <Button
                w="100%"
                colorScheme="octo-blue"
                onClick={onApplyFilter}
                isLoading={isApplying}
              >
                Apply
              </Button>
            </Flex>
          </GridItem>
        </Grid>

        <Grid
          templateColumns="repeat(12, 1fr)"
          p={4}
          color="gray.500"
          gap={8}
          fontSize="sm"
        >
          <GridItem colSpan={2}>
            <Text>Event/Event/Token</Text>
          </GridItem>
          <GridItem colSpan={4}>
            <Text>From/Hash</Text>
          </GridItem>
          <GridItem colSpan={4}>
            <Text>To/Hash</Text>
          </GridItem>
          <GridItem colSpan={2} textAlign="right">
            <Text>Status</Text>
          </GridItem>
        </Grid>
        {pages?.length ? (
          <List spacing={5} id="txs-container">
            {pages}
          </List>
        ) : (
          <Center minH="320px">
            <Spinner
              size="md"
              thickness="4px"
              speed="1s"
              color="octo-blue.500"
            />
          </Center>
        )}
      </Box>
      <Drawer
        placement="right"
        isOpen={!!txId}
        onClose={onDetailDrawerClose}
        size="lg"
      >
        <DrawerOverlay />
        <DrawerContent>
          <TxDetail onDrawerClose={onDetailDrawerClose} />
        </DrawerContent>
      </Drawer>
    </>
  );
};
