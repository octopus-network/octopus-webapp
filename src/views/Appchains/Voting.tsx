import React from 'react';

import {
  Flex,
  HStack,
  Heading,
  Tooltip,
  useColorModeValue,
  Icon,
  Image,
  Text,
  Grid,
  List,
  SimpleGrid,
  VStack,
  GridItem,
  Progress,
  Box,
} from '@chakra-ui/react';

import { 
  QuestionOutlineIcon, 
  ChevronRightIcon 
} from '@chakra-ui/icons';

import rank1Icon from 'assets/icons/rank1.png';
import rank2Icon from 'assets/icons/rank2.png';
import rank3Icon from 'assets/icons/rank3.png';

import { useNavigate } from 'react-router-dom';

type VotingItemProps = {
  rank: number;
}

const rankIcons = [rank1Icon, rank2Icon, rank3Icon];

const VotingItem: React.FC<VotingItemProps> = ({ rank }) => {
  const hoverBg = useColorModeValue('gray.100', 'whiteAlpha.100');
  const rankBg = useColorModeValue('gray.300', 'whiteAlpha.300');

  const navigate = useNavigate();
  
  return (
    <Box 
      p={4} 
      cursor="pointer"
      borderRadius="lg"
      className="transition"
      backgroundColor="transparent"
      _hover={{
        backgroundColor: hoverBg,
        transform: 'scale(1.01)'
      }}
      onClick={() => navigate(`/appchains/overview/debio-network`)}>
      <Grid templateColumns={{ base: 'repeat(6, 1fr)', md: 'repeat(11, 1fr)' }} alignItems="center" gap={6}>
        <GridItem colSpan={1} display={{ base: 'none', md: 'table-cell' }}>
          <Box boxSize="28px" borderRadius="full">
            {
              rank <= 3 ?
              <Image src={rankIcons[rank-1]} w="100%" /> : 
              <Box boxSize="24px" m="2px" borderRadius="full" bg={rankBg} color="white" d="flex" 
                alignItems="center" justifyContent="center">
                <Heading fontSize="xs">{rank}</Heading>
              </Box>
            }
          </Box>
        </GridItem>
        <GridItem colSpan={3}>
          <HStack>
            <Box boxSize={7} bg="gray.300" borderRadius="full" display={{ base: 'none', md: 'block' }}></Box>
            <Heading fontSize="md" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">debio-network</Heading>
          </HStack>
        </GridItem>
        <GridItem colSpan={4} display={{ base: 'none', md: 'table-cell' }}>
          <SimpleGrid columns={2} gap={6}>
            <VStack alignItems="flex-start" spacing={1}>
              <Text fontSize="sm" className="octo-gray">5664</Text>
              <Progress colorScheme="whatsapp" size="sm" value={20} max={100} w="100%" borderRadius="lg" />
            </VStack>
            <VStack alignItems="flex-start" spacing={1}>
              <Text fontSize="sm" className="octo-gray">5664</Text>
              <Progress colorScheme="whatsapp" size="sm" value={20} max={100} w="100%" borderRadius="lg" />
            </VStack>
          </SimpleGrid>
        </GridItem>
        <GridItem colSpan={2}>
          <Heading fontSize="md">4000</Heading>
        </GridItem>
        <GridItem colSpan={1} textAlign="right">
          <Icon as={ChevronRightIcon} boxSize={6} className="octo-gray" opacity=".8" />
        </GridItem>
      </Grid>
    </Box>
  );
}

export const Voting: React.FC = () => {
  const bg = useColorModeValue('white', '#25263c');

  return (
    <>
      <Flex alignItems="center" justifyContent="space-between">
        <Tooltip label="Voting Appchains">
          <HStack>
            <Heading fontSize="xl">Voting</Heading>
            <Icon as={QuestionOutlineIcon} boxSize={4} className="octo-gray" />
          </HStack>
        </Tooltip>
        <HStack>
          <HStack>
            <Box boxSize={2} borderRadius="full" bg="#457ef4" />
            <Text variant="gray">Upvotes</Text>
          </HStack>
          <HStack>
            <Box boxSize={2} borderRadius="full" bg="#48cfcf" />
            <Text variant="gray">Downvotes</Text>
          </HStack>
        </HStack>
      </Flex>
      <Box mt={8} bg={bg} p={6} borderRadius="lg">
        <Box p={4}>
          <Grid templateColumns={{ base: 'repeat(6, 1fr)', md: 'repeat(11, 1fr)' }} className="octo-gray" gap={6}>
            <GridItem colSpan={1} display={{ base: 'none', md: 'table-cell' }}>Rank</GridItem>
            <GridItem colSpan={3}>ID</GridItem>
            <GridItem colSpan={4} display={{ base: 'none', md: 'table-cell' }}>Votes</GridItem>
            <GridItem colSpan={2}>Score</GridItem>
            <GridItem colSpan={1}/>
          </Grid>
        </Box>
        <List>
          <VotingItem rank={1} />
          <VotingItem rank={2} />
          <VotingItem rank={3} />
          <VotingItem rank={4} />
        </List>
      </Box>
    </>
  );
}