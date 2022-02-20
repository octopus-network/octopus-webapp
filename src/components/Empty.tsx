import React from 'react';

import {
  Center,
  Image,
  Text,
  VStack,
  Heading
} from '@chakra-ui/react';

import EmptyIcon from 'assets/empty.png';

type EmptyProps = {
  minH?: string | number;
  message?: string;
  helper?: string;
}

export const Empty: React.FC<EmptyProps> = ({ minH, message, helper }) => {
  return (
    <Center minH={minH || '180px'}>
      <VStack>
        <Image src={EmptyIcon} w="80px" />
        <Heading className="octo-gray" fontSize="md" fontWeight={600}>{message || 'No Data'}</Heading>
        { helper ? <Text variant="gray" fontSize="sm">{helper}</Text> : null }
      </VStack>
    </Center>
  );
}