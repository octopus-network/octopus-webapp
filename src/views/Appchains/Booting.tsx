import React from 'react';

import {
  Flex,
  HStack,
  Heading,
  Tooltip,
  useColorModeValue,
  Icon,
  Grid,
  List,
  GridItem,
  Box,
} from '@chakra-ui/react';

import { 
  QuestionOutlineIcon, 
  ChevronRightIcon 
} from '@chakra-ui/icons';

import { useNavigate } from 'react-router-dom';

const BootingItem: React.FC = () => {
  const hoverBg = useColorModeValue('gray.100', 'whiteAlpha.100');
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
      <Grid templateColumns={{ base: 'repeat(7, 1fr)', md: 'repeat(10, 1fr)' }} alignItems="center" gap={6}>
        <GridItem colSpan={3}>
          <HStack>
            <Box boxSize={8} bg="gray.300" borderRadius="full" display={{ base: 'none', md: 'block' }}></Box>
            <Heading fontSize="md" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">debio-network</Heading>
          </HStack>
        </GridItem>
        <GridItem colSpan={3} display={{ base: 'none', md: 'table-cell' }}>
          <Heading fontSize="md">12</Heading>
        </GridItem>
        <GridItem colSpan={3}>
          <Heading fontSize="md">4000 OCT</Heading>
        </GridItem>
        <GridItem colSpan={1} textAlign="right">
          <Icon as={ChevronRightIcon} boxSize={6} className="octo-gray" opacity=".8" />
        </GridItem>
      </Grid>
    </Box>
  );
}

export const Booting: React.FC = () => {
  const bg = useColorModeValue('white', '#25263c');

  return (
    <>
      <Flex>
        <Tooltip label="Booting Appchains">
          <HStack>
            <Heading fontSize="xl">Booting</Heading>
            <Icon as={QuestionOutlineIcon} boxSize={4} className="octo-gray" />
          </HStack>
        </Tooltip>
      </Flex>
      <Box mt={8} bg={bg} p={6} borderRadius="lg">
        <Box p={4}>
          <Grid templateColumns={{ base: 'repeat(7, 1fr)', md: 'repeat(10, 1fr)' }} className="octo-gray" gap={6}>
            <GridItem colSpan={3}>ID</GridItem>
            <GridItem colSpan={3} display={{ base: 'none', md: 'table-cell' }}>Validators</GridItem>
            <GridItem colSpan={3}>Staked</GridItem>
            <GridItem colSpan={1}/>
          </Grid>
        </Box>
        <List>
          <BootingItem />
          <BootingItem />
          <BootingItem />
        </List>
      </Box>
    </>
  );
}