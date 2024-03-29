/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";

import {
  Box,
  List,
  HStack,
  Heading,
  Avatar,
  Button,
  useColorModeValue,
  Text,
  Image,
  VStack,
  SimpleGrid,
} from "@chakra-ui/react";

import {
  TokenAsset,
  CollectibleContract,
  Collectible,
  AppchainInfo,
} from "types";

import { Empty, BaseModal } from "components";
import failedToLoad from "assets/failed_to_load.svg";
import { ApiPromise } from "@polkadot/api";
import { useWalletSelector } from "components/WalletSelectorContextProvider";
import { getAppchainNFTs } from "utils/bridge";
import useNearAccount from "hooks/useNearAccount";
import { providers } from "near-api-js";
import { CodeResult } from "near-api-js/lib/providers/provider";

type SelectTokenModalProps = {
  isOpen: boolean;
  onClose: VoidFunction;
  selectedToken?: string;
  tokens: TokenAsset[] | undefined;
  isReverse?: boolean;
  appchainApi: ApiPromise | undefined;
  fromAccount: string | undefined;
  appchainId: string | undefined;
  collectibleClasses?: number[];
  onSelectToken: (
    account: TokenAsset | Collectible,
    isCollectible?: boolean
  ) => void;
  appchain: AppchainInfo;
};

export const SelectTokenModal: React.FC<SelectTokenModalProps> = ({
  tokens,
  isOpen,
  onClose,
  onSelectToken,
  selectedToken,
  appchainId,
  appchainApi,
  fromAccount,
  isReverse = false,
  collectibleClasses = [],
  appchain,
}) => {
  const bg = useColorModeValue("#f6f7fa", "#15172c");
  const [tabIdx, setTabIdx] = useState(0);
  const [collectibles, setCollectibles] = useState<Collectible[]>();

  const { networkConfig, selector } = useWalletSelector();
  const nearAccount = useNearAccount();

  useEffect(() => {
    if (
      !collectibleClasses?.length ||
      !appchainId ||
      !networkConfig ||
      !fromAccount ||
      !appchain
    ) {
      setCollectibles([]);
      return;
    }

    async function getNFTs() {
      if (isReverse) {
        const promises = collectibleClasses.map((classId) => {
          try {
            const contract = new CollectibleContract(
              nearAccount!,
              `${classId}.${appchainId}.${networkConfig?.octopus.registryContractId}`,
              {
                viewMethods: ["nft_tokens_for_owner"],
                changeMethods: [],
              }
            );

            return contract
              .nft_tokens_for_owner({
                account_id: fromAccount!,
                from_index: "0",
              })
              .then((res) => {
                return res
                  ? res.map((item: any) => ({ ...item, class: classId }))
                  : null;
              })
              .catch(console.error);
          } catch (error) {
            console.log("error", error);

            return null;
          }
        });

        Promise.all(promises).then((res) => {
          const tmpArr: any[] = res?.length
            ? res
                .filter((t) => t)
                .flat(Infinity)
                .map((item: any) => ({
                  id: item.token_id,
                  class: item.class,
                  owner: item.owner_id,
                  metadata: {
                    name: item.metadata?.title,
                    mediaUri: item.metadata?.media,
                  },
                }))
            : [];

          setCollectibles(tmpArr);
        });
      } else {
        if (!appchainApi?.isReady) {
          return;
        }

        const provider = new providers.JsonRpcProvider({
          url: selector.options.network.nodeUrl,
        });
        const res = await provider.query<CodeResult>({
          request_type: "call_function",
          account_id: appchain.appchain_anchor,
          method_name: "get_wrapped_appchain_nfts",
          args_base64: "",
          finality: "final",
        });
        const result = JSON.parse(Buffer.from(res.result).toString());

        getAppchainNFTs(
          collectibleClasses,
          appchainApi,
          fromAccount!,
          appchainId!,
          result
        ).then((res) => {
          setCollectibles(res);
        });
      }
    }

    getNFTs();
  }, [
    appchainId,
    JSON.stringify(collectibleClasses),
    isReverse,
    fromAccount,
    appchainApi,
    isOpen,
    appchain,
  ]);

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} maxW="xl">
      <HStack mt={2} spacing={3}>
        <Heading fontSize="lg">Select</Heading>
        <HStack spacing={0}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setTabIdx(0)}
            colorScheme={tabIdx === 0 ? "octo-blue" : "teal"}
            opacity={tabIdx === 0 ? 1 : 0.5}
          >
            Token
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setTabIdx(1)}
            colorScheme={tabIdx === 1 ? "octo-blue" : "teal"}
            opacity={tabIdx === 1 ? 1 : 0.5}
          >
            Collectible
          </Button>
        </HStack>
      </HStack>
      {tabIdx === 0 ? (
        <Box mt={4}>
          {!tokens?.length ? (
            <Empty message="No Tokens" />
          ) : (
            <List spacing={3} minH="15vh">
              {tokens?.map((token) => (
                <Box
                  p={2}
                  bg={selectedToken === token.metadata.symbol ? bg : ""}
                  _hover={{ background: bg }}
                  key={token.contractId}
                  borderRadius="md"
                  cursor="pointer"
                  onClick={() => onSelectToken(token)}
                >
                  <HStack w="calc(100% - 100px)">
                    <Avatar
                      name={token.metadata.symbol}
                      src={token.metadata.icon as any}
                      boxSize={8}
                      size="sm"
                    />
                    <VStack alignItems="flex-start" spacing={0}>
                      <Heading fontSize="md">
                        {token.metadata.symbol || "UNKNOWN"}
                      </Heading>
                      <Text fontSize="xs" color="gray">
                        {token.metadata.name}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              ))}
            </List>
          )}
        </Box>
      ) : (
        <Box p={4}>
          {!collectibles?.length ? (
            <Empty message="No Collectibles" />
          ) : (
            <SimpleGrid columns={[2, 3]} gap={5}>
              {collectibles.map((c, idx) => (
                <Box
                  key={`collectible-${idx}`}
                  cursor="pointer"
                  onClick={() => onSelectToken(c, true)}
                >
                  <Box bg={bg} borderRadius="md" overflow="hidden">
                    <Image
                      src={
                        (c.metadata?.mediaUri || c.metadata?.image) ??
                        failedToLoad
                      }
                    />
                  </Box>
                  <Heading fontSize="md" mt={2} textAlign="center">
                    {c.metadata.name}
                  </Heading>
                </Box>
              ))}
            </SimpleGrid>
          )}
        </Box>
      )}
    </BaseModal>
  );
};
