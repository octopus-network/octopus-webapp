import {
  DrawerHeader,
  Flex,
  HStack,
  Button,
  CloseButton,
  Heading,
  DrawerBody
} from '@chakra-ui/react';

type TxDetailProps = {
  onDrawerClose: VoidFunction;
}

export const TxDetail: React.FC<TxDetailProps> = ({ onDrawerClose }) => {

  return (
    <>
      <DrawerHeader borderBottomWidth="0">
        <Flex justifyContent="space-between" alignItems="center">
          <HStack>
            <Heading fontSize="lg">Transaction Detail</Heading>
          </HStack>
          <CloseButton onClick={onDrawerClose} />
        </Flex>
      </DrawerHeader>
      <DrawerBody pb={6}>
        tx detail
      </DrawerBody>
    </>
  );
}