import React, { useEffect } from "react";

import relativeTime from "dayjs/plugin/relativeTime";
import duration from "dayjs/plugin/duration";
import dayjs from "dayjs";

import {
  Box,
  Flex,
  HStack,
  Avatar,
  VStack,
  Link,
  Text,
  Tooltip,
  Heading,
  SimpleGrid,
  SkeletonCircle,
  useColorModeValue,
  CircularProgress,
  Skeleton,
  Icon,
  useClipboard,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Center,
} from "@chakra-ui/react";

import { StateBadge } from "components";

import {
  AppchainInfoWithAnchorStatus,
  AppchainSettings,
  WrappedAppchainToken,
} from "types";

import type { ApiPromise } from "@polkadot/api";
import { Link as RouterLink } from "react-router-dom";

import { DecimalUtil, toValidUrl } from "utils";
import { EPOCH_DURATION_MS } from "primitives";
import { FaExchangeAlt, FaGithub, FaGlobe, FaUser } from "react-icons/fa";
import useChainData from "hooks/useChainData";
import DescItem from "components/common/DescItem";
import { BsThreeDots } from "react-icons/bs";
import { FiCopy, FiExternalLink } from "react-icons/fi";
import LinkBox from "components/common/LinkBox";
import useChainState from "hooks/useChainState";
import { useWalletSelector } from "components/WalletSelectorContextProvider";
import { Toast } from "components/common/toast";
import { MdExplore } from "react-icons/md";

dayjs.extend(duration);
dayjs.extend(relativeTime);

type DescriptionsProps = {
  appchain?: AppchainInfoWithAnchorStatus;
  appchainSettings?: AppchainSettings;
  wrappedAppchainToken?: WrappedAppchainToken;
  appchainApi?: ApiPromise;
};

