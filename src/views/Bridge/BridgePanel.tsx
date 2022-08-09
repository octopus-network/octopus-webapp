import React, { useMemo, useState, useEffect, useCallback } from "react"
import useSWR from "swr"
import { ApiPromise, WsProvider } from "@polkadot/api"
import { PulseLoader } from "react-spinners"
import { providers } from "near-api-js"
import web3 from "web3"

import {
  Box,
  Heading,
  Flex,
  VStack,
  useColorModeValue,
  Center,
  Skeleton,
  InputRightElement,
  Input,
  Image,
  HStack,
  Text,
  InputGroup,
  Icon,
  IconButton,
  Avatar,
  Spinner,
  CircularProgress,
  CircularProgressLabel,
  Button,
  useBoolean,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  useInterval,
} from "@chakra-ui/react"

import {
  AppchainInfoWithAnchorStatus,
  TokenAsset,
  AppchainSettings,
  BridgeHistoryStatus,
  BridgeConfig,
  Collectible,
} from "types"

import { ChevronRightIcon } from "@chakra-ui/icons"
import { decodeAddress, isAddress } from "@polkadot/util-crypto"
import { u8aToHex, stringToHex, isHex } from "@polkadot/util"
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types"

import { web3FromSource, web3Enable } from "@polkadot/extension-dapp"

import { Empty } from "components"
import nearLogo from "assets/near.svg"
import { ChevronDownIcon, WarningIcon } from "@chakra-ui/icons"
import { MdSwapVert } from "react-icons/md"
import { AiFillCloseCircle } from "react-icons/ai"
import { SelectWeb3AccountModal } from "./SelectWeb3AccountModal"
import { SelectTokenModal } from "./SelectTokenModal"
import { History } from "./History"
import { AmountInput } from "components"
import {
  useParams,
  useNavigate,
  useLocation,
  Link as RouterLink,
} from "react-router-dom"
import Decimal from "decimal.js"
import { ZERO_DECIMAL, DecimalUtil } from "utils"
import { useTxnsStore } from "stores"
import { useDebounce } from "use-debounce"

import {
  COMPLEX_CALL_GAS,
  FAILED_TO_REDIRECT_MESSAGE,
  SIMPLE_CALL_GAS,
} from "primitives"
import useAccounts from "hooks/useAccounts"
import { useWalletSelector } from "components/WalletSelectorContextProvider"
import { Toast } from "components/common/toast"
import { CodeResult } from "near-api-js/lib/providers/provider"
import { evmBurn, nearBurn, nearBurnNft, substrateBurn } from "utils/bridge"
import AddressInpput from "components/Bridge/AddressInput"
import TokenInpput from "components/Bridge/TokenInput"

