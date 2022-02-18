import React, { useMemo } from 'react';
import useSWR from 'swr';

import {
  Flex,
  HStack,
  Heading,
  Tooltip,
  useColorModeValue,
  Icon,
  Image,
  Avatar,
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

import { AppchainInfo } from 'types';

import Decimal from 'decimal.js';
import rank1Icon from 'assets/icons/rank1.png';
import rank2Icon from 'assets/icons/rank2.png';
import rank3Icon from 'assets/icons/rank3.png';

import { useNavigate } from 'react-router-dom';
import { DecimalUtil, ZERO_DECIMAL } from 'utils';
import { OCT_TOKEN_DECIMALS } from 'primitives';

type VotingItemProps = {
  rank: number;
  data: AppchainInfo;
  highestVotes: number;
}

const rankIcons = [rank1Icon, rank2Icon, rank3Icon];

const VotingItem: React.FC<VotingItemProps> = ({ rank, data, highestVotes }) => {
  const hoverBg = useColorModeValue('gray.100', 'whiteAlpha.100');
  const rankBg = useColorModeValue('gray.300', 'whiteAlpha.300');

  const red = useColorModeValue('#ff5959', '#ff5959');
  const green = useColorModeValue('#12cd76', '#12cd76');

  const navigate = useNavigate();

  const downvotes = useMemo(() => DecimalUtil.fromString(data.downvote_deposit, OCT_TOKEN_DECIMALS), [data]);
  const upvotes = useMemo(() => DecimalUtil.fromString(data.upvote_deposit, OCT_TOKEN_DECIMALS), [data]);

  const votingScore = useMemo(() => DecimalUtil.fromString(data.voting_score, OCT_TOKEN_DECIMALS), [data]);

  const pendingScore = useMemo(() => upvotes.sub(downvotes), [downvotes, upvotes]);
  
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
      onClick={() => navigate(`/appchains/overview/${data.appchain_id}`)}>
      <Grid templateColumns={{ base: 'repeat(6, 1fr)', md: 'repeat(11, 1fr)' }} alignItems="center" gap={6}>
        <GridItem colSpan={1} display={{ base: 'none', md: 'table-cell' }}>
          <Box boxSize="28px" borderRadius="full" overflow="hidden">
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
            <Avatar src={data.appchain_metadata?.fungible_token_metadata?.icon as any} name={data.appchain_id} boxSize={7} />
            <Heading fontSize="md" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
              {data.appchain_id}
            </Heading>
          </HStack>
        </GridItem>
        <GridItem colSpan={4} display={{ base: 'none', md: 'table-cell' }}>
          <SimpleGrid columns={2} gap={6}>
            <VStack alignItems="flex-start" spacing={1}>
              <Text fontSize="sm" className="octo-gray">{DecimalUtil.beautify(new Decimal(upvotes))}</Text>
              <Progress colorScheme="octo-blue" size="sm" value={upvotes.toNumber()} max={highestVotes} w="100%" borderRadius="lg" />
            </VStack>
            <VStack alignItems="flex-start" spacing={1}>
              <Text fontSize="sm" className="octo-gray">{DecimalUtil.beautify(new Decimal(downvotes))}</Text>
              <Progress colorScheme="whatsapp" size="sm" value={downvotes.toNumber()} max={highestVotes} w="100%" borderRadius="lg" />
            </VStack>
          </SimpleGrid>
        </GridItem>
        <GridItem colSpan={2} d="flex">
          <Box position="relative">
            <Heading fontSize="md">{DecimalUtil.beautify(votingScore)}</Heading>
            <Box 
              top="-10px"
              right="0"
              padding="3px 8px" 
              position="absolute" 
              bg={pendingScore.lt(ZERO_DECIMAL) ? 'rgba(229, 62, 62, .1)' : 'rgba(56, 161, 105, .1)'} 
              borderRadius="2xl"
              transform="translateX(100%) scale(.8)">
              <Heading color={pendingScore.lt(ZERO_DECIMAL) ? red : green} fontSize="xs" 
                whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis" maxW="120px">
                {pendingScore.lt(ZERO_DECIMAL) ? '-' : '+'} {DecimalUtil.beautify(pendingScore.abs(), 2)}
              </Heading>
            </Box>
          </Box>
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

  const { data: appchains } = useSWR('appchains/voting');

  const highestVotes = useMemo(() => {
    if (!appchains?.length) {
      return 0;
    }

    let highest = ZERO_DECIMAL;

    appchains.forEach((appchain: AppchainInfo) => {
      const upvoteDeposit = DecimalUtil.fromString(appchain.upvote_deposit, OCT_TOKEN_DECIMALS);
      const downvoteDeposit = DecimalUtil.fromString(appchain.downvote_deposit, OCT_TOKEN_DECIMALS);
      if (upvoteDeposit.gt(highest)) {
        highest = upvoteDeposit;
      }

      if (downvoteDeposit.gt(highest)) {
        highest = downvoteDeposit;
      }
    });

    return highest.toNumber();
  }, [appchains]);

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
          {
            appchains?.length ?
            appchains.map((appchain: AppchainInfo, idx: number) => (
              <VotingItem data={appchain} key={`voting-item-${idx}`} rank={idx + 1} highestVotes={highestVotes} />
            )) : null
          }
        </List>
      </Box>
    </>
  );
}