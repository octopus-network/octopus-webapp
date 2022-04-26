import React, { useEffect, useState } from 'react'

import relativeTime from 'dayjs/plugin/relativeTime'
import duration from 'dayjs/plugin/duration'
import dayjs from 'dayjs'

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
  IconButton,
} from '@chakra-ui/react'

import { StateBadge } from 'components'

import {
  AppchainInfoWithAnchorStatus,
  AppchainSettings,
  WrappedAppchainToken,
} from 'types'

import type { ApiPromise } from '@polkadot/api'
import { CheckIcon, CopyIcon } from '@chakra-ui/icons'

import { DecimalUtil, toValidUrl } from 'utils'
import Decimal from 'decimal.js'
import { EPOCH_DURATION_MS } from 'primitives'
import { useGlobalStore } from 'stores'
import { FaUser } from 'react-icons/fa'
import {
  FiAnchor,
  FiGlobe,
  FiCompass,
  FiGithub,
  FiRepeat,
  FiFileText,
} from 'react-icons/fi'

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
  link?: string
}

const LinkBox = ({ label, icon, link }: LinkBoxProps) => {
  return (
    <HStack style={{ flex: 1 }}>
      <Link
        href={link}
        target={link?.startsWith('http') ? '_blank' : '_self'}
        style={{ color: '#008cd5' }}
      >
        <HStack spacing={1} style={{ cursor: 'pointer' }}>
          {icon}
          <Text
            fontSize="sm"
            whiteSpace="nowrap"
            textOverflow="ellipsis"
            overflow="hidden"
            maxW="100%"
          >
            {label}
          </Text>
        </HStack>
      </Link>
    </HStack>
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

  const linkItems = [
    [
      {
        link: `/bridge/near/${appchain?.appchain_id}`,
        label: 'Bridge',
        icon: <FiRepeat size={18} />,
      },
      {
        link: `${global?.network?.octopus.explorerUrl}/?appchain=${appchain?.appchain_id}`,
        label: 'Explorer',
        icon: <FiCompass size={18} />,
      },
      {
        link: `${global?.network?.near.explorerUrl}/accounts/${appchain?.appchain_anchor}`,
        label: 'Anchor Contract',
        icon: <FiAnchor size={18} />,
      },
    ],
    [
      {
        link: toValidUrl(appchain?.appchain_metadata?.website_url),
        label: 'Website',
        icon: <FiGlobe size={18} />,
      },
      {
        link: toValidUrl(appchain?.appchain_metadata?.function_spec_url),
        label: 'Function Spec',
        icon: <FiFileText size={18} />,
      },
      {
        link: toValidUrl(appchain?.appchain_metadata?.github_address),
        label: 'Github',
        icon: <FiGithub size={18} />,
      },
    ],
  ]

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
        columns={{ base: 1, md: 1 }}
        spacing={4}
        mt={8}
        padding={4}
        bg={linksBg}
        borderRadius="lg"
      >
        <VStack width="100%">
          {linkItems.map((items, index) => {
            return (
              <HStack key={index} width="100%">
                {items.map((item, index) => {
                  return <LinkBox key={item.link} {...item} />
                })}
              </HStack>
            )
          })}
        </VStack>
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
            <Heading fontSize="xl">
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
                title={appchainSettings?.rpc_endpoint}
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
      </SimpleGrid>
    </Box>
  )
}
