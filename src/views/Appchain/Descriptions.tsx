import React, { useEffect, useState } from 'react'

import relativeTime from 'dayjs/plugin/relativeTime'
import duration from 'dayjs/plugin/duration'
import dayjs from 'dayjs'

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
  IconButton,
} from '@chakra-ui/react'

import { useSpring, animated } from 'react-spring'

import { StateBadge } from 'components'

import {
  AppchainInfoWithAnchorStatus,
  AppchainSettings,
  WrappedAppchainToken,
} from 'types'

import type { ApiPromise } from '@polkadot/api'
import { CheckIcon, CopyIcon } from '@chakra-ui/icons'
import { Link as RouterLink } from 'react-router-dom'

import websiteIcon from 'assets/icons/website.png'
import explorerIcon from 'assets/icons/explorer.png'
import bridgeIcon from 'assets/icons/bridge.png'
import anchorIcon from 'assets/icons/anchor.png'
import githubIcon from 'assets/icons/github.png'

import { DecimalUtil, toValidUrl } from 'utils'
import Decimal from 'decimal.js'
import { EPOCH_DURATION_MS } from 'primitives'
import { useGlobalStore } from 'stores'
import { FaUser } from 'react-icons/fa'

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
    transform: isHovering ? 'translateY(-5pxpx)' : 'translateY(0px)',
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
  const bg = useColorModeValue('white', '#15172c')
  const linksBg = useColorModeValue('#f5f7fa', '#1e1f34')

  const { global } = useGlobalStore()

  const [bestBlock, setBestBlock] = useState<number>()
  const [currentEra, setCurrentEra] = useState<number>()
  const [totalIssuance, setTotalIssuance] = useState<string>()

  const [nextEraTime, setNextEraTime] = useState(0)
  const [nextEraTimeLeft, setNextEraTimeLeft] = useState(0)

  const { hasCopied: hasRpcEndpointCopied, onCopy: onCopyRpcEndpoint } =
    useClipboard(appchainSettings?.rpc_endpoint || '')

  const { hasCopied: hasFunctionSpecCopied, onCopy: onCopyFunctionSpec } =
    useClipboard(
      toValidUrl(appchain?.appchain_metadata?.function_spec_url) || ''
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
      setTotalIssuance(issuance?.toString() || '0')
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
                  {appchain?.appchain_id || 'loading'}
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
          <StateBadge state={appchain?.appchain_state || ''} />
          <HStack className="octo-gray" fontSize="sm">
            <Text variant="gray">
              {appchain
                ? dayjs(
                    Math.floor((appchain.registered_time as any) / 1e6)
                  ).format('YYYY-MM-DD')
                : '-'}
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
        <RouterLink to={`/bridge/near/${appchain?.appchain_id}`}>
          <LinkBox icon={bridgeIcon} label="Bridge" />
        </RouterLink>
        <Link
          href={`${global?.network?.octopus.explorerUrl}/${appchain?.appchain_id}`}
          isExternal
        >
          <LinkBox icon={explorerIcon} label="Explorer" />
        </Link>
        <Link
          href={`${global?.network?.near.explorerUrl}/accounts/${appchain?.appchain_anchor}`}
          isExternal
        >
          <LinkBox icon={anchorIcon} label="Anchor" />
        </Link>
        <Link
          href={toValidUrl(appchain?.appchain_metadata?.website_url)}
          isExternal
        >
          <LinkBox icon={websiteIcon} label="Website" />
        </Link>
        <Link
          href={toValidUrl(appchain?.appchain_metadata?.github_address)}
          isExternal
        >
          <LinkBox icon={githubIcon} label="Github" />
        </Link>
      </SimpleGrid>
      <SimpleGrid
        mt={8}
        columns={{ base: 2, md: 3 }}
        spacing={8}
        display={{ base: 'none', md: 'grid' }}
      >
        <VStack alignItems="flex-start">
          <Text variant="gray" fontSize="sm">
            Block Height
          </Text>
          <Skeleton isLoaded={!!nextEraTime}>
            <Heading fontSize="xl">
              {bestBlock !== undefined
                ? DecimalUtil.beautify(new Decimal(bestBlock), 0)
                : 'loading'}
            </Heading>
          </Skeleton>
        </VStack>
        <VStack alignItems="flex-start">
          <Text variant="gray" fontSize="sm">
            Current Era
          </Text>
          <Skeleton isLoaded={currentEra !== undefined}>
            <Heading fontSize="xl">
              {currentEra !== undefined ? currentEra : 'loading'}
            </Heading>
          </Skeleton>
        </VStack>
        <VStack alignItems="flex-start">
          <HStack>
            <Text variant="gray" fontSize="sm">
              Next Era
            </Text>
            {nextEraTime ? (
              <CircularProgress
                value={
                  (EPOCH_DURATION_MS - nextEraTimeLeft) /
                  (EPOCH_DURATION_MS / 100)
                }
                size={4}
                thickness={16}
                color="octo-blue.500"
              />
            ) : null}
          </HStack>
          <Skeleton isLoaded={!!nextEraTime}>
            {nextEraTime ? (
              <Tooltip label={dayjs(nextEraTime).format('YYYY-MM-DD HH:mm:ss')}>
                <Heading fontSize="xl">
                  {dayjs
                    .duration(Math.floor(nextEraTimeLeft / 1000), 'seconds')
                    .humanize(true)}
                </Heading>
              </Tooltip>
            ) : (
              <Heading fontSize="xl">loading</Heading>
            )}
          </Skeleton>
        </VStack>
        <VStack alignItems="flex-start">
          <Text variant="gray" fontSize="sm">
            Token
          </Text>
          <Heading fontSize="xl">
            {appchain?.appchain_metadata?.fungible_token_metadata?.symbol ||
              '-'}
          </Heading>
        </VStack>
        <VStack alignItems="flex-start">
          <Text variant="gray" fontSize="sm">
            Total Supply
          </Text>
          <Skeleton isLoaded={!!totalIssuance}>
            <Heading
              fontSize="xl"
              maxW="200px"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
            >
              {totalIssuance && appchain?.appchain_metadata
                ? DecimalUtil.beautify(
                    DecimalUtil.fromString(
                      totalIssuance,
                      appchain?.appchain_metadata?.fungible_token_metadata
                        .decimals
                    ),
                    0
                  )
                : 'loading'}
            </Heading>
          </Skeleton>
        </VStack>
        <VStack alignItems="flex-start">
          <Text variant="gray" fontSize="sm">
            RPC Endpoint
          </Text>
          {appchainSettings?.rpc_endpoint ? (
            <HStack w="100%">
              <Heading
                fontSize="md"
                textOverflow="ellipsis"
                overflow="hidden"
                whiteSpace="nowrap"
                w="calc(100% - 30px)"
              >
                {appchainSettings?.rpc_endpoint || '-'}
              </Heading>
              <IconButton
                aria-label="copy"
                onClick={onCopyRpcEndpoint}
                size="xs"
              >
                {hasRpcEndpointCopied ? <CheckIcon /> : <CopyIcon />}
              </IconButton>
            </HStack>
          ) : (
            <Heading fontSize="xl">-</Heading>
          )}
        </VStack>
        <VStack alignItems="flex-start">
          <Text variant="gray" fontSize="sm">
            IDO Amount
          </Text>
          <Heading fontSize="xl">
            {appchain?.appchain_metadata?.ido_amount_of_wrapped_appchain_token
              ? DecimalUtil.beautify(
                  DecimalUtil.fromString(
                    appchain?.appchain_metadata
                      ?.ido_amount_of_wrapped_appchain_token,
                    appchain?.appchain_metadata?.fungible_token_metadata
                      .decimals
                  ),
                  0
                )
              : '-'}
          </Heading>
        </VStack>

        {/* <VStack alignItems="flex-start">
          <Text variant="gray" fontSize="sm" >Total Supply</Text>
          <Heading fontSize="xl">
            {
              wrappedAppchainToken ?
                DecimalUtil.beautify(
                  DecimalUtil.fromString(
                    wrappedAppchainToken.total_supply, 
                    wrappedAppchainToken.metadata.decimals
                  ),
                  0
                ) : '-'
            }
          </Heading>
        </VStack> */}
        <VStack alignItems="flex-start">
          <Text variant="gray" fontSize="sm">
            Era Reward
          </Text>
          <Heading fontSize="xl">
            {appchainSettings?.era_reward && wrappedAppchainToken
              ? DecimalUtil.beautify(
                  DecimalUtil.fromString(
                    appchainSettings?.era_reward,
                    wrappedAppchainToken.metadata.decimals
                  ),
                  0
                )
              : '-'}
          </Heading>
        </VStack>

        <VStack alignItems="flex-start">
          <Text variant="gray" fontSize="sm">
            Function Spec
          </Text>
          <HStack w="100%">
            <Heading
              fontSize="md"
              textOverflow="ellipsis"
              overflow="hidden"
              whiteSpace="nowrap"
              w="calc(100% - 30px)"
              title={toValidUrl(appchain?.appchain_metadata?.function_spec_url)}
            >
              {toValidUrl(appchain?.appchain_metadata?.function_spec_url) ||
                '-'}
            </Heading>
            <IconButton
              aria-label="copy"
              onClick={onCopyFunctionSpec}
              size="xs"
            >
              {hasFunctionSpecCopied ? <CheckIcon /> : <CopyIcon />}
            </IconButton>
          </HStack>
          {/* <Heading fontSize="xl">
            <Link
              href={toValidUrl(appchain?.appchain_metadata?.function_spec_url)}
              isExternal
            >
              <LinkBox icon={functionSpecIcon} label="Function Spec" />
            </Link>
          </Heading> */}
        </VStack>
      </SimpleGrid>
    </Box>
  )
}
