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
  Switch,
  Text,
  useBoolean,
} from "@chakra-ui/react";

import { CheckIcon, CopyIcon, Search2Icon } from "@chakra-ui/icons";
import octoAvatar from "assets/icons/avatar.png";
import { Assets } from "./Assets";
import { Activity } from "./Activity";
import { Airdrops } from "./Airdrops";
import Rewards from "./Rewards";
import { useWalletSelector } from "components/WalletSelectorContextProvider";
import { AppchainInfo, NetworkType, Validator } from "types";
import { Toast } from "components/common/toast";
import useSWR from "swr";
import { API_HOST } from "config";
import { providers } from "near-api-js";
import { CodeResult } from "near-api-js/lib/providers/provider";
import { SIMPLE_CALL_GAS } from "primitives";

export const Dashboard: React.FC = () => {
  const bg = useColorModeValue("white", "#15172c");
  const { accountId, network, networkConfig, selector } = useWalletSelector();
  const [viewingAccount, setViewingAccount] = useState(accountId);
  const [isValidator, setIsValidator] = useState(false);
  const [isJoined, setIsJoined] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [signing, setSigning] = useBoolean();

  const { hasCopied: hasAccountIdCopied, onCopy: onCopyAccountId } =
    useClipboard(accountId || "");
  const { data: appchains } = useSWR<AppchainInfo[]>("appchains/running");

  useEffect(() => {
    if (appchains) {
      Promise.all(
        appchains.map((t) => {
          return fetch(`${API_HOST}/validators/${t.appchain_id}`);
        })
      )
        .then((res) => Promise.all(res.map(async (t) => await t.json())))
        .then((results: Validator[][]) => {
          const isValidator = results.some((t) =>
            t.some((v) => v.validator_id === viewingAccount)
          );
          setIsValidator(isValidator);
        });
    }
  }, [viewingAccount, appchains]);

  useEffect(() => {
    async function fetchJoined() {
      try {
        const provider = new providers.JsonRpcProvider({
          url: selector.options.network.nodeUrl,
        });
        const res = await provider.query<CodeResult>({
          request_type: "call_function",
          account_id: networkConfig?.octopus.councilContractId,
          method_name: "get_excluding_validator_accounts",
          args_base64: "",
          finality: "final",
        });
        const excludingAccounts = JSON.parse(
          Buffer.from(res.result).toString()
        );
        if (excludingAccounts.includes(accountId)) {
          setIsJoined(false);
        }
      } catch (error) {}
    }

    if (isValidator) {
      fetchJoined();
    }
  }, [networkConfig, isValidator, selector.options.network.nodeUrl, accountId]);

  const onChange = async () => {
    try {
      if (signing) {
        return;
      }
      setSigning.on();
      const wallet = await selector.wallet();
      await wallet.signAndSendTransaction({
        receiverId: networkConfig?.octopus.councilContractId,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: isJoined
                ? "exclude_validator_from_council"
                : "recover_excluding_validator",
              args: {},
              gas: SIMPLE_CALL_GAS,
              deposit: "0",
            },
          },
        ],
      });
      setSigning.off();
    } catch (error) {
      setSigning.off();
      Toast.error(error);
    }
  };

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
            <HStack>
              {accountId === viewingAccount && (
                <Tag variant="solid" colorScheme="blue">
                  Connected
                </Tag>
              )}
              {isValidator && (
                <Tag variant="solid" colorScheme="teal">
                  Validator
                </Tag>
              )}
              {isValidator && (
                <HStack>
                  <Switch isChecked={isJoined} onChange={onChange} />
                  <Text fontWeight="bold">Join Governance of Community?</Text>
                </HStack>
              )}
            </HStack>
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
          <Box p={6} borderRadius="md" bg={bg} h="100%">
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
