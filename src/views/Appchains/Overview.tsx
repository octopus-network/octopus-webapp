import React from 'react';

import {
  DrawerHeader,
  DrawerBody,
  Heading,
  CloseButton,
  Flex
} from '@chakra-ui/react';

type OverviewProps = {
  appchainId: string | undefined;
  onDrawerClose: VoidFunction;
}

export const Overview: React.FC<OverviewProps> = ({ appchainId, onDrawerClose }) => {
  return (
    <>
      <DrawerHeader borderBottomWidth="0">
        <Flex justifyContent="space-between" alignItems="center">
          <Heading fontSize="lg">Overview</Heading>
          <CloseButton onClick={onDrawerClose} />
        </Flex>
      </DrawerHeader>
      <DrawerBody>
      Overview
      </DrawerBody>
    </>
  );
}