export const BridgePanel: React.FC = () => {
  const bg = useColorModeValue("white", "#15172c")
  const { appchainId } = useParams()
  const navigate = useNavigate()

  const [isLoadingBalance, setIsLoadingBalance] = useBoolean()
  const [isTransferring, setIsTransferring] = useBoolean()
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useBoolean()
  const [isDepositingStorage, setIsDepositingStorage] = useBoolean()

  const [lastTokenContractId, setLastTokenContractId] = useState("")

  const { accountId, registry, networkConfig, selector } = useWalletSelector()
  const { txns, updateTxn, clearTxnsOfAppchain } = useTxnsStore()
  const { data: appchain } = useSWR<AppchainInfoWithAnchorStatus>(
    appchainId ? `appchain/${appchainId}` : null,
    { refreshInterval: 10 * 1000 }
  )
  const { data: appchainSettings } = useSWR<AppchainSettings>(
    appchainId ? `appchain-settings/${appchainId}` : null
  )

  const { data: tokens } = useSWR<TokenAsset[]>(
    appchainId ? `tokens/${appchainId}` : null
  )
  const { data: bridgeConfig } = useSWR<BridgeConfig>(
    appchainId ? `bridge-config/${appchainId}` : null
  )

  const isEvm = appchain?.appchain_metadata.template_type === "BarnacleEvm"

  const { pathname } = useLocation()
  const isReverse = useMemo(
    () => !appchainId || new RegExp(`^/bridge/near/`).test(pathname),
    [pathname]
  )

  const { accounts, currentAccount, setCurrentAccount } = useAccounts(
    isEvm,
    isEvm
  )

  const [targetAccount, setTargetAccount] = useState("")
  const [appchainApi, setAppchainApi] = useState<ApiPromise>()

  const [tokenAsset, setTokenAsset] = useState<TokenAsset>()
  const [collectible, setCollectible] = useState<Collectible>()
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [amount, setAmount] = useState("")

  const [isInvalidTargetAccount, setIsInvalidTargetAccount] = useBoolean()
  const [targetAccountNeedDepositStorage, setTargetAccountNeedDepositStorage] =
    useBoolean()

  const [balance, setBalance] = useState<Decimal>()

  const [debouncedTargetAccount] = useDebounce(targetAccount, 600)

  const filteredTokens = useMemo(() => {
    if (!tokens?.length) {
      return []
    }

    if (!bridgeConfig?.whitelist) {
      return tokens
    }

    return tokens.filter(
      (t) =>
        !Object.keys(bridgeConfig.whitelist).includes(t.contractId) ||
        (Object.keys(bridgeConfig.whitelist).includes(t.contractId) &&
          accountId &&
          Object.values(bridgeConfig.whitelist)
            .flat(Infinity)
            .includes(accountId))
    )
  }, [tokens, bridgeConfig, accountId])

  useEffect(() => {
    if (isHistoryDrawerOpen) {
      ;(document.getElementById("root") as any).style =
        "transition: all .3s ease-in-out; transform: translateX(-5%)"
    } else {
      ;(document.getElementById("root") as any).style =
        "transition: all .15s ease-in-out; transform: translateX(0)"
    }
  }, [isHistoryDrawerOpen])

  useEffect(() => {
    if (!appchainSettings) {
      return
    }

    const provider = new WsProvider(appchainSettings.rpc_endpoint)
    const api = new ApiPromise({ provider })

    api.isReady.then((api) => {
      setAppchainApi(api)
    })
  }, [appchainSettings, appchain])

  useEffect(() => {
    if (!appchainId) {
      return
    }

    setLastTokenContractId(
      window.localStorage.getItem("OCTOPUS_BRIDGE_TOKEN_CONTRACT_ID") || ""
    )

    setTokenAsset(undefined)
    setCollectible(undefined)
    setAppchainApi(undefined)
    setIsLoadingBalance.on()
    setAmount("")
    setTimeout(() => {
      amountInputRef.current?.focus()
    }, 300)
  }, [appchainId])

  const fromAccount = useMemo(() => {
    if (isReverse) {
      return accountId
      // } else if (appchainId?.includes("evm")) {
      //   return ethAccounts[0]
    }

    return currentAccount?.address
  }, [isReverse, accountId, currentAccount])
  const initialTargetAccount = useMemo(
    () => (!isReverse ? accountId : currentAccount?.address),
    [isReverse, accountId, currentAccount]
  )

  const appchainTxns = useMemo(
    () =>
      Object.values(appchainId ? txns?.[appchainId] || {} : {})
        .filter(
          (t) =>
            t.fromAccount === fromAccount ||
            t.toAccount === fromAccount ||
            t.fromAccount === accountId ||
            t.toAccount === accountId
        )
        .sort((a, b) => b.timestamp - a.timestamp),
    [appchainId, txns, accountId, fromAccount]
  )

  const pendingTxns = useMemo(
    () =>
      appchainTxns.filter((txn) => txn.status === BridgeHistoryStatus.Pending),
    [appchainTxns]
  )

  const checkNearAccount = useCallback(async () => {
    if (!debouncedTargetAccount || !tokenAsset) {
      return
    }

    try {
      setIsInvalidTargetAccount.off()
      const provider = new providers.JsonRpcProvider({
        url: selector.options.network.nodeUrl,
      })
      const res = await provider.query<CodeResult>({
        request_type: "call_function",
        account_id: tokenAsset.contractId,
        method_name: "storage_balance_of",
        args_base64: btoa(
          JSON.stringify({ account_id: debouncedTargetAccount })
        ),
        finality: "optimistic",
      })
      const storage = JSON.parse(Buffer.from(res.result).toString())

      if (storage === null) {
        setTargetAccountNeedDepositStorage.on()
      } else {
        setTargetAccountNeedDepositStorage.off()
      }
    } catch (error) {
      console.log("error", error)

      setIsInvalidTargetAccount.on()
      Toast.error(error)
    }
  }, [debouncedTargetAccount, tokenAsset, selector.options.network.nodeUrl])

  const checkAppchainAccount = useCallback(() => {
    if (!appchainApi || !debouncedTargetAccount) {
      return
    }

    if (
      (!isEvm &&
        (isHex(debouncedTargetAccount) ||
          !isAddress(debouncedTargetAccount))) ||
      (isEvm && web3.utils.isAddress(debouncedTargetAccount))
    ) {
      setIsInvalidTargetAccount.off()
      return
    }
    if (tokenAsset?.assetId === undefined) {
      return
    }
    appchainApi?.query.system.account(debouncedTargetAccount).then((res) => {
      if (res.providers.toNumber() === 0) {
        setTargetAccountNeedDepositStorage.on()
      }
    })
  }, [appchainApi, debouncedTargetAccount, isEvm, tokenAsset?.assetId])

  const checkTargetAccount = React.useRef<any>()
  checkTargetAccount.current = () => {
    setIsInvalidTargetAccount.off()
    setTargetAccountNeedDepositStorage.off()
    if (isReverse) {
      checkAppchainAccount()
    } else {
      checkNearAccount()
    }
  }

  useEffect(() => {
    checkTargetAccount.current()
  }, [debouncedTargetAccount, tokenAsset])

  const pendingTxnsChecker = React.useRef<any>()
  const isCheckingTxns = React.useRef(false)
  pendingTxnsChecker.current = async () => {
    if (isCheckingTxns.current) {
      return
    }

    isCheckingTxns.current = true

    const promises = pendingTxns.map((txn) => {
      if (txn.isAppchainSide) {
        const provider = new providers.JsonRpcProvider({
          url: selector.options.network.nodeUrl,
        })

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
            const result = JSON.parse(Buffer.from(res.result).toString())
            if (result?.["Ok"]) {
              updateTxn(txn.appchainId, {
                ...txn,
                status: BridgeHistoryStatus.Succeed,
              })
            } else if (result?.["Error"]) {
              updateTxn(txn.appchainId, {
                ...txn,
                status: BridgeHistoryStatus.Failed,
                message: result["Error"].message || "Unknown error",
              })
            }
          })
      } else {
        return appchainApi?.query.octopusAppchain
          .notificationHistory(txn.sequenceId)
          .then((res) => {
            console.log(txn, res)
            const jsonRes: string | null = res?.toJSON() as any
            if (jsonRes === "Success") {
              updateTxn(txn.appchainId, {
                ...txn,
                status: BridgeHistoryStatus.Succeed,
              })
            } else if (jsonRes !== null) {
              updateTxn(txn.appchainId, {
                ...txn,
                status: BridgeHistoryStatus.Failed,
                message: jsonRes,
              })
            }
          })
      }
    })
    try {
      await Promise.all(promises)
    } catch (err) {
      console.log(err)
    }

    isCheckingTxns.current = false
  }

  useInterval(() => {
    pendingTxnsChecker.current()
  }, 5 * 1000)

  // fetch balance via near contract
  useEffect(() => {
    if (!isReverse || !tokenAsset || !fromAccount || !accountId) {
      return
    }

    setIsLoadingBalance.on()

    const provider = new providers.JsonRpcProvider({
      url: selector.options.network.nodeUrl,
    })
    provider
      .query<CodeResult>({
        request_type: "call_function",
        account_id: tokenAsset.contractId,
        method_name: "ft_balance_of",
        args_base64: btoa(JSON.stringify({ account_id: accountId })),
        finality: "optimistic",
      })
      .then((res) => {
        const bal = JSON.parse(Buffer.from(res.result).toString())
        setBalance(
          DecimalUtil.fromString(
            bal,
            Array.isArray(tokenAsset?.metadata.decimals)
              ? tokenAsset?.metadata.decimals[0]
              : tokenAsset?.metadata.decimals
          )
        )
        setIsLoadingBalance.off()
      })
  }, [isReverse, fromAccount, tokenAsset, accountId])

  const checkBalanceViaRPC = React.useRef<any>()
  checkBalanceViaRPC.current = async () => {
    if (!tokenAsset || !bridgeConfig) {
      return
    }

    let balance = ZERO_DECIMAL
    if (tokenAsset.assetId === undefined) {
      const res = await appchainApi?.query.system.account(fromAccount)
      const resJSON: any = res?.toJSON()
      balance = DecimalUtil.fromString(
        resJSON?.data?.free,
        Array.isArray(tokenAsset?.metadata.decimals)
          ? tokenAsset?.metadata.decimals[1]
          : tokenAsset?.metadata.decimals
      )
    } else {
      const query =
        appchainApi?.query[bridgeConfig.tokenPallet.section]?.[
          bridgeConfig.tokenPallet.method
        ]

      if (!query) {
        return
      }

      const res = await (bridgeConfig.tokenPallet.paramsType === "Tuple"
        ? query([tokenAsset.assetId, fromAccount])
        : query(tokenAsset.assetId, fromAccount))

      const resJSON: any = res?.toJSON()

      balance = DecimalUtil.fromString(
        resJSON?.[bridgeConfig.tokenPallet.valueKey],
        Array.isArray(tokenAsset?.metadata.decimals)
          ? tokenAsset?.metadata.decimals[1]
          : tokenAsset?.metadata.decimals
      )
    }

    setBalance(balance)
    setIsLoadingBalance.off()
  }

  // fetch balance from appchain rpc
  useEffect(() => {
    if (
      isReverse ||
      !tokenAsset ||
      !accountId ||
      !appchainApi ||
      !fromAccount ||
      !bridgeConfig
    ) {
      return
    }

    checkBalanceViaRPC?.current()
  }, [isReverse, appchainApi, accountId, fromAccount, tokenAsset, bridgeConfig])

  useEffect(() => {
    setTargetAccount(initialTargetAccount || "")
  }, [initialTargetAccount])

  const amountInputRef = React.useRef<any>()

  const onToggleDirection = () => {
    if (isReverse) {
      navigate(`/bridge/${appchainId}/near`)
    } else {
      navigate(`/bridge/near/${appchainId}`)
    }
  }

  const burnToken = async () => {
    setIsTransferring.on()

    try {
      const wallet = await selector.wallet()
      await nearBurn({
        token: tokenAsset!,
        wallet,
        anchorId: appchain?.appchain_anchor!,
        isEvm,
        targetAccount,
        amount,
      })
      setIsTransferring.off()
      Toast.success("Transferred")
    } catch (err: any) {
      setIsTransferring.off()
      Toast.error(err)
    }
  }

  const burnCollectible = async () => {
    try {
      setIsTransferring.on()
      const wallet = await selector.wallet()
      const anchorId = `${appchainId}.${registry?.contractId}`
      await nearBurnNft({
        wallet,
        anchorId,
        receiverId: `${collectible?.class}.${anchorId}`,
        tokenId: collectible?.id!,
        targetAccount,
      })
      setIsTransferring.off()
      Toast.success("Transferred")
    } catch (err: any) {
      setIsTransferring.off()
      Toast.error(err)
    }
  }

  const redeemToken = async () => {
    setIsTransferring.on()

    try {
      const targetAccountInHex = stringToHex(targetAccount)
      const amountInU64 = DecimalUtil.toU64(
        DecimalUtil.fromString(amount),
        Array.isArray(tokenAsset?.metadata.decimals)
          ? tokenAsset?.metadata.decimals[0]
          : tokenAsset?.metadata.decimals
      )
      if (isEvm) {
        await evmBurn({
          asset_id: tokenAsset?.assetId,
          amount: amountInU64.toString(),
          receiver_id: targetAccountInHex,
        })
      } else {
        substrateBurn({
          api: appchainApi!,
          targetAccount,
          amount: amountInU64.toString(),
          asset: tokenAsset,
          fromAccount: fromAccount!,
          appchainId: appchainId!,
          updateTxn,
        })
      }
      setIsTransferring.off()
    } catch (error) {
      Toast.error(error)
      setIsTransferring.off()
    }
  }

  const redeemCollectible = async () => {
    setIsTransferring.on()

    const targetAccountInHex = stringToHex(targetAccount)

    const tx: any = appchainApi?.tx.octopusAppchain.lockNft(
      collectible?.class,
      collectible?.id,
      targetAccountInHex
    )

    await tx
      .signAndSend(fromAccount, ({ events = [] }: any) => {
        events.forEach(({ event: { data, method, section } }: any) => {
          if (section === "octopusAppchain" && method === "NftLocked") {
            setIsTransferring.off()
            setCollectible(undefined)
          }
        })
      })
      .catch((err: any) => {
        Toast.error(err)
        setIsTransferring.off()
      })
  }

  const onBurn = () => {
    if (!collectible) {
      burnToken()
    } else {
      burnCollectible()
    }
  }

  const onRedeem = async () => {
    console.log("onRedeem", currentAccount?.meta.source)

    // eth
    if (isEvm) {
    } else {
      await web3Enable("Octopus Network")
      const injected = await web3FromSource(currentAccount?.meta.source || "")
      appchainApi?.setSigner(injected.signer)
    }

    if (!collectible) {
      redeemToken()
    } else {
      redeemCollectible()
    }
  }

  const onClearHistory = () => {
    clearTxnsOfAppchain(appchainId || "")
  }

  const onDepositStorage = async () => {
    if (isReverse) {
      if (!appchainApi || !currentAccount) {
        return
      }
      await web3Enable("Octopus Network")
      const injected = await web3FromSource(currentAccount.meta.source || "")
      appchainApi.setSigner(injected.signer)

      setIsDepositingStorage.on()

      const res = await appchainApi?.query.system.account(fromAccount)
      const resJSON: any = res?.toJSON()
      const balance = DecimalUtil.fromString(
        resJSON?.data?.free,
        Array.isArray(tokenAsset?.metadata.decimals)
          ? tokenAsset?.metadata.decimals[1]
          : tokenAsset?.metadata.decimals
      )
      const toDepositAmount = DecimalUtil.toU64(
        new Decimal(0.01),
        appchain?.appchain_metadata?.fungible_token_metadata?.decimals
      ).toString()

      if (!balance.gte(toDepositAmount)) {
        return Toast.error("Balance not enough")
      }
      const tx = appchainApi.tx.balances.transfer(
        targetAccount,
        toDepositAmount
      )

      tx.signAndSend(currentAccount.address, (res) => {
        if (res.isInBlock) {
          setIsDepositingStorage.off()
          setTargetAccountNeedDepositStorage.off()
        }
      })

      return
    }

    console.log("accountId", targetAccount, accountId)

    try {
      setIsDepositingStorage.on()
      const wallet = await selector.wallet()

      await wallet.signAndSendTransaction({
        signerId: accountId,
        receiverId: tokenAsset?.contractId,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "storage_deposit",
              args: { account_id: targetAccount },
              gas: SIMPLE_CALL_GAS,
              deposit: "1250000000000000000000",
            },
          },
        ],
      })
      setIsDepositingStorage.off()
    } catch (err) {
      setIsDepositingStorage.off()
      if (err instanceof Error) {
        if (err.message === FAILED_TO_REDIRECT_MESSAGE) {
          return
        }
        Toast.error(err)
      }
    }
  }

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
              chain={isReverse ? "NEAR" : appchainId}
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
              chain={!isReverse ? "NEAR" : appchainId}
              appchain={appchain}
              onChange={(to) => setTo(to || "")}
            />
            <TokenInpput
              chain={!isReverse ? "NEAR" : appchainId}
              appchain={appchain}
              from={from}
              appchainId={appchainId}
              onChangeAmount={(amount) => setAmount(amount)}
              onChangeTokenAsset={(ta) => setTokenAsset(ta)}
            />
            <Box mt={8}>
              <Button
                colorScheme="octo-blue"
                size="lg"
                width="100%"
                isDisabled={
                  !fromAccount ||
                  isLoadingBalance ||
                  !targetAccount ||
                  (!collectible && (!amount || balance?.lt(amount))) ||
                  isTransferring ||
                  isInvalidTargetAccount ||
                  targetAccountNeedDepositStorage
                }
                isLoading={isTransferring}
                spinner={
                  <PulseLoader color="rgba(255, 255, 255, .9)" size={12} />
                }
                onClick={isReverse ? onBurn : onRedeem}
              >
                {!fromAccount
                  ? "Connect Wallet"
                  : !targetAccount
                  ? "Input Target Account"
                  : isInvalidTargetAccount || targetAccountNeedDepositStorage
                  ? "Invalid Target Account"
                  : !collectible
                  ? !amount
                    ? "Input Amount"
                    : balance?.lt(amount)
                    ? "Insufficient Balance"
                    : "Transfer"
                  : "Transfer"}
              </Button>
            </Box>
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
  )
}
