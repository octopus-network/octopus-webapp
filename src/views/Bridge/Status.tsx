/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useMemo, useEffect } from 'react'
import useSWR from 'swr'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import Identicon from '@polkadot/react-identicon'
import { encodeAddress } from '@polkadot/util-crypto'

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
} from '@chakra-ui/react'

import { DecimalUtil, decodeNearAccount } from 'utils'
import { Link as RouterLink, useParams, useNavigate } from 'react-router-dom'

import {
  ExternalLinkIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from '@chakra-ui/icons'

import { AppchainInfoWithAnchorStatus, NetworkConfig } from 'types'

import { BiTimeFive } from 'react-icons/bi'
import { AiOutlineArrowRight } from 'react-icons/ai'
import nearLogo from 'assets/near.svg'
import { useGlobalStore } from 'stores'
import { TxDetail } from './TxDetail'

enum BridgeStatus {
  Pending,
  Success,
  Failed,
}

type BridgeHistory = {
  id: string
  direction: string
  appchain_name: string
  event: string
  amount: string
  from: string
  to: string
  outHash: string
  inHashes: (string | null)[]
  status: BridgeStatus
  timestamp: number
  message?: string
}

type RowProps = {
  data: BridgeHistory
  network: NetworkConfig | null
}

dayjs.extend(relativeTime)

const statusObj: Record<
  string,
  {
    color: string
    label: string
  }
> = {
  Pending: {
    color: 'green',
    label: 'Pending',
  },
  Success: {
    color: 'blue',
    label: 'Success',
  },
  Failed: {
    color: 'red',
    label: 'Failed',
  },
}

const Row: React.FC<RowProps> = ({ data, network }) => {
  const bg = useColorModeValue('white', '#15172c')

  const [isAppchainSide, appchainId] = useMemo(
    () => [
      data.direction === 'appchain_to_near',
      data.appchain_name.replace(`${network?.near.networkId}-`, ''),
    ],
    [data]
  )

  const { data: appchain } = useSWR<AppchainInfoWithAnchorStatus>(
    `appchain/${appchainId}`
  )

  return (
    <Skeleton isLoaded={!!appchain || !network}>
      <Box left={0} top={0} right={0} pb={1} opacity={0.6}>
        <Flex justifyContent="space-between">
          <Box p={1} borderRadius="lg">
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
                  {isAppchainSide ? appchainId : 'NEAR'}
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
                  {!isAppchainSide ? appchainId : 'NEAR'}
                </Text>
              </HStack>
            </HStack>
          </Box>
          <Box p={1} borderRadius="lg">
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
          borderRadius="lg"
          gap={6}
          alignItems="center"
          cursor="pointer"
          transition="all .3s ease"
          _hover={{
            boxShadow: '0 10px 10px -5px rgba(0,0,12,.06)',
            transform: 'translateY(-3px) scale(1.01)',
          }}
        >
          <GridItem colSpan={2}>
            <HStack spacing={2}>
              <Heading
                fontSize="sm"
                color={data.event === 'Burnt' ? 'green.500' : 'blue.500'}
              >
                {data.event}
              </Heading>
              <Heading
                fontSize="md"
                whiteSpace="nowrap"
                overflow="hidden"
                textOverflow="ellipsis"
                className="tx-hash-ellipsis"
                style={{ width: 90 }}
              >
                {appchain
                  ? DecimalUtil.beautify(
                      DecimalUtil.fromString(
                        data.amount.replaceAll(',', ''),
                        appchain?.appchain_metadata?.fungible_token_metadata
                          ?.decimals
                      )
                    )
                  : '-'}
              </Heading>
              <Text fontSize="sm" color="gray.500">
                {appchain?.appchain_metadata?.fungible_token_metadata.symbol ||
                  '-'}
              </Text>
            </HStack>
          </GridItem>
          <GridItem colSpan={2}>
            <Link
              href={
                isAppchainSide
                  ? `${network?.octopus.explorerUrl}/?appchain=${appchain?.appchain_id}#/accounts/${encodeAddress(data.from)}`
                  : `${network?.near.explorerUrl}/accounts/${decodeNearAccount(data.from)}`
              }
              _hover={{ textDecoration: 'underline' }}
              color="#2468f2"
              isExternal
              onClick={(e) => e.stopPropagation()}
            >
              <HStack spacing={1}>
                {isAppchainSide ? (
                  <Identicon value={data.from} size={18} />
                ) : null}
                <Text
                  whiteSpace="nowrap"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  className="tx-hash-ellipsis"
                >
                  {
                  isAppchainSide && data.from
                    ? encodeAddress(data.from)
                    : decodeNearAccount(data.from)
                  }
                </Text>
                <Icon as={ExternalLinkIcon} boxSize={3} color="gray" />
              </HStack>
            </Link>
          </GridItem>
          <GridItem colSpan={2}>
            <Link
              href={
                isAppchainSide
                  ? `${network?.octopus.explorerUrl}/?appchain=${appchain?.appchain_id}#/extrinsics/${data.outHash}`
                  : `${network?.near.explorerUrl}/transactions/${data.outHash}`
              }
              _hover={{ textDecoration: 'underline' }}
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
          </GridItem>

          <GridItem colSpan={2}>
            <Link
              href={
                !isAppchainSide
                  ? `${network?.octopus.explorerUrl}/?appchain=${appchain?.appchain_id}#/accounts/${encodeAddress(data.to)}`
                  : `${network?.near.explorerUrl}/accounts/${decodeNearAccount(data.to)}`
              }
              _hover={{ textDecoration: 'underline' }}
              color="#2468f2"
              isExternal
              onClick={(e) => e.stopPropagation()}
            >
              <HStack spacing={1}>
                {!isAppchainSide ? (
                  <Identicon value={data.to} size={18} />
                ) : null}
                <Text
                  whiteSpace="nowrap"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  className="tx-hash-ellipsis"
                >
                  {
                  !isAppchainSide && data.to
                    ? encodeAddress(data.to)
                    : decodeNearAccount(data.to)
                  }
                </Text>
                <Icon as={ExternalLinkIcon} boxSize={3} color="gray" />
              </HStack>
            </Link>
          </GridItem>
          <GridItem colSpan={2}>
            {data.inHashes?.[0] ? (
              <Link
                href={
                  !isAppchainSide
                    ? `${network?.octopus.explorerUrl}/?appchain=${appchain?.appchain_id}#/extrinsics/${data.inHashes?.[0]}`
                    : `${network?.near.explorerUrl}/transactions/${data.inHashes?.[0]}`
                }
                _hover={{ textDecoration: 'underline' }}
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
  )
}

function Page({
  page,
  network,
}: {
  page: number
  network: NetworkConfig | null
}) {
  const pageSize = 20
  const { data: txns } = useSWR<any[]>(
    `bridge-helper/bridge_txs?start=${(page - 1) * pageSize}&size=${pageSize}`
  )
  return (
    <>
      {(txns ?? []).map((tx, idx) => (
        <Row data={tx} key={`row-${idx}`} network={network} />
      ))}
    </>
  )
}

export const Status: React.FC = () => {
  const [page, setPage] = useState(1)

  const { txId } = useParams()
  const navigate = useNavigate()
  const { global } = useGlobalStore()

  const pages = []
  for (let i = 1; i < page + 1; i++) {
    pages.push(<Page page={i} key={i} network={global.network} />)
  }

  useEffect(() => {
    const onScroll = (e: any) => {
      if (document.body.getBoundingClientRect().bottom <= window.innerHeight) {
        setPage(page + 1)
      }
    }
    document?.addEventListener('scroll', onScroll)

    return () => document?.removeEventListener('scroll', onScroll)
  }, [page])

  const onDetailDrawerClose = () => {
    navigate(`/bridge/txs`)
  }

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
        <Grid
          templateColumns="repeat(12, 1fr)"
          p={4}
          color="gray.500"
          gap={8}
          fontSize="sm"
        >
          <GridItem colSpan={2}>
            <Text>Token</Text>
          </GridItem>
          <GridItem colSpan={2}>
            <Text>From</Text>
          </GridItem>
          <GridItem colSpan={2}>
            <Text>Out Hash</Text>
          </GridItem>
          <GridItem colSpan={2}>
            <Text>To</Text>
          </GridItem>
          <GridItem colSpan={2}>
            <Text>In Hashes</Text>
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
  )
}