export const Descriptions: React.FC<DescriptionsProps> = ({
  appchain,
  appchainApi,
  appchainSettings,
  wrappedAppchainToken,
}) => {
  const bg = useColorModeValue("white", "#15172c");
  const linksBg = useColorModeValue("#f5f7fa", "#1e1f34");
  const borderColor = useColorModeValue("#e3e3e3", "#333");

  const { networkConfig } = useWalletSelector();

  const isSubqEnabled = !!appchainSettings?.subql_endpoint;

  const chainData = useChainData(
    appchain?.appchain_id,
    appchainSettings?.subql_endpoint
  );

  const { onCopy: onCopyRpcEndpoint, setValue } = useClipboard(
    appchainSettings?.rpc_endpoint || ""
  );

  useEffect(() => {
    if (appchainSettings?.rpc_endpoint) {
      setValue(appchainSettings?.rpc_endpoint);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appchainSettings?.rpc_endpoint]);

  const {
    totalAsset,
    stakedOctValue,
    currentEra,
    totalIssuance,
    nextEraTime,
    nextEraTimeLeft,
  } = useChainState(
    appchainApi,
    appchain?.appchain_anchor,
    appchain?.total_stake
  );

  return (
    <Box bg={bg} p={6} borderRadius="md">
      <Flex alignItems="center" justifyContent="space-between" minH="68px">
        <HStack spacing={4}>
          <SkeletonCircle size="16" isLoaded={!!appchain}>
            <Avatar
              src={
                appchain?.appchain_metadata?.fungible_token_metadata.icon as any
              }
              name={appchain?.appchain_id}
              boxSize={16}
            />
          </SkeletonCircle>
          <VStack alignItems="flex-start" spacing={0}>
            <Skeleton isLoaded={!!appchain}>
              <Link
                isExternal
                href={toValidUrl(appchain?.appchain_metadata?.website_url)}
              >
                <Heading fontSize="2xl">
                  {appchain?.appchain_id || "loading"}
                </Heading>
              </Link>
            </Skeleton>
            {appchain ? (
              <HStack className="octo-gray" fontSize="sm">
                <Icon as={FaUser} boxSize={3} />
                <Text>{appchain?.appchain_owner}</Text>
              </HStack>
            ) : null}
            <Text fontSize="sm" className="octo-gray">
              {appchain?.appchain_metadata?.description}
            </Text>
          </VStack>
        </HStack>
        <VStack alignItems="flex-end" spacing={0}>
          <StateBadge state={appchain?.appchain_state} />
          <HStack className="octo-gray" fontSize="sm">
            <Text variant="gray">
              {appchain
                ? dayjs(
                    Math.floor((appchain.registered_time as any) / 1e6)
                  ).format("YYYY-MM-DD")
                : "-"}
            </Text>
          </HStack>
        </VStack>
      </Flex>

      <SimpleGrid
        columns={{ base: 3, md: 5 }}
        spacing={1}
        mt={8}
        bg={linksBg}
        borderRadius="md"
      >
        <Link
          href={toValidUrl(appchain?.appchain_metadata?.website_url)}
          isExternal
        >
          <LinkBox icon={<FaGlobe size={24} />} label="Website" />
        </Link>

        <Link
          href={`${networkConfig?.octopus.explorerUrl}/${appchain?.appchain_id}`}
          isExternal
        >
          <LinkBox icon={<MdExplore size={28} />} label="Explorer" />
        </Link>
        <Link>
          <RouterLink to={`/bridge/near/${appchain?.appchain_id}`}>
            <LinkBox icon={<FaExchangeAlt size={24} />} label="Bridge" />
          </RouterLink>
        </Link>
        <Link
          href={toValidUrl(appchain?.appchain_metadata?.github_address)}
          isExternal
        >
          <LinkBox icon={<FaGithub size={24} />} label="Github" />
        </Link>
        <Menu>
          <Center>
            <MenuButton
              as={Button}
              colorScheme="octo-blue"
              variant="ghost"
              position="relative"
            >
              <Icon as={BsThreeDots} boxSize={5} />
            </MenuButton>
          </Center>
          <MenuList>
            <MenuItem>
              <Link
                href={`${networkConfig?.near.explorerUrl}/address/${appchain?.appchain_anchor}`}
                isExternal
              >
                <HStack gap={2}>
                  <Text>Anchor Contract</Text>
                  <FiExternalLink />
                </HStack>
              </Link>
            </MenuItem>
            <MenuItem>
              <HStack
                gap={2}
                onClick={() => {
                  if (!appchainSettings?.rpc_endpoint) {
                    Toast.error("RPC Endpoint is not available");
                    return;
                  }
                  onCopyRpcEndpoint();
                  Toast.success("Copied!");
                }}
                opacity={appchainSettings?.rpc_endpoint ? 1 : 0.7}
                cursor={
                  appchainSettings?.rpc_endpoint ? "pointer" : "not-allowed"
                }
              >
                <Text>RPC Endpoint</Text>
                <FiCopy />
              </HStack>
            </MenuItem>
          </MenuList>
        </Menu>
      </SimpleGrid>

      <SimpleGrid
        mt={5}
        columns={{ base: 2, md: 3 }}
        spacing={4}
        display={{ base: "none", md: "grid" }}
        borderBottom="1px"
        borderBottomColor={borderColor}
        pb={4}
      >
        <DescItem
          title="Addresses"
          isLoaded={isSubqEnabled ? !!chainData : true}
          value={
            isSubqEnabled ? chainData?.accounts.totalCount ?? "loading" : "-"
          }
        />

        <DescItem
          title="Transfers"
          isLoaded={isSubqEnabled ? !!chainData : true}
          value={
            isSubqEnabled
              ? chainData?.systemTokenTransfers.totalCount ?? "loading"
              : "-"
          }
        />

        <DescItem
          title="Cross-chain Asset"
          isLoaded={!!nextEraTime}
          value={
            <>
              <Heading
                fontSize="xl"
                color={
                  stakedOctValue.lessThan(totalAsset.mul(3))
                    ? "#FFAA15"
                    : "#00C781"
                }
              >{`$${DecimalUtil.beautify(totalAsset, 0)}`}</Heading>
            </>
          }
        />
      </SimpleGrid>

      <SimpleGrid
        mt={4}
        columns={{ base: 2, md: 3 }}
        spacing={4}
        display={{ base: "none", md: "grid" }}
        borderBottom="1px"
        borderBottomColor={borderColor}
        pb={4}
      >
        <DescItem
          title="Online Days"
          isLoaded={currentEra !== undefined}
          value={currentEra !== undefined ? currentEra : "loading"}
        />

        <DescItem
          title="Next Day Reward"
          isLoaded={!!nextEraTime}
          titleExtra={
            nextEraTime ? (
              <CircularProgress
                value={
                  (EPOCH_DURATION_MS - nextEraTimeLeft) /
                  (EPOCH_DURATION_MS / 100)
                }
                size={4}
                thickness={16}
                color="octo-blue.500"
              />
            ) : null
          }
          value={
            nextEraTime ? (
              <Tooltip label={dayjs(nextEraTime).format("YYYY-MM-DD HH:mm:ss")}>
                <Heading fontSize="xl">
                  {dayjs
                    .duration(Math.floor(nextEraTimeLeft / 1000), "seconds")
                    .humanize(true)}
                </Heading>
              </Tooltip>
            ) : (
              <Heading fontSize="xl">loading</Heading>
            )
          }
        />

        <DescItem
          title="Daily Reward"
          isLoaded
          value={
            appchainSettings?.era_reward && wrappedAppchainToken
              ? DecimalUtil.formatAmount(
                  appchainSettings?.era_reward,
                  wrappedAppchainToken.metadata.decimals
                )
              : "-"
          }
        />
      </SimpleGrid>

      <SimpleGrid
        mt={4}
        columns={{ base: 2, md: 3 }}
        spacing={4}
        display={{ base: "none", md: "grid" }}
      >
        <DescItem
          title="Token"
          isLoaded
          value={
            appchain?.appchain_metadata?.fungible_token_metadata?.symbol || "-"
          }
        />
        <DescItem
          title="Total Supply"
          isLoaded={!!totalIssuance}
          value={
            totalIssuance && appchain?.appchain_metadata
              ? DecimalUtil.formatAmount(
                  totalIssuance,
                  appchain?.appchain_metadata?.fungible_token_metadata.decimals
                )
              : "loading"
          }
        />
        <DescItem
          title="IDO Amount"
          isLoaded
          value={
            appchain?.appchain_metadata?.ido_amount_of_wrapped_appchain_token
              ? DecimalUtil.formatAmount(
                  appchain?.appchain_metadata
                    ?.ido_amount_of_wrapped_appchain_token,
                  appchain?.appchain_metadata?.fungible_token_metadata.decimals
                )
              : "-"
          }
        />
      </SimpleGrid>
    </Box>
  );
};
