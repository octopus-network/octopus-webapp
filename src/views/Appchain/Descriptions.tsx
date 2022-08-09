import React, { useEffect, useState } from "react"

import relativeTime from "dayjs/plugin/relativeTime"
import duration from "dayjs/plugin/duration"
import dayjs from "dayjs"

import {
  Box,
  Flex,
  HStack,
  Avatar,
  Image,
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
  useBoolean,
  useClipboard,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Center,
} from "@chakra-ui/react"

import { useSpring, animated } from "react-spring"

import { StateBadge } from "components"

import {
  AppchainInfoWithAnchorStatus,
  AppchainSettings,
  WrappedAppchainToken,
} from "types"

import type { ApiPromise } from "@polkadot/api"
import { Link as RouterLink } from "react-router-dom"

import websiteIcon from "assets/icons/website.png"
import explorerIcon from "assets/icons/explorer.png"
import bridgeIcon from "assets/icons/bridge.png"
import githubIcon from "assets/icons/github.png"

import { DecimalUtil, toValidUrl } from "utils"
import Decimal from "decimal.js"
import { EPOCH_DURATION_MS } from "primitives"
import { useGlobalStore } from "stores"
import { FaUser } from "react-icons/fa"
import useChainStats from "hooks/useChainStats"
import DescItem from "components/common/DescItem"
import { BsThreeDots } from "react-icons/bs"
import { FiCopy, FiExternalLink } from "react-icons/fi"

dayjs.extend(duration)
dayjs.extend(relativeTime)

type DescriptionsProps = {
  appchain: AppchainInfoWithAnchorStatus | undefined
  appchainSettings: AppchainSettings | undefined
  wrappedAppchainToken: WrappedAppchainToken | undefined
  appchainApi: ApiPromise | undefined
}

type LinkBoxProps = {
  label: string
  icon: any
  to?: string
  href?: string
}

const LinkBox: React.FC<LinkBoxProps> = ({ label, icon }) => {
  const [isHovering, setIsHovering] = useBoolean(false)

  const iconHoveringProps = useSpring({
    transform: isHovering ? "translateY(-5pxpx)" : "translateY(0px)",
  })

  return (
    <Box
      p={2}
      cursor="pointer"
      onMouseEnter={setIsHovering.on}
      onMouseLeave={setIsHovering.off}
    >
      <VStack spacing={1}>
        <animated.div style={iconHoveringProps}>
          <Box boxSize={8}>
            <Image src={icon} w="100%" />
          </Box>
        </animated.div>
        <Text
          fontSize="sm"
          whiteSpace="nowrap"
          textOverflow="ellipsis"
          overflow="hidden"
          maxW="100%"
        >
          {label}
        </Text>
      </VStack>
    </Box>
  )
}

