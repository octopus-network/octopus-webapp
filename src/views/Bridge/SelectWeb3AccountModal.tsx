import React from "react";

import {
  Box,
  List,
  HStack,
  Heading,
  VStack,
  useColorModeValue,
  Text,
} from "@chakra-ui/react";

import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";

import { Empty, BaseModal } from "components";
import OctIdenticon from "components/common/OctIdenticon";

type SelectWeb3AccountModalProps = {
  isOpen: boolean;
  onClose: VoidFunction;
  selectedAccount?: InjectedAccountWithMeta;
  accounts: InjectedAccountWithMeta[] | undefined;
  onChooseAccount: (account: InjectedAccountWithMeta) => void;
};

export const SelectWeb3AccountModal: React.FC<SelectWeb3AccountModalProps> = ({
  accounts,
  isOpen,
  onClose,
  onChooseAccount,
  selectedAccount,
}) => {
  const bg = useColorModeValue("#f6f7fa", "#15172c");

  return (
    <BaseModal
      isOpen={isOpen}
      title="Select Account"
      maxW={600}
      onClose={onClose}
    >
      <Box>
        {!accounts?.length ? (
          <Empty message="No Accounts. Please install wallet extension." />
        ) : (
          <List spacing={3}>
            {accounts?.map((account) => {
              const isSelected =
                account.address === selectedAccount?.address &&
                selectedAccount?.meta.source === account.meta.source;

              return (
                <Box
                  p={2}
                  bg={isSelected ? bg : ""}
                  _hover={{ background: bg }}
                  key={account.address}
                  borderRadius="md"
                  cursor="pointer"
                  onClick={() => onChooseAccount(account)}
                >
                  <HStack w="calc(100% - 100px)">
                    <OctIdenticon value={account.address} size={32} />
                    <VStack spacing={0} alignItems="flex-start" w="100%">
                      <Heading fontSize="md">
                        {account.meta.name || "No Name"}
                      </Heading>
                      <Text fontSize="xs" color="gray.500">
                        injected from {account.meta.source}
                      </Text>
                      <Text
                        variant="gray"
                        w="100%"
                        whiteSpace="nowrap"
                        overflow="hidden"
                        textOverflow="ellipsis"
                      >
                        {account.address}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              );
            })}
          </List>
        )}
      </Box>
    </BaseModal>
  );
};
