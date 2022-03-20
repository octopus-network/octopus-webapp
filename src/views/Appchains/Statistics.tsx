import React from 'react';
import useSWR from 'swr';

import {
  Flex,
  Heading,
  SimpleGrid,
  Skeleton,
  Box,
  VStack,
  Text,
  Image,
  useColorModeValue
} from '@chakra-ui/react';

import bootingIcon from 'assets/icons/booting.png';
import votingIcon from 'assets/icons/voting.png';
import establishedIcon from 'assets/icons/establish.png';

type StatCardProps = {
  label: string;
  value: number | undefined;
  icon: any;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon }) => {
  const bg = useColorModeValue('white', '#25263c');

  const bgGradient = useColorModeValue(
    'linear(180deg, #f4f5fb, #ffffff)', 
    'linear(180deg, #0f1025 0%, #25263c)'
  );

  return (
    <Box 
      p="1px"
      bg={bg}
      borderRadius="lg"
      boxShadow="0px 0px 30px 0px rgba(0,29,97,0.10)">
      <Box 
        p={4}
        borderRadius="lg"
        bgGradient={bgGradient}>
        <Flex pl={4} pr={4} alignItems="center" justifyContent="space-between">
          <VStack alignItems="flex-start">
            <Skeleton isLoaded={value !== undefined}>
              <Heading fontSize="3xl">
                {value !== undefined ? value : 'loading'}
              </Heading>
            </Skeleton>
            <Text variant="gray">{label}</Text>
          </VStack>
          <Box boxSize={14}>
            <Image src={icon} w="100%" />
          </Box>
        </Flex>
      </Box>
    </Box>
  );
}

export const Statistics: React.FC = () => {
  const { data: statistics } = useSWR(`statistics`);

  return (
    <>
      <Flex alignItems="center" justifyContent="space-between">
        <Heading fontSize="xl">Data Statistics</Heading>
      </Flex>
      <SimpleGrid gap={8} mt={8} columns={{ base: 1, md: 3 }}>
        <StatCard label="Booting" value={statistics?.bootingAppchainsCount} icon={bootingIcon} />
        <StatCard label="Voting" value={statistics?.votingAppchainsCount} icon={votingIcon} />
        <StatCard label="Pre-Voting" value={
          statistics ? statistics.preAuditAppchainsCount + statistics.auditingAppchainsCount : undefined
        } icon={establishedIcon} />
      </SimpleGrid>
    </>
  );
}