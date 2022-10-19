import React from "react";

import {
  Container,
  Grid,
  GridItem,
  Box,
  Image,
  Heading,
  Divider,
  VStack,
  HStack,
  IconButton,
  useColorModeValue,
  useClipboard,
} from "@chakra-ui/react";

import { CheckIcon, CopyIcon } from "@chakra-ui/icons";
import octoAvatar from "assets/icons/avatar.png";
import { Assets } from "./Assets";
import { Activity } from "./Activity";
import { Airdrops } from "./Airdrops";
import Rewards from "./Rewards";
import { useWalletSelector } from "components/WalletSelectorContextProvider";

export const Dashboard: React.FC = () => {
  const bg = useColorModeValue("white", "#15172c");
  const { accountId } = useWalletSelector();

  const { hasCopied: hasAccountIdCopied, onCopy: onCopyAccountId } =
    useClipboard(accountId || "");

  return (
    <Container>
      <Grid
        templateColumns={{ base: "repeat(4, 1fr)", lg: "repeat(7, 1fr)" }}
        mt={10}
        gap={6}
      >
        <GridItem colSpan={{ base: 4, lg: 3 }}>
          <Box p={6} borderRadius="lg" bg={bg} h="100%">
            <VStack spacing={5} pt={6} pb={6}>
              <Box w="52px" borderRadius="full" overflow="hidden">
                <Image src={octoAvatar} w="100%" />
              </Box>
              <HStack w="80%" justifyContent="center">
                <Heading
                  fontSize="xl"
                  maxW="calc(100% - 40px)"
                  textOverflow="ellipsis"
                  overflow="hidden"
                  whiteSpace="nowrap"
                >
                  {accountId || "No account connected"}
                </Heading>
                <IconButton
                  aria-label="copy"
                  size="xs"
                  onClick={onCopyAccountId}
                >
                  {hasAccountIdCopied ? <CheckIcon /> : <CopyIcon />}
                </IconButton>
              </HStack>
            </VStack>
            <Divider mt={6} mb={6} />
            <Assets />
          </Box>
        </GridItem>
        <GridItem colSpan={4}>
          <Box gap={6} h="100%">
            <Rewards />
            <Airdrops />
            <Activity />
          </Box>
        </GridItem>
      </Grid>
    </Container>
  );
};