export const Descriptions: React.FC<DescriptionsProps> = ({
  appchain,
  appchainApi,
  appchainSettings,
  wrappedAppchainToken,
}) => {
  const bg = useColorModeValue("white", "#15172c")
  const linksBg = useColorModeValue("#f5f7fa", "#1e1f34")
  const borderColor = useColorModeValue("#e3e3e3", "#333")

  const { global } = useGlobalStore()

  const isSubqEnabled = !!appchainSettings?.subql_endpoint

  const stats = useChainStats(
    appchain?.appchain_id,
    appchainSettings?.subql_endpoint
  )

  const [bestBlock, setBestBlock] = useState<number>()
  const [currentEra, setCurrentEra] = useState<number>()
  const [totalIssuance, setTotalIssuance] = useState<string>()

  const [nextEraTime, setNextEraTime] = useState(0)
  const [nextEraTimeLeft, setNextEraTimeLeft] = useState(0)

  const { onCopy: onCopyRpcEndpoint } = useClipboard(
    appchainSettings?.rpc_endpoint || ""
  )

  useEffect(() => {
    if (!appchainApi) {
      return
    }

    // subscribe new head
    let unsubNewHeads: any
    appchainApi.rpc.chain
      .subscribeNewHeads((lastHeader) =>
        setBestBlock(lastHeader.number.toNumber())
      )
      .then((unsub) => (unsubNewHeads = unsub))

    Promise.all([
      appchainApi.query.octopusLpos.activeEra(),
      appchainApi.query.balances?.totalIssuance(),
    ]).then(([era, issuance]) => {
      const eraJSON: any = era.toJSON()

      setCurrentEra(eraJSON?.index)

      setNextEraTime(eraJSON ? EPOCH_DURATION_MS + eraJSON.start : 0)
      setNextEraTimeLeft(
        eraJSON ? eraJSON.start + EPOCH_DURATION_MS - new Date().getTime() : 0
      )
      setTotalIssuance(issuance?.toString() || "0")
    })

    return () => unsubNewHeads && unsubNewHeads()
  }, [appchainApi])

  return (
    <Box bg={bg} p={6} borderRadius="lg">
      <Flex alignItems="center" justifyContent="space-between" minH="68px">
        <HStack spacing={4}>
          <SkeletonCircle size="12" isLoaded={!!appchain}>
            <Avatar
              src={
                appchain?.appchain_metadata?.fungible_token_metadata.icon as any
              }
              name={appchain?.appchain_id}
              boxSize={12}
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
          </VStack>
        </HStack>
        <VStack alignItems="flex-end" spacing={0}>
          <StateBadge state={appchain?.appchain_state || ""} />
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
        spacing={4}
        mt={8}
        bg={linksBg}
        borderRadius="lg"
      >
        <Link
          href={toValidUrl(appchain?.appchain_metadata?.website_url)}
          isExternal
        >
          <LinkBox icon={websiteIcon} label="Website" />
        </Link>

        <Link
          href={`${global?.network?.octopus.explorerUrl}/${appchain?.appchain_id}`}
          isExternal
        >
          <LinkBox icon={explorerIcon} label="Explorer" />
        </Link>
        <RouterLink to={`/bridge/near/${appchain?.appchain_id}`}>
          <LinkBox icon={bridgeIcon} label="Bridge" />
        </RouterLink>
        <Link
          href={toValidUrl(appchain?.appchain_metadata?.github_address)}
          isExternal
        >
          <LinkBox icon={githubIcon} label="Github" />
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
                href={`${global?.network?.near.explorerUrl}/accounts/${appchain?.appchain_anchor}`}
                isExternal
              >
                <HStack gap={2}>
                  <Text>Anchor Contract</Text>
                  <FiExternalLink />
                </HStack>
              </Link>
            </MenuItem>
            <MenuItem>
              <HStack gap={2} onClick={onCopyRpcEndpoint}>
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
          isLoaded={isSubqEnabled ? !!stats : true}
          value={isSubqEnabled ? stats?.accounts.totalCount ?? "loading" : "-"}
        />

        <DescItem
          title="Transfers"
          isLoaded={isSubqEnabled ? !!stats : true}
          value={
            isSubqEnabled
              ? stats?.systemTokenTransfers.totalCount ?? "loading"
              : "-"
          }
        />

        <DescItem
          title="Block Height"
          isLoaded={!!nextEraTime}
          value={
            bestBlock !== undefined
              ? DecimalUtil.beautify(new Decimal(bestBlock), 0)
              : "loading"
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
          isLoaded={!!currentEra}
          value={currentEra !== undefined ? currentEra : "loading"}
        />

        <DescItem
          title="Next Reward"
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
              ? DecimalUtil.beautify(
                  DecimalUtil.fromString(
                    appchainSettings?.era_reward,
                    wrappedAppchainToken.metadata.decimals
                  ),
                  0
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
              ? DecimalUtil.beautify(
                  DecimalUtil.fromString(
                    totalIssuance,
                    appchain?.appchain_metadata?.fungible_token_metadata
                      .decimals
                  ),
                  0
                )
              : "loading"
          }
        />
        <DescItem
          title="IDO Amount"
          isLoaded
          value={
            appchain?.appchain_metadata?.ido_amount_of_wrapped_appchain_token
              ? DecimalUtil.beautify(
                  DecimalUtil.fromString(
                    appchain?.appchain_metadata
                      ?.ido_amount_of_wrapped_appchain_token,
                    appchain?.appchain_metadata?.fungible_token_metadata
                      .decimals
                  ),
                  0
                )
              : "-"
          }
        />
      </SimpleGrid>
    </Box>
  )
}
