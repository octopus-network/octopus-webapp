import React, { useMemo } from 'react';
import useSWR from 'swr';
import styled from 'styled-components';

import {
  Flex,
  Heading,
  Avatar,
  Text,
  HStack,
  Box,
  Link,
  SimpleGrid,
  Button,
  VStack,
  Icon,
  useColorModeValue,
  Skeleton,
  SkeletonCircle
} from '@chakra-ui/react';

import { useNavigate } from 'react-router-dom';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import { HiOutlineArrowNarrowRight } from 'react-icons/hi';
import { DecimalUtil, ZERO_DECIMAL } from 'utils';

import { OCT_TOKEN_DECIMALS } from 'primitives';

import {
  AppchainInfo,
  AppchainSettings,
  Delegator,
  Validator
} from 'types';

type RunningAppchainsProps = {
  showMore?: boolean;
}

type RunningItemProps = {
  whiteBg?: boolean;
  data: AppchainInfo;
}

const EnterButton = styled(Button)`
  svg {
    transition: .6s ease;
    transform: translateX(0px);
  }
  &:hover {
    svg {
      transform: translateX(5px);
    }
  }
`;

const RunningItem: React.FC<RunningItemProps> = ({ whiteBg = false, data }) => {

  const bg = useColorModeValue(whiteBg ? 'white' : '#f6f7fa', '#15172c');
  const iconBg = useColorModeValue('white', 'whiteAlpha.100');

  const navigate = useNavigate();

  const icon = useMemo(() => data.appchain_metadata?.fungible_token_metadata?.icon || '', [data]);

  const { data: prices } = useSWR(`prices/OCT,${data.appchain_metadata?.fungible_token_metadata?.symbol}`);
  const { data: appchainSettings } = useSWR<AppchainSettings>(`appchain-settings/${data.appchain_id}`);
  const { data: validators } = useSWR<Validator[]>(`validators/${data.appchain_id}`);

  const { data: delegatorsArr } = useSWR<Delegator[][]>(
    validators?.length ? `${validators.map(v => v.validator_id).join(',')}/${data.appchain_id}/delegators` : null
  );

  const delegatorsCount = useMemo(() => delegatorsArr?.flat(Infinity).length, [delegatorsArr]);

  const apy = useMemo(() => {
    if (!appchainSettings || !prices) return ZERO_DECIMAL;
    const { fungible_token_metadata } = data.appchain_metadata || {};
    const rewardsPerYear = DecimalUtil
      .fromString(
        appchainSettings.era_reward,
        fungible_token_metadata.decimals
      ).mul(365).mul(prices[fungible_token_metadata.symbol]);

    return rewardsPerYear.mul(100).div(
      DecimalUtil.fromString(data.total_stake, OCT_TOKEN_DECIMALS).mul(prices['OCT'])
    );
  }, [prices, data, appchainSettings]);

  return (
    <Box bg={bg} borderRadius="lg" p={6} cursor="pointer"
      transition="all .3s ease"
      _hover={{
        boxShadow: '0 10px 10px -5px rgba(0,0,12,.06)',
        transform: 'translateY(-3px) scale(1.01)'
      }}
      onClick={() => navigate(`/appchains/${data?.appchain_id}`)}>
      <Flex justifyContent="space-between">
        <HStack>
          <Avatar src={icon as any} style={icon ? { backgroundColor: iconBg } : {}} name={data.appchain_id} boxSize={9} />
          <Heading fontSize="lg">{data.appchain_id}</Heading>
        </HStack>
        <RouterLink to={`/appchains/${data?.appchain_id}`}>
          <EnterButton variant="ghost" colorScheme="octo-blue" size="sm">
            Enter <Icon as={HiOutlineArrowNarrowRight} ml={1} />
          </EnterButton>
        </RouterLink>
      </Flex>
      <Flex mt={6} justifyContent="space-between">
        <VStack alignItems="flex-start">
          <Text variant="gray" fontSize="sm">Validators</Text>
          <Heading fontSize="lg">{data.validator_count}</Heading>
        </VStack>
        <VStack alignItems="flex-start">
          <Text variant="gray" fontSize="sm">Delegators</Text>
          <Skeleton isLoaded={delegatorsCount !== undefined}>
            <Heading fontSize="lg">{delegatorsCount === undefined ? 'loading' : delegatorsCount}</Heading>
          </Skeleton>
        </VStack>
        <VStack alignItems="flex-start">
          <Text variant="gray" fontSize="sm">Staked OCT</Text>
          <Heading fontSize="lg">
            {
              DecimalUtil.beautify(
                DecimalUtil.fromString(data.total_stake, OCT_TOKEN_DECIMALS)
              )
            }
          </Heading>
        </VStack>
        <VStack alignItems="flex-start">
          <Text variant="gray" fontSize="sm">APY</Text>
          <Heading fontSize="lg">
            {apy.gt(ZERO_DECIMAL) ? `${DecimalUtil.beautify(apy, 2)}%` : '-'}
          </Heading>
        </VStack>
      </Flex>
    </Box>
  );
}

const BlankItem: React.FC<Omit<RunningItemProps, 'data'>> = ({ whiteBg }) => {
  const bg = useColorModeValue(whiteBg ? 'white' : '#f6f7fa', '#15172c');

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
          <Skeleton><Text variant="gray" fontSize="sm">loading</Text></Skeleton>
          <Skeleton><Heading fontSize="lg">loading</Heading></Skeleton>
        </VStack>
        <VStack alignItems="flex-start">
          <Skeleton><Text variant="gray" fontSize="sm">loading</Text></Skeleton>
          <Skeleton><Heading fontSize="lg">loading</Heading></Skeleton>
        </VStack>
        <VStack alignItems="flex-start">
          <Skeleton><Text variant="gray" fontSize="sm">loading</Text></Skeleton>
          <Skeleton><Heading fontSize="lg">loading</Heading></Skeleton>
        </VStack>
        <VStack alignItems="flex-start">
          <Skeleton><Text variant="gray" fontSize="sm">loading</Text></Skeleton>
          <Skeleton><Heading fontSize="lg">loading</Heading></Skeleton>
        </VStack>
      </Flex>
    </Box>
  );
}

export const RunningAppchains: React.FC<RunningAppchainsProps> = ({ showMore = true }) => {
  const { data } = useSWR('appchains/running');

  return (
    <>
      <Flex alignItems="center" justifyContent="space-between">
        <Heading fontSize="xl">Running Appchains</Heading>
        {
          showMore ?
            <Link as={RouterLink} to="/appchains" variant="gray-underline">
              <HStack spacing={0}>
                <Text>More</Text>
                <ChevronRightIcon />
              </HStack>
            </Link> : null
        }
      </Flex>
      <SimpleGrid gap={8} mt={8} columns={{ base: 1, md: 2 }}>
        {
          !data?.length ?
            <>
              <BlankItem whiteBg={!showMore} />
              <BlankItem whiteBg={!showMore} />
            </> :
            data.map((item: any, idx: number) => (
              <RunningItem key={`item-${idx}`} whiteBg={!showMore} data={item} />
            ))
        }
      </SimpleGrid>
    </>
  );
}