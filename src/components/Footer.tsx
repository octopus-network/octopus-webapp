import React from 'react';

import {
  Container,
  Divider,
  Stack,
  HStack,
  Link,
  Text,
  Icon,
  Box
} from '@chakra-ui/react';

import { 
  AiFillTwitterCircle, 
  AiFillGithub 
} from 'react-icons/ai';

import { FaDiscord } from 'react-icons/fa';

export const Footer: React.FC = () => {
  return (
    <Container pt={4} pb={4}>
      <Divider />
      <Stack 
        pt={6} pb={6} 
        fontSize="sm"
        spacing={6}
        alignItems="center"
        justifyContent="space-between" 
        direction={{ base: 'column', md: 'row' }}>
        <HStack spacing={[2, 3]} w="100%" flex={1} justifyContent={{ base: 'center', md: 'flex-start' }}>
          <Link variant="gray-underline" whiteSpace="nowrap" 
            overflow="hidden" textOverflow="ellipsis">Term of service</Link>
          <Text variant="gray" opacity=".5">|</Text>
          <Link variant="gray-underline" whiteSpace="nowrap" 
            overflow="hidden" textOverflow="ellipsis">Privacy policy</Link>
          <Text variant="gray" opacity=".5">|</Text>
          <Link variant="gray-underline" whiteSpace="nowrap" 
            overflow="hidden" textOverflow="ellipsis">Registry contract</Link>
          <Text variant="gray" opacity=".5">|</Text>
          <Link variant="gray-underline" whiteSpace="nowrap" 
            overflow="hidden" textOverflow="ellipsis">Token contract</Link>
        </HStack>
        <HStack spacing={3}>
          <Text variant="gray">&copy; 2022 Octopus Network</Text>
          <Link variant="gray-hover-blue">
            <Icon as={AiFillTwitterCircle} boxSize={5} />
          </Link>
          <Link variant="gray-hover-blue">
            <Icon as={AiFillGithub} boxSize={5} />
          </Link>
          <Link variant="gray-hover-blue">
            <Icon as={FaDiscord} boxSize={5} />
          </Link>
        </HStack>
      </Stack>
    </Container>
  );
}