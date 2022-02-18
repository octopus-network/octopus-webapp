import React from 'react';

import {
  Center,
  Image,
  Text,
  VStack
} from '@chakra-ui/react';

import EmptyIcon from 'assets/empty.png';

type EmptyProps = {
  minH?: string | number;
  message?: string;
}

export const Empty: React.FC<EmptyProps> = ({ minH = '180px', message = 'No Data' }) => {
  return (
    <Center minH={minH}>
      <VStack>
        <Image src={EmptyIcon} w="80px" />
        <Text variant="gray">{message}</Text>
      </VStack>
    </Center>
  );
}