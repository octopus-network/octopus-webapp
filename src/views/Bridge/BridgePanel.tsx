import React, { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { PulseLoader } from "react-spinners";
import { providers } from "near-api-js";
import detectEthereumProvider from "@metamask/detect-provider";

import {
  Box,
  Heading,
  Flex,
  useColorModeValue,
  Center,
  HStack,
  Text,
  Icon,
  IconButton,
  Spinner,
  CircularProgress,
  CircularProgressLabel,
  Button,
  useBoolean,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  useInterval,
  Tooltip,
  Alert,
  AlertIcon,
  AlertTitle,
} from "@chakra-ui/react";

import {
  AppchainInfoWithAnchorStatus,
  TokenAsset,
  AppchainSettings,
  BridgeHistoryStatus,
  BridgeConfig,
  Collectible,
} from "types";

import { ChevronRightIcon } from "@chakra-ui/icons";
import { stringToHex } from "@polkadot/util";

import { web3FromSource, web3Enable } from "@polkadot/extension-dapp";

import { Empty } from "components";
import { MdSwapVert } from "react-icons/md";
import { History } from "./History";
import {
  useParams,
  useNavigate,
  useLocation,
  Link as RouterLink,
} from "react-router-dom";
import { DecimalUtil } from "utils";
import { useTxnsStore } from "stores";

import useAccounts from "hooks/useAccounts";
import { useWalletSelector } from "components/WalletSelectorContextProvider";
import { Toast } from "components/common/toast";
import { CodeResult } from "near-api-js/lib/providers/provider";
import {
  checkEvmTxSequence,
  evmBurn,
  isValidAddress,
  isValidAmount,
  nearBurn,
  nearBurnNft,
  substrateBurn,
} from "utils/bridge";
import AddressInpput from "components/Bridge/AddressInput";
import TokenInput from "components/Bridge/TokenInput";
import Decimal from "decimal.js";
import { SIMPLE_CALL_GAS } from "primitives";

export const BridgePanel: React.FC = () => {
  const bg = useColorModeValue("white", "#15172c");
  const { appchainId } = useParams();
  const navigate = useNavigate();

  const [isTransferring, setIsTransferring] = useBoolean();
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useBoolean();

  const { accountId, registry, networkConfig, selector } = useWalletSelector();
  const { txns, updateTxn, clearTxnsOfAppchain } = useTxnsStore();
  const { data: appchain } = useSWR<AppchainInfoWithAnchorStatus>(
    appchainId ? `appchain/${appchainId}` : null,
    { refreshInterval: 10 * 1000 }
  );
  const { data: appchainSettings } = useSWR<AppchainSettings>(
    appchainId ? `appchain-settings/${appchainId}` : null
  );

  const { data: tokens } = useSWR<TokenAsset[]>(
    appchainId ? `tokens/${appchainId}` : null
  );
  const { data: bridgeConfig } = useSWR<BridgeConfig>(
    appchainId ? `bridge-config/${appchainId}` : null
  );

  const isEvm = appchain?.appchain_metadata.template_type === "BarnacleEvm";

  const { pathname } = useLocation();
  const isNearToAppchain = useMemo(
    () => !appchainId || new RegExp(`^/bridge/near/`).test(pathname),
    [appchainId, pathname]
  );

  const { currentAccount } = useAccounts(isEvm, !!appchainId);

  const [appchainApi, setAppchainApi] = useState<ApiPromise>();

  const [tokenAsset, setTokenAsset] = useState<TokenAsset>();
  const [collectible, setCollectible] = useState<Collectible>();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [targetAccountNeedDepositStorage, setTargetAccountNeedDepositStorage] =
    useBoolean();
  const [isDepositingStorage, setIsDepositingStorage] = useBoolean();

  const filteredTokens = useMemo(() => {
    if (!tokens?.length) {
      return [];
    }

    if (!bridgeConfig?.whitelist) {
      return tokens;
    }

    return tokens.filter(
      (t) =>
        !Object.keys(bridgeConfig.whitelist).includes(t.contractId) ||
        (Object.keys(bridgeConfig.whitelist).includes(t.contractId) &&
          accountId &&
          Object.values(bridgeConfig.whitelist)
            .flat(Infinity)
            .includes(accountId))
    );
  }, [tokens, bridgeConfig, accountId]);

  useEffect(() => {
    if (isHistoryDrawerOpen) {
      (document.getElementById("root") as any).style =
        "transition: all .3s ease-in-out; transform: translateX(-5%)";
    } else {
      (document.getElementById("root") as any).style =
        "transition: all .15s ease-in-out; transform: translateX(0)";
    }
  }, [isHistoryDrawerOpen]);

  useEffect(() => {
    if (!appchainSettings) {
      return;
    }

    const provider = new WsProvider(appchainSettings.rpc_endpoint);
    const api = new ApiPromise({ provider });

    api.isReady.then((api) => {
      setAppchainApi(api);
    });
  }, [appchainSettings, appchain]);

  useEffect(() => {
    if (!appchainId) {
      return;
    }

    setTokenAsset(undefined);
    setCollectible(undefined);
    setAppchainApi(undefined);
    setAmount("");
    setTimeout(() => {
      amountInputRef.current?.focus();
    }, 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appchainId]);

  useEffect(() => {
    if (!to || !tokenAsset) {
      return;
    }
    if (isNearToAppchain) {
      setTargetAccountNeedDepositStorage.off();
      return;
    }
    async function checkStorage() {
      try {
        const provider = new providers.JsonRpcProvider({
          url: selector.options.network.nodeUrl,
        });
        const res = await provider.query<CodeResult>({
          request_type: "call_function",
          account_id: tokenAsset?.contractId,
          method_name: "storage_balance_bounds",
          args_base64: "",
          finality: "optimistic",
        });
        const bounds = JSON.parse(Buffer.from(res.result).toString());

        const res2 = await provider.query<CodeResult>({
          request_type: "call_function",
          account_id: tokenAsset?.contractId,
          method_name: "storage_balance_of",
          args_base64: btoa(JSON.stringify({ account_id: to })),
          finality: "optimistic",
        });
        const storage = JSON.parse(Buffer.from(res2.result).toString());

        if (
          storage === null ||
          new Decimal(storage.total).lessThan(bounds.min)
        ) {
          setTargetAccountNeedDepositStorage.on();
        } else {
          setTargetAccountNeedDepositStorage.off();
        }
      } catch (error) {}
    }
    checkStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    appchainApi,
    isNearToAppchain,
    selector.options.network.nodeUrl,
    to,
    tokenAsset,
  ]);

  const appchainTxns = useMemo(
    () =>
      Object.values(appchainId ? txns?.[appchainId] || {} : {})
        .filter(
          (t) =>
            t.fromAccount === from ||
            t.toAccount === from ||
            t.fromAccount === accountId ||
            t.toAccount === accountId
        )
        .sort((a, b) => b.timestamp - a.timestamp),
    [appchainId, txns, accountId, from]
  );

  const pendingTxns = useMemo(
    () =>
      appchainTxns.filter((txn) => txn.status === BridgeHistoryStatus.Pending),
    [appchainTxns]
  );

  useEffect(() => {
    pendingTxns
      .filter((t) => t.isEvm && !t.sequenceId)
      .forEach((t) => {
        checkEvmTxSequence(t)
          .then((sequenceId) => {
            console.log("sequenceId", sequenceId);
            if (typeof sequenceId === "number") {
              updateTxn(t.appchainId, {
                ...t,
                sequenceId,
              });
            }
          })
          .catch(console.log);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingTxns]);

  const pendingTxnsChecker = React.useRef<any>();
  const isCheckingTxns = React.useRef(false);
  pendingTxnsChecker.current = async () => {
    if (isCheckingTxns.current) {
      return;
    }

    isCheckingTxns.current = true;

    // eslint-disable-next-line array-callback-return
    const promises = pendingTxns.map((txn) => {
      if (txn.isAppchainSide) {
        const provider = new providers.JsonRpcProvider({
          url: selector.options.network.nodeUrl,
        });

        return provider
          .query<CodeResult>({
            request_type: "call_function",
            account_id: appchain?.appchain_anchor,
            method_name: "get_appchain_message_processing_result_of",
            args_base64: btoa(
              JSON.stringify({
                nonce: txn.sequenceId,
              })
            ),
            finality: "optimistic",
          })
          .then((res) => {
            const result = JSON.parse(Buffer.from(res.result).toString());
            if (result?.["Ok"]) {
              updateTxn(txn.appchainId, {
                ...txn,
                status: BridgeHistoryStatus.Succeed,
              });
            } else if (result?.["Error"]) {
              updateTxn(txn.appchainId, {
                ...txn,
                status: BridgeHistoryStatus.Failed,
                message: result["Error"].message || "Unknown error",
              });
            }
          });
      } else {
        if (!(txn.isEvm && !txn.sequenceId)) {
          return appchainApi?.query.octopusAppchain
            .notificationHistory(txn.sequenceId)
            .then((res) => {
              console.log(txn, res);
              const jsonRes: string | null = res?.toJSON() as any;
              if (jsonRes === "Success") {
                updateTxn(txn.appchainId, {
                  ...txn,
                  status: BridgeHistoryStatus.Succeed,
                });
              } else if (jsonRes !== null) {
                updateTxn(txn.appchainId, {
                  ...txn,
                  status: BridgeHistoryStatus.Failed,
                  message: jsonRes,
                });
              }
            });
        }
      }
    });
    try {
      await Promise.all(promises);
    } catch (err) {
      console.log(err);
    }

    isCheckingTxns.current = false;
  };

  useInterval(() => {
    pendingTxnsChecker.current();
  }, 5 * 1000);

  const amountInputRef = React.useRef<any>();

  const onToggleDirection = () => {
    if (isNearToAppchain) {
      navigate(`/bridge/${appchainId}/near`);
    } else {
      navigate(`/bridge/near/${appchainId}`);
    }
  };

  const burnToken = async () => {
    const wallet = await selector.wallet();
    await nearBurn({
      token: tokenAsset!,
      wallet,
      anchorId: appchain?.appchain_anchor!,
      isEvm,
      targetAccount: to,
      amount,
    });
  };

  const burnCollectible = async () => {
    const wallet = await selector.wallet();
    const anchorId = `${appchainId}.${registry?.contractId}`;
    await nearBurnNft({
      wallet,
      anchorId,
      receiverId: `${collectible?.class}.${anchorId}`,
      tokenId: collectible?.id!,
      targetAccount: to,
    });
  };

  const redeemToken = async () => {
    const targetAccountInHex = stringToHex(to);
    if (isEvm) {
      await evmBurn({
        asset: tokenAsset,
        amount,
        receiver_id: targetAccountInHex,
        updateTxn,
        appchainId,
        fromAccount: from,
      });
    } else {
      await substrateBurn({
        api: appchainApi!,
        targetAccount: to,
        amount,
        asset: tokenAsset,
        fromAccount: from!,
        appchainId: appchainId!,
        bridgeConfig,
        updateTxn,
      });
    }
  };

  const redeemCollectible = async () => {
    const targetAccountInHex = stringToHex(to);

    const tx: any = appchainApi?.tx.octopusAppchain.lockNft(
      collectible?.class,
      collectible?.id,
      targetAccountInHex
    );

    await tx.signAndSend(from, ({ events = [] }: any) => {
      events.forEach(({ event: { data, method, section } }: any) => {
        if (section === "octopusAppchain" && method === "NftLocked") {
          setIsTransferring.off();
          setCollectible(undefined);
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      });
    });
  };

  const onClearHistory = () => {
    clearTxnsOfAppchain(appchainId || "");
  };

  const onSubmit = async () => {
    try {
      setIsTransferring.on();
      const _isValidTargetAddress = await isValidAddress({
        address: to,
        isNearToAppchain,
        isEvm,
      });
      if (!_isValidTargetAddress) {
        throw new Error("Invalid target account");
      }
      // check chain if it's BarnacleEvm
      if (isEvm && !isNearToAppchain) {
        const chainId = window.ethereum?.networkVersion;

        if (chainId !== Number(appchain?.evm_chain_id)) {
          const provider = (await detectEthereumProvider({
            mustBeMetaMask: true,
          })) as any;
          if (!provider) {
            throw new Error("Please install MetaMask first");
          }

          await provider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x" + Number(appchain.evm_chain_id).toString(16), // Moonbase Alpha's chainId is 1287, which is 0x507 in hex
                chainName: appchain?.appchain_id,
                nativeCurrency: {
                  name: appchain.appchain_metadata.fungible_token_metadata.name,
                  symbol:
                    appchain.appchain_metadata.fungible_token_metadata.symbol,
                  decimals:
                    appchain.appchain_metadata.fungible_token_metadata.decimals,
                },
                rpcUrls: [
                  (appchainSettings?.rpc_endpoint || "").replace(
                    "wss:",
                    "https:"
                  ),
                ],
                blockExplorerUrls: ["https://moonbase.moonscan.io/"],
              },
            ],
          });
        }
      } else if (!isNearToAppchain && !isEvm) {
        await web3Enable("Octopus Network");
        const injected = await web3FromSource(
          currentAccount?.meta.source || ""
        );
        appchainApi?.setSigner(injected.signer);
      }

      // check amount
      console.log("tokenAsset", tokenAsset, collectible);

      if (collectible) {
        if (isNearToAppchain) {
          await burnCollectible();
        } else {
          await redeemCollectible();
        }
      } else if (tokenAsset) {
        const amountInU64 = DecimalUtil.toU64(
          DecimalUtil.fromString(amount),
          Array.isArray(tokenAsset?.metadata.decimals)
            ? tokenAsset?.metadata.decimals[0]
            : tokenAsset?.metadata.decimals
        );
        const _isValidAmount = await isValidAmount({
          address: from,
          isNearToAppchain,
          amount: amountInU64,
        });

        if (!_isValidAmount) {
          throw new Error("Invalid amount");
        }

        if (isNearToAppchain) {
          await burnToken();
        } else {
          await redeemToken();
        }
      }

      setIsTransferring.off();
      Toast.success("Bridging");
    } catch (error) {
      setIsTransferring.off();
      Toast.error(error);
    }
  };

  const onDepositStorage = async () => {
    if (isNearToAppchain) {
      return;
    }

    try {
      setIsDepositingStorage.on();
      const wallet = await selector.wallet();

      const provider = new providers.JsonRpcProvider({
        url: selector.options.network.nodeUrl,
      });
      const res = await provider.query<CodeResult>({
        request_type: "call_function",
        account_id: tokenAsset?.contractId,
        method_name: "storage_balance_bounds",
        args_base64: "",
        finality: "optimistic",
      });
      const bounds = JSON.parse(Buffer.from(res.result).toString());
      await wallet.signAndSendTransaction({
        signerId: accountId,
        receiverId: tokenAsset?.contractId,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "storage_deposit",
              args: { account_id: to },
              gas: SIMPLE_CALL_GAS,
              deposit: bounds.min,
            },
          },
        ],
      });
      setIsDepositingStorage.off();
    } catch (err) {
      setIsDepositingStorage.off();
      Toast.error(err);
    }
  };

  return (
    <>
      <Box bg={bg} p={6} borderRadius="lg" minH="520px">
        <Flex justifyContent="space-between" alignItems="center" minH="32px">
          <Heading fontSize="xl">Bridge</Heading>
          {appchainTxns.length ? (
            <Button
              colorScheme="octo-blue"
              variant="ghost"
              size="sm"
              onClick={setIsHistoryDrawerOpen.on}
            >
              <HStack>
                {pendingTxns.length ? (
                  <CircularProgress
                    color="octo-blue.400"
                    isIndeterminate
                    size="18px"
                  >
                    <CircularProgressLabel fontSize="10px">
                      {pendingTxns.length}
                    </CircularProgressLabel>
                  </CircularProgress>
                ) : null}
                <Text>History</Text>
              </HStack>
            </Button>
          ) : networkConfig &&
            !appchainId &&
            networkConfig?.near.networkId !== "mainnet" ? (
            <RouterLink to="/bridge/txs">
              <Button variant="link" color="#2468f2" size="sm">
                Recent Transactions
                <Icon as={ChevronRightIcon} ml={1} />
              </Button>
            </RouterLink>
          ) : null}
        </Flex>
        {!appchainId ? (
          <Empty message="Please select an appchain" minH="420px" />
        ) : !appchain ? (
          <Center minH="320px">
            <Spinner
              size="md"
              thickness="4px"
              speed="1s"
              color="octo-blue.500"
            />
          </Center>
        ) : (
          <Box mt={4}>
            <AddressInpput
              label="From"
              chain={isNearToAppchain ? "NEAR" : appchainId}
              appchain={appchain}
              onChange={(from) => setFrom(from || "")}
            />
            <Flex justifyContent="center">
              <IconButton
                aria-label="switch"
                isRound
                size="xs"
                borderWidth={3}
                borderColor={bg}
                transform="scale(1.4)"
                onClick={onToggleDirection}
              >
                <Icon as={MdSwapVert} boxSize={4} />
              </IconButton>
            </Flex>
            <AddressInpput
              label="Target"
              chain={!isNearToAppchain ? "NEAR" : appchainId}
              appchain={appchain}
              onChange={(to) => setTo(to || "")}
              isDepositingStorage={isDepositingStorage}
              onDepositStorage={onDepositStorage}
              targetAccountNeedDepositStorage={targetAccountNeedDepositStorage}
            />
            <TokenInput
              chain={isNearToAppchain ? "NEAR" : appchainId}
              appchainApi={appchainApi}
              from={from}
              appchainId={appchainId}
              onChangeAmount={(amount) => setAmount(amount)}
              onChangeTokenAsset={(ta, isCollectible) => {
                if (isCollectible) {
                  setCollectible(ta);
                  setTokenAsset(undefined);
                } else {
                  setTokenAsset(ta);
                  setCollectible(undefined);
                }
              }}
            />
            <Flex direction="column" mt={6} gap={4}>
              {appchain?.anchor_status?.asset_transfer_is_paused && (
                <Alert status="warning">
                  <AlertIcon />
                  <AlertTitle>{appchain.appchain_id}</AlertTitle> is frozen.
                </Alert>
              )}
              <Button
                colorScheme="octo-blue"
                size="lg"
                width="100%"
                isDisabled={
                  appchain?.anchor_status?.asset_transfer_is_paused ||
                  !from ||
                  !to ||
                  (!collectible && !amount) ||
                  isTransferring ||
                  targetAccountNeedDepositStorage ||
                  isDepositingStorage
                }
                isLoading={isTransferring}
                spinner={
                  <PulseLoader color="rgba(255, 255, 255, .9)" size={12} />
                }
                onClick={onSubmit}
              >
                Transfer
              </Button>
            </Flex>
          </Box>
        )}
      </Box>

      <Drawer
        placement="right"
        isOpen={isHistoryDrawerOpen}
        onClose={setIsHistoryDrawerOpen.off}
        size="lg"
      >
        <DrawerOverlay />
        <DrawerContent>
          <History
            appchain={appchain}
            histories={appchainTxns}
            onDrawerClose={setIsHistoryDrawerOpen.off}
            onClearHistory={onClearHistory}
            tokenAssets={filteredTokens}
          />
        </DrawerContent>
      </Drawer>
    </>
  );
};
