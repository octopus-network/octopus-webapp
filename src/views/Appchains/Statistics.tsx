import React from 'react';

import {
  Flex,
  Heading,
  SimpleGrid,
  Box,
  VStack,
  Text,
  Image,
  useColorModeValue
} from '@chakra-ui/react';

import bootingIcon from 'assets/icons/booting.png';

const StatCard: React.FC = () => {
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
            <Heading fontSize="3xl">12</Heading>
            <Text variant="gray">Booting</Text>
          </VStack>
          <Box boxSize={14}>
            <Image src={bootingIcon} w="100%" />
          </Box>
        </Flex>
      </Box>
    </Box>
  );
}

export const Statistics: React.FC = () => {
  return (
    <>
      <Flex alignItems="center" justifyContent="space-between">
        <Heading fontSize="xl">Data Statistics</Heading>
      </Flex>
      <SimpleGrid gap={8} mt={8} columns={{ base: 1, md: 3 }}>
        <StatCard />
        <StatCard />
        <StatCard />
      </SimpleGrid>
    </>
  );
}