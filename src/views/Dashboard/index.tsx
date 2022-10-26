import React, { useEffect, useState } from "react";

import {
  Container,
  Grid,
  GridItem,
  Box,
  Image,
  Heading,
  HStack,
  IconButton,
  useColorModeValue,
  useClipboard,
  Input,
  InputGroup,
  InputLeftElement,
  VStack,
  Tag,
} from "@chakra-ui/react";

import { CheckIcon, CopyIcon, Search2Icon } from "@chakra-ui/icons";
import octoAvatar from "assets/icons/avatar.png";
import { Assets } from "./Assets";
import { Activity } from "./Activity";
import { Airdrops } from "./Airdrops";
import Rewards from "./Rewards";
import { useWalletSelector } from "components/WalletSelectorContextProvider";
import { NetworkType } from "types";
import { Toast } from "components/common/toast";

export const Dashboard: React.FC = () => {
  const bg = useColorModeValue("white", "#15172c");
  const { accountId, network } = useWalletSelector();
  const [viewingAccount, setViewingAccount] = useState(accountId);
  const [keyword, setKeyword] = useState("");

  const { hasCopied: hasAccountIdCopied, onCopy: onCopyAccountId } =
    useClipboard(accountId || "");

  useEffect(() => {
    if (accountId) {
      setViewingAccount(accountId);
    }
  }, [accountId]);

  return (
    <Container>
      <HStack spacing={5} pt={6} justify="space-between">
        <HStack>
          <Box w="52px" borderRadius="full" overflow="hidden">
            <Image src={octoAvatar} w="100%" />
          </Box>
          <VStack alignItems="flex-start">
            <HStack justifyContent="center">
              <Heading
                fontSize="xl"
                textOverflow="ellipsis"
                overflow="hidden"
                whiteSpace="nowrap"
              >
                {viewingAccount || accountId || "No account connected"}
              </Heading>
              <IconButton aria-label="copy" size="xs" onClick={onCopyAccountId}>
                {hasAccountIdCopied ? <CheckIcon /> : <CopyIcon />}
              </IconButton>
            </HStack>
            {accountId === viewingAccount && (
              <Tag variant="solid" colorScheme="teal">
                Connected
              </Tag>
            )}
          </VStack>
        </HStack>
        <InputGroup maxW={400}>
          <InputLeftElement
            pointerEvents="none"
            children={<Search2Icon color="gray.300" />}
          />
          <Input
            type="text"
            placeholder="Search other users"
            variant="outline"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.code === "Enter") {
                if (keyword.length === 64) {
                  setViewingAccount(keyword);
                  setKeyword("");
                } else if (network === NetworkType.MAINNET) {
                  if (keyword.endsWith(".near")) {
                    setViewingAccount(keyword);
                    setKeyword("");
                  } else {
                    Toast.error("Please enter a valid NEAR account ID");
                  }
                } else if (network === NetworkType.TESTNET) {
                  if (keyword.endsWith(".testnet")) {
                    setViewingAccount(keyword);
                    setKeyword("");
                  } else {
                    Toast.error("Please enter a valid NEAR account ID");
                  }
                }
              }
            }}
          />
        </InputGroup>
      </HStack>
      <Grid
        templateColumns={{ base: "repeat(4, 1fr)", lg: "repeat(7, 1fr)" }}
        mt={4}
        gap={6}
      >
        <GridItem colSpan={{ base: 4, lg: 3 }}>
          <Box p={6} borderRadius="lg" bg={bg} h="100%">
            <Assets viewingAccount={viewingAccount} />
          </Box>
        </GridItem>
        <GridItem colSpan={4}>
          <Box gap={6} h="100%">
            <Rewards viewingAccount={viewingAccount} />
            <Airdrops viewingAccount={viewingAccount} />
            <Activity viewingAccount={viewingAccount} />
          </Box>
        </GridItem>
      </Grid>
    </Container>
  );
};
