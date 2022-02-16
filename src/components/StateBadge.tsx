import React from 'react';

import {
  HStack,
  Box,
  Heading,
  Flex,
} from '@chakra-ui/react';

const state2color: Record<string, string> = {
  'Registered': 'gray',
  'Dead': 'gray',
  'Auditing': 'green',
  'InQueue': 'teal',
  'Staging': 'blue',
  'Booting': 'orange',
  'Active': 'cyan'
}

const state2label: Record<string, string> = {
  'Registered': 'Registered',
  'Dead': 'Registered',
  'Auditing': 'Auditing',
  'InQueue': 'Voting',
  'Staging': 'Staking',
  'Booting': 'Booting',
  'Active': 'Running'
}

type StateBadgeProps = {
  state: string;
}

export const StateBadge: React.FC<StateBadgeProps> = ({ state }) => {
 
  return (
    <Flex bg="rgba(56, 161, 105, .1)" p="3px 6px" borderRadius="3xl" w="auto">
      <HStack>
        <Box bg={state2color[state]} boxSize="8px" borderRadius="full" />
        <Heading fontSize="14px" color={state2color[state]}>{state2label[state]}</Heading>
      </HStack>
    </Flex>
  );
}
