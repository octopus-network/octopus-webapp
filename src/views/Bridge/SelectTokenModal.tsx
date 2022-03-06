import React from 'react';

import {
  Box,
  List,
  HStack,
  Heading,
  Avatar,
  useColorModeValue,
  Text
} from '@chakra-ui/react';

import { TokenAsset } from 'types';

import { Empty, BaseModal } from 'components';

type SelectTokenModalProps = {
  isOpen: boolean;
  onClose: VoidFunction;
  selectedToken?: string;
  tokens: TokenAsset[] | undefined;
  onSelectToken: (account: TokenAsset) => void;
}

export const SelectTokenModal: React.FC<SelectTokenModalProps> = ({ tokens, isOpen, onClose, onSelectToken, selectedToken }) => {
  const bg = useColorModeValue('#f6f7fa', '#15172c');

  return (
    <BaseModal
      isOpen={isOpen}
      title="Select Token"
      onClose={onClose}>
      <Box>
        {
          !tokens?.length ?
          <Empty message="No Tokens" /> :
          <List spacing={3}>
            {
              tokens?.map(token => (
                <Box 
                  p={2}
                  bg={ selectedToken === token.metadata.symbol ? bg : '' }
                  _hover={{ background: bg }} 
                  key={token.contractId} 
                  borderRadius="lg" 
                  cursor="pointer" 
                  onClick={() => onSelectToken(token)}>
                  <HStack w="calc(100% - 100px)">
                    <Avatar name={token.metadata.symbol} src={token.metadata.icon as any} boxSize={8} size="sm" />
                    <Heading fontSize="md">{token.metadata.symbol || 'UNKNOWN'}</Heading>
                  </HStack>
                </Box>
              ))
            }
          </List>
        }
      </Box>
    </BaseModal>
  );
}