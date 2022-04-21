import {
  DrawerHeader,
  Flex,
  HStack,
  CloseButton,
  Heading,
  DrawerBody
} from '@chakra-ui/react';

import useSWR from 'swr';
import { useParams } from 'react-router-dom';

type TxDetailProps = {
  onDrawerClose: VoidFunction;
}

export const TxDetail: React.FC<TxDetailProps> = ({ onDrawerClose }) => {
  const { txId } = useParams();

  const { data: transaction } = useSWR(txId ? `bridge-helper/bridgeTx/${txId}` : null);

  console.log(transaction);

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