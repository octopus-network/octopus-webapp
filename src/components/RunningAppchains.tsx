import React, { useMemo } from 'react';
import useSWR from 'swr';
import { DecimalUtil } from 'utils';

import {
  Flex,
  Heading,
  Image,
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

import { ChevronRightIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import { HiOutlineArrowNarrowRight } from 'react-icons/hi';

import { OCT_TOKEN_DECIMALS } from 'config';

type RunningAppchainsProps = {
  showMore?: boolean;
}

type RunnintItemProps = {
  whiteBg?: boolean;
  data: any;
}

const RunningItem: React.FC<RunnintItemProps> = ({ whiteBg = false, data }) => {

  const bg = useColorModeValue(whiteBg ? 'white' : '#f6f7fa', '#15172c');
  const iconBg = useColorModeValue('white', 'white');
  const gray = useColorModeValue('gray.200', 'whiteAlpha.200');

  const icon = useMemo(() => data.appchain_metadata?.fungible_token_metadata?.icon, [data]);

  return (
    <Box bg={bg} borderRadius="lg" p={6}>
      <Flex justifyContent="space-between">
        <HStack>
          <Box boxSize={10} borderRadius="full" bg={icon ? iconBg : gray} overflow="hidden">
            <Image src={icon} w="100%" />
          </Box>
          <Heading fontSize="lg">{data.appchain_id}</Heading>
        </HStack>
        <Button variant="ghost" color="octoBlue" size="sm">
          Enter <Icon as={HiOutlineArrowNarrowRight} ml={1} />
        </Button>
      </Flex>
      <Flex mt={6} justifyContent="space-between">
        <VStack alignItems="flex-start">
          <Text variant="gray">Validators</Text>
          <Heading fontSize="xl">{data.validator_count}</Heading>
        </VStack>
        <VStack alignItems="flex-start">
          <Text variant="gray">Staked</Text>
          <Flex>
            <Heading fontSize="xl">
              {
                DecimalUtil.beautify(
                  DecimalUtil.fromString(data.total_stake, OCT_TOKEN_DECIMALS)
                )
              }
            </Heading>
            <Heading fontSize="sm" mt="6px" ml={2}>OCT</Heading>
          </Flex>
        </VStack>
        <VStack alignItems="flex-start">
          <Text variant="gray">APY</Text>
          <Heading fontSize="xl">
            3.98%
          </Heading>
        </VStack>
      </Flex>
    </Box>
  );
}

const BlankItem: React.FC<Omit<RunnintItemProps, 'data'>> = ({ whiteBg }) => {
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
          <Skeleton>
            <Text variant="gray">loading</Text>
          </Skeleton>
          <Skeleton>
            <Heading fontSize="xl">loading</Heading>
          </Skeleton>
        </VStack>
        <VStack alignItems="flex-start">
          <Skeleton>
            <Text variant="gray">loading</Text>
          </Skeleton>
          <Skeleton>
            <Heading fontSize="xl">loading</Heading>
          </Skeleton>
        </VStack>
        <VStack alignItems="flex-start">
          <Skeleton>
            <Text variant="gray">loading</Text>
          </Skeleton>
          <Skeleton>
            <Heading fontSize="xl">loading</Heading>
          </Skeleton>
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