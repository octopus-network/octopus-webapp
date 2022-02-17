import React from 'react';
import dayjs from 'dayjs';

import {
  Box,
  Flex,
  HStack,
  Avatar,
  Image,
  VStack,
  Text,
  Heading,
  SimpleGrid,
  SkeletonCircle,
  useColorModeValue,
  Skeleton,
  useBoolean
} from '@chakra-ui/react';

import {
  useSpring,
  animated,
} from 'react-spring';

import { StateBadge } from 'components';
import { AppchainInfoWithAnchorStatus } from 'types';

import websiteIcon from 'assets/icons/website.png';
import explorerIcon from 'assets/icons/explorer.png';
import bridgeIcon from 'assets/icons/bridge.png';
import functionSpecIcon from 'assets/icons/function-spec.png';
import githubIcon from 'assets/icons/github.png';

type DescriptionsProps = {
  data: AppchainInfoWithAnchorStatus | undefined;
}

type LinkBoxProps = {
  label: string;
  icon: any;
  to?: string;
  href?: string;
}

const LinkBox: React.FC<LinkBoxProps> = ({ label, icon }) => {
  const [isHovering, setIsHovering] = useBoolean(false);

  const iconHoveringProps = useSpring({
    transform: isHovering ? 'translateY(-5pxpx)' : 'translateY(0px)'
  });

  return (
    <Box p={2} cursor="pointer" onMouseEnter={setIsHovering.on} onMouseLeave={setIsHovering.off}>
      <VStack spacing={1}>
        <animated.div style={iconHoveringProps}>
          <Box boxSize={8}><Image src={icon} w="100%" /></Box>
        </animated.div>
        <Text fontSize="sm" whiteSpace="nowrap" textOverflow="ellipsis" overflow="hidden" maxW="100%">{label}</Text>
      </VStack>
    </Box>
  );
}

export const Descriptions: React.FC<DescriptionsProps> = ({ data }) => {
  const bg = useColorModeValue('white', '#15172c');
  const linksBg = useColorModeValue('#f5f7fa', '#1e1f34');

  return (
    <Box bg={bg} p={6} borderRadius="lg">
      <Flex alignItems="center" justifyContent="space-between" minH="68px">
        <HStack spacing={4}>
          <SkeletonCircle size="12" isLoaded={!!data}>
            <Avatar src={data?.appchain_metadata?.fungible_token_metadata.icon as any} 
              name={data?.appchain_id} boxSize={12} />
          </SkeletonCircle>
          <VStack alignItems="flex-start" spacing={0}>
            <Skeleton isLoaded={!!data}>
              <Heading fontSize="2xl">{data?.appchain_id || 'loading'}</Heading>
            </Skeleton>
            <Text variant="gray">{data?.appchain_owner}</Text>
          </VStack>
        </HStack>
        <VStack alignItems="flex-end" spacing={0}>
          <StateBadge state={data?.appchain_state || ''} />
          <Text variant="gray">
            {data ? dayjs(Math.floor(data.registered_time as any/1e6)).format('YYYY-MM-DD') : '-'}
          </Text>
        </VStack>
      </Flex>
      <SimpleGrid columns={{ base: 3, md: 5 }} spacing={4} mt={8} bg={linksBg} borderRadius="lg">
        <LinkBox icon={websiteIcon} label="Website" />
        <LinkBox icon={explorerIcon} label="Explorer" />
        <LinkBox icon={bridgeIcon} label="Bridge" />
        <LinkBox icon={functionSpecIcon} label="Function Spec" />
        <LinkBox icon={githubIcon} label="Github" />
      </SimpleGrid>
      <SimpleGrid mt={8} columns={{ base: 2, md: 3 }} spacing={8} display={{ base: 'none', md: 'grid' }}>
        <VStack alignItems="flex-start">
          <Text variant="gray"fontSize="sm" >Block Height</Text>
          <Heading fontSize="xl">123,456</Heading>
        </VStack>
        <VStack alignItems="flex-start">
          <Text variant="gray" fontSize="sm" >Current Era</Text>
          <Skeleton isLoaded={!!data?.anchor_status}>
            <Heading fontSize="xl">{data?.anchor_status?.index_range_of_validator_set_history?.end_index || 'loading'}</Heading>
          </Skeleton>
        </VStack>
        <VStack alignItems="flex-start">
          <Text variant="gray" fontSize="sm" >Next Era</Text>
          <Heading fontSize="xl">123,456</Heading>
        </VStack>
        <VStack alignItems="flex-start">
          <Text variant="gray" fontSize="sm" >RPC Endpoint</Text>
          <Heading fontSize="xl">123,456</Heading>
        </VStack>
        <VStack alignItems="flex-start">
          <Text variant="gray" fontSize="sm" >Token</Text>
          <Heading fontSize="xl">123,456</Heading>
        </VStack>
        <VStack alignItems="flex-start">
          <Text variant="gray" fontSize="sm" >IDO Amount</Text>
          <Heading fontSize="xl">123,456</Heading>
        </VStack>
        <VStack alignItems="flex-start">
          <Text variant="gray" fontSize="sm" >Total Issuance</Text>
          <Heading fontSize="xl">123,456</Heading>
        </VStack>
        <VStack alignItems="flex-start">
          <Text variant="gray" fontSize="sm" >Premined Amount</Text>
          <Heading fontSize="xl">123,456</Heading>
        </VStack>
        <VStack alignItems="flex-start">
          <Text variant="gray" fontSize="sm" >Era Reward</Text>
          <Heading fontSize="xl">123,456</Heading>
        </VStack>
      </SimpleGrid>
    </Box>
  );
}