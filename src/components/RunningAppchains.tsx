import React from 'react';

import {
  Flex,
  Heading,
  Text,
  HStack,
  Container,
  Box,
  Link,
  SimpleGrid,
  Button,
  VStack,
  Icon,
  useColorModeValue
} from '@chakra-ui/react';

import { ChevronRightIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import { HiOutlineArrowNarrowRight } from 'react-icons/hi';

type RunningAppchainsProps = {
  showMore?: boolean;
}

type RunnintItemProps = {
  whiteBg?: boolean;
}

const RunningItem: React.FC<RunnintItemProps> = ({ whiteBg = false }) => {

  const bg = useColorModeValue(whiteBg ? 'white' : '#f6f7fa', '#15172c');

  return (
    <Box bg={bg} borderRadius="lg" p={6}>
      <Flex justifyContent="space-between">
        <HStack>
          <Box boxSize={10} borderRadius="full" bg="gray.300">

          </Box>
          <Heading fontSize="lg">Myriad</Heading>
        </HStack>
        <Button variant="ghost" color="octoBlue" size="sm">
          Enter <Icon as={HiOutlineArrowNarrowRight} ml={1} />
        </Button>
      </Flex>
      <Flex mt={6} justifyContent="space-between">
        <VStack alignItems="flex-start">
          <Text variant="gray">Validators</Text>
          <Heading fontSize="xl">
            64
          </Heading>
        </VStack>
        <VStack alignItems="flex-start">
          <Text variant="gray">Staked</Text>
          <Flex>
            <Heading fontSize="xl">64</Heading>
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

export const RunningAppchains: React.FC<RunningAppchainsProps> = ({ showMore = true }) => {
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
        <RunningItem whiteBg={!showMore} />
        <RunningItem whiteBg={!showMore} />
      </SimpleGrid>
    </>
  );
}