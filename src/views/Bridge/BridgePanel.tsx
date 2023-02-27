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
  Text,
  Icon,
  IconButton,
  Spinner,
  Button,
  useBoolean,
  Drawer,
  DrawerOverlay,
  DrawerContent,
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

import useAccounts from "hooks/useAccounts";
import { useWalletSelector } from "components/WalletSelectorContextProvider";
import { Toast } from "components/common/toast";
import { CodeResult } from "near-api-js/lib/providers/provider";
import {
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

  const { accountId, networkConfig, selector } = useWalletSelector();
  const { data: appchain } = useSWR<AppchainInfoWithAnchorStatus>(
    appchainId ? `appchain/${appchainId}` : null
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
  const [crosschainFee, setCrosschainFee] = useState({
    fungible: 0,
    nonfungible: 0,
  });

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
    if (!appchainSettings?.rpc_endpoint) {
      return;
    }

    const provider = new WsProvider(appchainSettings.rpc_endpoint);
    const api = new ApiPromise({ provider });

    api.isReady.then((api) => {
      setAppchainApi(api);
    });
  }, [appchainSettings, appchain]);

  useEffect(() => {
    if (appchainApi && bridgeConfig?.crosschainFee) {
      Promise.all([
        appchainApi.query.octopusBridge
          ?.crosschainTransferFee("fungible")
          .then((res) => {
            return res?.toJSON() as any;
          }),
        appchainApi.query.octopusBridge
          ?.crosschainTransferFee("nonfungible")
          .then((res) => {
            return res?.toJSON() as any;
          }),
      ])
        .then((results) => {
          setCrosschainFee({
            fungible: results[0] || 0,
            nonfungible: results[1] || 0,
          });
        })
        .catch((e) => {
          console.log("e", e);
        });
    } else {
      setCrosschainFee({
        fungible: 0,
        nonfungible: 0,
      });
    }
  }, [appchainApi, bridgeConfig]);

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
        if (tokenAsset?.contractId === "usn") {
          setTargetAccountNeedDepositStorage.off();
          return;
        }
        const provider = new providers.JsonRpcProvider({
          url: selector.options.network.nodeUrl,
        });
        const res = await provider.query<CodeResult>({
          request_type: "call_function",
          account_id: tokenAsset?.contractId,
          method_name: "storage_balance_bounds",
          args_base64: "",
          finality: "final",
        });
        const bounds = JSON.parse(Buffer.from(res.result).toString());

        const res2 = await provider.query<CodeResult>({
          request_type: "call_function",
          account_id: tokenAsset?.contractId,
          method_name: "storage_balance_of",
          args_base64: btoa(JSON.stringify({ account_id: to })),
          finality: "final",
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

  const { data: history } = useSWR(
    `bridge-helper/history?from=${accountId}&appchain=${appchainId}&direction=${
      isNearToAppchain ? "near_to_appchain" : "near_to_appchain"
    }`
  );

  const appchainTxns = useMemo(() => {
    if (!history) {
      return [];
    }
    return history
      ?.filter((h: any) => h.token)
      .map((h: any) => {
        return {
          amount: h.amount,
          appchainId: h.appchainId,
          fromAccount: h.from,
          hash: h.outHash,
          isAppchainSide: !isNearToAppchain,
          sequenceId: 1,
          status: BridgeHistoryStatus.Succeed,
          timestamp: h.timestamp,
          toAccount: h.to,
          tokenContractId: h.token.contract_id,
        };
      });
  }, [history, isNearToAppchain]);

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
    const anchorId = `${appchainId}.${networkConfig?.octopus.registryContractId}`;
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
        bridgeConfig,
      });
    }
  };

  const redeemCollectible = async () => {
    const targetAccountInHex = stringToHex(to);

    let tx: any = null;

    if (bridgeConfig?.crosschainFee) {
      tx = appchainApi?.tx.octopusBridge.lockNonfungible(
        collectible?.class,
        collectible?.id,
        targetAccountInHex
      );
    } else {
      tx = appchainApi?.tx.octopusAppchain.lockNft(
        collectible?.class,
        collectible?.id,
        targetAccountInHex
      );
    }

    await tx.signAndSend(from, ({ events = [] }: any) => {
      events.forEach(({ event: { data, method, section } }: any) => {
        if (section === "system" && method === "ExtrinsicFailed") {
          Toast.error("Extrinsic failed");
          setTimeout(() => {
            window.location.reload();
          }, 1000);
          return;
        }
        if (
          (section === "octopusAppchain" && method === "NftLocked") ||
          (section === "octopusBridge" && method === "NonfungibleLocked")
        ) {
          setIsTransferring.off();
          setCollectible(undefined);
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      });
    });
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
                blockExplorerUrls: null,
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
        finality: "final",
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
      setAmount("");
      setIsDepositingStorage.off();
    } catch (err) {
      setIsDepositingStorage.off();
      Toast.error(err);
    }
  };

  return (
    <>
      <Box bg={bg} p={6} borderRadius="md" minH="520px">
        <Flex justifyContent="space-between" alignItems="center" minH="32px">
          <Heading fontSize="xl">Bridge</Heading>
          {appchainTxns.length ? (
            <Button
              colorScheme="octo-blue"
              variant="ghost"
              size="sm"
              onClick={setIsHistoryDrawerOpen.on}
            >
              <Text>History</Text>
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
              label="To"
              chain={!isNearToAppchain ? "NEAR" : appchainId}
              appchain={appchain}
              onChange={(to) => setTo(to || "")}
              isDepositingStorage={isDepositingStorage}
              onDepositStorage={onDepositStorage}
              targetAccountNeedDepositStorage={targetAccountNeedDepositStorage}
            />
            <TokenInput
              chain={isNearToAppchain ? "NEAR" : appchainId}
              nativeToken={filteredTokens.find((t) => !t.assetId)}
              crosschainFee={crosschainFee}
              appchainApi={appchainApi}
              appchain={appchain}
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
            tokenAssets={filteredTokens}
          />
        </DrawerContent>
      </Drawer>
    </>
  );
};
