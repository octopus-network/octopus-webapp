import React, { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import dayjs from 'dayjs'
import { ApiPromise, WsProvider } from '@polkadot/api'

import {
  Flex,
  Heading,
  Avatar,
  Text,
  HStack,
  Box,
  Link,
  SimpleGrid,
  VStack,
  CircularProgress,
  Tooltip,
  useColorModeValue,
  Skeleton,
  SkeletonCircle,
} from '@chakra-ui/react'

import { useNavigate } from 'react-router-dom'
import { ChevronRightIcon } from '@chakra-ui/icons'
import { Link as RouterLink } from 'react-router-dom'
import { DecimalUtil, ZERO_DECIMAL } from 'utils'

import { OCT_TOKEN_DECIMALS, EPOCH_DURATION_MS } from 'primitives'

import { AppchainInfo, AppchainSettings, Delegator, Validator } from 'types'

type RunningAppchainsProps = {
  showMore?: boolean
}

type RunningItemProps = {
  whiteBg?: boolean
  data: AppchainInfo
}

const RunningItem: React.FC<RunningItemProps> = ({ whiteBg = false, data }) => {
  const bg = useColorModeValue(whiteBg ? 'white' : '#f6f7fa', '#15172c')
  const iconBg = useColorModeValue('white', 'whiteAlpha.100')

  const navigate = useNavigate()

  const icon = useMemo(
    () => data.appchain_metadata?.fungible_token_metadata?.icon || '',
    [data]
  )

  const [currentEra, setCurrentEra] = useState<number>()
  const [nextEraTime, setNextEraTime] = useState(0)
  const [nextEraTimeLeft, setNextEraTimeLeft] = useState(0)

  const { data: prices } = useSWR(
    `prices/OCT,${data.appchain_metadata?.fungible_token_metadata?.symbol}`
  )
  const { data: appchainSettings } = useSWR<AppchainSettings>(
    `appchain-settings/${data.appchain_id}`
  )
  const { data: validators } = useSWR<Validator[]>(
    `validators/${data.appchain_id}`
  )

  const { data: delegatorsArr } = useSWR<Delegator[][]>(
    validators?.length
      ? `${validators.map((v) => v.validator_id).join(',')}/${
          data.appchain_id
        }/delegators`
      : null
  )

  const delegatorsCount = useMemo(
    () => delegatorsArr?.flat(Infinity).length,
    [delegatorsArr]
  )

  const apy = useMemo(() => {
    if (!appchainSettings || !prices) return ZERO_DECIMAL
    const { fungible_token_metadata } = data.appchain_metadata || {}
    const rewardsPerYear = DecimalUtil.fromString(
      appchainSettings.era_reward,
      fungible_token_metadata.decimals
    )
      .mul(365)
      .mul(prices[fungible_token_metadata.symbol])

    return rewardsPerYear
      .mul(100)
      .div(
        DecimalUtil.fromString(data.total_stake, OCT_TOKEN_DECIMALS).mul(
          prices['OCT']
        )
      )
  }, [prices, data, appchainSettings])

  useEffect(() => {
    if (appchainSettings?.rpc_endpoint) {
      new ApiPromise({
        provider: new WsProvider(appchainSettings.rpc_endpoint),
      }).isReady.then((api: any) => {
        api.query.octopusLpos.activeEra().then((era: any) => {
          const eraJSON: any = era.toJSON()
          setCurrentEra(eraJSON?.index)

          setNextEraTime(eraJSON ? EPOCH_DURATION_MS + eraJSON.start : 0)
          setNextEraTimeLeft(
            eraJSON
              ? eraJSON.start + EPOCH_DURATION_MS - new Date().getTime()
              : 0
          )
          api.disconnect()
        })
      })
    }
  }, [appchainSettings])

  return (
    <Box
      bg={bg}
      borderRadius="lg"
      p={6}
      cursor="pointer"
      transition="all .3s ease"
      _hover={{
        boxShadow: '0 10px 10px -5px rgba(0,0,12,.06)',
        transform: 'translateY(-3px) scale(1.01)',
      }}
      onClick={() => navigate(`/appchains/${data?.appchain_id}`)}
    >
      <Flex justifyContent="space-between" alignItems="center">
        <HStack>
          <Avatar
            src={icon as any}
            style={icon ? { backgroundColor: iconBg } : {}}
            name={data.appchain_id}
            boxSize={9}
          />
          <Heading fontSize="lg">{data.appchain_id}</Heading>
        </HStack>
        <Tooltip
          label={`Next Era: ${
            currentEra !== undefined
              ? dayjs(nextEraTime).format('YYYY-MM-DD HH:mm:ss')
              : '-'
          }`}
        >
          <Box>
            <CircularProgress
              value={
                currentEra !== undefined
                  ? (EPOCH_DURATION_MS - nextEraTimeLeft) /
                    (EPOCH_DURATION_MS / 100)
                  : 0
              }
              size={5}
              thickness={16}
              color="octo-blue.500"
            />
          </Box>
        </Tooltip>
      </Flex>
      <Flex mt={6} justifyContent="space-between">
        <VStack alignItems="flex-start">
          <Text variant="gray" fontSize="sm">
            Validators
          </Text>
          <Heading fontSize="lg">{data.validator_count}</Heading>
        </VStack>
        <VStack alignItems="flex-start">
          <Text variant="gray" fontSize="sm">
            Delegators
          </Text>
          <Skeleton isLoaded={delegatorsCount !== undefined}>
            <Heading fontSize="lg">
              {delegatorsCount === undefined ? 'loading' : delegatorsCount}
            </Heading>
          </Skeleton>
        </VStack>
        <VStack alignItems="flex-start">
          <Text variant="gray" fontSize="sm">
            Staked OCT
          </Text>
          <Heading fontSize="lg">
            {DecimalUtil.beautify(
              DecimalUtil.fromString(data.total_stake, OCT_TOKEN_DECIMALS)
            )}
          </Heading>
        </VStack>
        <VStack alignItems="flex-start">
          <Text variant="gray" fontSize="sm">
            APY
          </Text>
          <Heading fontSize="lg">
            {apy.gt(ZERO_DECIMAL) ? `${DecimalUtil.beautify(apy, 2)}%` : '-'}
          </Heading>
        </VStack>
      </Flex>
    </Box>
  )
}

const BlankItem: React.FC<Omit<RunningItemProps, 'data'>> = ({ whiteBg }) => {
  const bg = useColorModeValue(whiteBg ? 'white' : '#f6f7fa', '#15172c')

  return (
    <Box bg={bg} borderRadius="lg" p={6}>
      <Flex justifyContent="space-between">
        <HStack>
          <SkeletonCircle boxSize={10} />
          <Skeleton>
            <Heading fontSize="lg">loading</Heading>
          </Skeleton>
        </HStack>
      </Flex>
      <Flex mt={6} justifyContent="space-between">
        <VStack alignItems="flex-start">
          <Skeleton>
            <Text variant="gray" fontSize="sm">
              loading
            </Text>
          </Skeleton>
          <Skeleton>
            <Heading fontSize="lg">loading</Heading>
          </Skeleton>
        </VStack>
        <VStack alignItems="flex-start">
          <Skeleton>
            <Text variant="gray" fontSize="sm">
              loading
            </Text>
          </Skeleton>
          <Skeleton>
            <Heading fontSize="lg">loading</Heading>
          </Skeleton>
        </VStack>
        <VStack alignItems="flex-start">
          <Skeleton>
            <Text variant="gray" fontSize="sm">
              loading
            </Text>
          </Skeleton>
          <Skeleton>
            <Heading fontSize="lg">loading</Heading>
          </Skeleton>
        </VStack>
        <VStack alignItems="flex-start">
          <Skeleton>
            <Text variant="gray" fontSize="sm">
              loading
            </Text>
          </Skeleton>
          <Skeleton>
            <Heading fontSize="lg">loading</Heading>
          </Skeleton>
        </VStack>
      </Flex>
    </Box>
  )
}

export const RunningAppchains: React.FC<RunningAppchainsProps> = ({
  showMore = true,
}) => {
  const { data } = useSWR('appchains/running')

  return (
    <>
      <Flex alignItems="center" justifyContent="space-between">
        <Heading fontSize="xl">Running Appchains</Heading>
        {showMore ? (
          <Link as={RouterLink} to="/appchains" variant="gray-underline">
            <HStack spacing={0}>
              <Text>More</Text>
              <ChevronRightIcon />
            </HStack>
          </Link>
        ) : null}
      </Flex>
      <SimpleGrid gap={8} mt={8} columns={{ base: 1, md: 2 }}>
        {!data?.length ? (
          <>
            <BlankItem whiteBg={!showMore} />
            <BlankItem whiteBg={!showMore} />
          </>
        ) : (
          data.map((item: any, idx: number) => (
            <RunningItem key={`item-${idx}`} whiteBg={!showMore} data={item} />
          ))
        )}
      </SimpleGrid>
    </>
  )
}
