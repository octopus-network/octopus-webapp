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

function toHexAddress(ss58Address: string) {
  if (isHex(ss58Address)) {
    return ""
  }
  try {
    const u8a = decodeAddress(ss58Address)
    return u8aToHex(u8a)
  } catch (err) {
    return ""
  }
}

export const BridgePanel: React.FC = () => {
  const bg = useColorModeValue("white", "#15172c")
  const { appchainId } = useParams()
  const navigate = useNavigate()

  const grayBg = useColorModeValue("#f2f4f7", "#1e1f34")
  const [isLogging, setIsLogging] = useBoolean()
  const [isLoadingBalance, setIsLoadingBalance] = useBoolean()
  const [isAmountInputFocused, setIsAmountInputFocused] = useBoolean()
  const [isAccountInputFocused, setIsAccountInputFocused] = useBoolean()
  const [selectAccountModalOpen, setSelectAccountModalOpen] = useBoolean()
  const [selectTokenModalOpen, setSelectTokenModalOpen] = useBoolean()
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

  const { data: collectibleClasses } = useSWR<number[]>(
    appchainId ? `collectible-classes/${appchainId}` : null
  )

  const { data: tokens } = useSWR<TokenAsset[]>(
    appchainId ? `tokens/${appchainId}` : null
  )
  const { data: bridgeConfig } = useSWR<BridgeConfig>(
    appchainId ? `bridge-config/${appchainId}` : null
  )

  const isEvm = appchain?.appchain_metadata.template_type === "BarnacleEvm"

  const { pathname } = useLocation()
  const [amount, setAmount] = useState("")
  const isReverse = useMemo(
    () => !appchainId || new RegExp(`^/bridge/near/`).test(pathname),
    [pathname]
  )

  const fromChainName = useMemo(
    () => (isReverse ? "NEAR" : appchainId),
    [isReverse, appchainId]
  )
  const targetChainName = useMemo(
    () => (!isReverse ? "NEAR" : appchainId),
    [isReverse, appchainId]
  )

  const { accounts, currentAccount, setCurrentAccount } = useAccounts(
    isEvm,
    isEvm
  )

  const [targetAccount, setTargetAccount] = useState("")
  const [tokenAsset, setTokenAsset] = useState<TokenAsset>()
  const [collectible, setCollectible] = useState<Collectible>()
  const [appchainApi, setAppchainApi] = useState<ApiPromise>()

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

  useEffect(() => {
    if (filteredTokens.length) {
      setTokenAsset(
        lastTokenContractId
          ? filteredTokens.find((t) => t.contractId === lastTokenContractId) ||
              filteredTokens[0]
          : filteredTokens[0]
      )
    }
  }, [filteredTokens, lastTokenContractId])

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
    if (!networkConfig || !debouncedTargetAccount || !tokenAsset) {
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
      console.log("storage", storage)

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
  }, [
    networkConfig,
    debouncedTargetAccount,
    tokenAsset,
    selector.options.network.nodeUrl,
  ])

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
      setIsInvalidTargetAccount.on()
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
  }, [debouncedTargetAccount, appchainApi, tokenAsset])

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
    if (!fromAccount) {
      setBalance(ZERO_DECIMAL)
      if (isLoadingBalance) {
        setIsLoadingBalance.off()
      }
    }
  }, [fromAccount, isLoadingBalance])

  useEffect(() => {
    setTargetAccount(initialTargetAccount || "")
  }, [initialTargetAccount])

  const targetAccountInputRef = React.useRef<any>()
  const amountInputRef = React.useRef<any>()

  const onToggleDirection = () => {
    if (isReverse) {
      navigate(`/bridge/${appchainId}/near`)
    } else {
      navigate(`/bridge/near/${appchainId}`)
    }
    setTimeout(() => {
      amountInputRef.current?.focus()
    }, 300)
  }

  const onClearTargetAccount = () => {
    setTargetAccount("")

    if (targetAccountInputRef.current) {
      targetAccountInputRef.current.value = ""
      targetAccountInputRef.current.focus()
    }
  }

  const onLogin = async (e: any) => {
    setIsLogging.on()
    const wallet = await selector.wallet()
    wallet.signIn({
      contractId: networkConfig?.octopus?.registryContractId!,
      methods: [],
    } as any)
  }

  const onLogout = async () => {
    const wallet = await selector.wallet()
    wallet.signOut()
    window.location.replace(window.location.origin + window.location.pathname)
  }

  const onSelectAccount = (account: InjectedAccountWithMeta) => {
    setCurrentAccount(account)
    setSelectAccountModalOpen.off()
  }

  const onSelectToken = (
    token: TokenAsset | Collectible,
    isCollectible = false
  ) => {
    if (isCollectible) {
      setCollectible(token as Collectible)
    } else {
      setCollectible(undefined)
      setTokenAsset(token as TokenAsset)
      setTimeout(() => {
        amountInputRef.current?.focus()
      }, 300)
      window.localStorage.setItem(
        "OCTOPUS_BRIDGE_TOKEN_CONTRACT_ID",
        (token as TokenAsset).contractId
      )
    }

    setAmount("")
    setSelectTokenModalOpen.off()
  }

  const onSetMax = () => {
    if (!isReverse && tokenAsset?.assetId === undefined) {
      setAmount(
        balance?.sub(0.1).gt(ZERO_DECIMAL) ? balance?.sub(0.1).toString() : ""
      )
    } else {
      setAmount(balance?.toString() || "")
    }
  }

  const burnToken = async () => {
    setIsTransferring.on()

    const amountInU64 = DecimalUtil.toU64(
      DecimalUtil.fromString(amount),
      Array.isArray(tokenAsset?.metadata.decimals)
        ? tokenAsset?.metadata.decimals[0]
        : tokenAsset?.metadata.decimals
    )

    try {
      let targetAccountInHex = toHexAddress(targetAccount || "")

      if (!targetAccountInHex) {
        throw new Error("Invalid target account")
      }

      const wallet = await selector.wallet()

      if (tokenAsset?.assetId === undefined) {
        await wallet.signAndSendTransaction({
          signerId: accountId,
          receiverId: appchain?.appchain_anchor,
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: "burn_wrapped_appchain_token",
                args: {
                  receiver_id: targetAccountInHex,
                  amount: amountInU64.toString(),
                },
                gas: COMPLEX_CALL_GAS,
                deposit: "0",
              },
            },
          ],
        })
        Toast.success("Transaction has been sent")
        return
      }

      wallet.signAndSendTransaction({
        signerId: accountId,
        receiverId: tokenAsset.contractId,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "ft_transfer_call",
              args: {
                receiver_id: appchain?.appchain_anchor || "",
                amount: amountInU64.toString(),
                msg: JSON.stringify({
                  BridgeToAppchain: {
                    receiver_id_in_appchain: targetAccountInHex,
                  },
                }),
              },
              gas: COMPLEX_CALL_GAS,
              deposit: "1",
            },
          },
        ],
      })
    } catch (err: any) {
      setIsTransferring.off()
      if (err.message === FAILED_TO_REDIRECT_MESSAGE) {
        return
      }
      Toast.error(err)
    }
  }

  const burnCollectible = async () => {
    setIsTransferring.on()
    try {
      let targetAccountInHex = toHexAddress(targetAccount || "")

      if (!targetAccountInHex) {
        throw new Error("Invalid target account")
      }

      const anchor_id = `${appchainId}.${registry?.contractId}`
      const wallet = await selector.wallet()
      await wallet.signAndSendTransaction({
        signerId: accountId,
        receiverId: `${collectible?.class}.${anchor_id}`,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "nft_transfer_call",
              args: {
                receiver_id: anchor_id,
                token_id: collectible?.id || "",
                msg: JSON.stringify({
                  BridgeToAppchain: {
                    receiver_id_in_appchain: targetAccountInHex,
                  },
                }),
              },
              gas: COMPLEX_CALL_GAS,
              deposit: "1",
            },
          },
        ],
      })
      Toast.success("Transferred")
    } catch (err: any) {
      setIsTransferring.off()
      if (err.message === FAILED_TO_REDIRECT_MESSAGE) {
        return
      }
      Toast.error(err)
    }
  }

  const redeemToken = async () => {
    setIsTransferring.on()

    console.log("redeemToken")

    const targetAccountInHex = stringToHex(targetAccount)
    const amountInU64 = DecimalUtil.toU64(
      DecimalUtil.fromString(amount),
      Array.isArray(tokenAsset?.metadata.decimals)
        ? tokenAsset?.metadata.decimals[0]
        : tokenAsset?.metadata.decimals
    )

    console.log("targetAccountInHex", targetAccountInHex)

    const tx: any =
      tokenAsset?.assetId === undefined
        ? appchainApi?.tx.octopusAppchain.lock(
            targetAccountInHex,
            amountInU64.toString()
          )
        : appchainApi?.tx.octopusAppchain.burnAsset(
            tokenAsset?.assetId,
            targetAccountInHex,
            amountInU64.toString()
          )

    if (isEvm) {
    } else {
      await tx
        .signAndSend(fromAccount, ({ events = [] }: any) => {
          events.forEach(({ event: { data, method, section } }: any) => {
            console.log("event", { data, method, section })

            if (
              section === "octopusAppchain" &&
              (method === "Locked" || method === "AssetBurned")
            ) {
              updateTxn(appchainId || "", {
                isAppchainSide: true,
                appchainId: appchainId || "",
                hash: tx.hash.toString(),
                sequenceId: data[method === "Locked" ? 3 : 4].toNumber(),
                amount: amountInU64.toString(),
                status: BridgeHistoryStatus.Pending,
                timestamp: new Date().getTime(),
                fromAccount: fromAccount || "",
                toAccount: targetAccount || "",
                tokenContractId: tokenAsset?.contractId || "",
              })
              setIsTransferring.off()
              checkBalanceViaRPC?.current()
            }
          })
        })
        .catch((err: any) => {
          console.log("err", err)
          Toast.error(err)
          setIsTransferring.off()
        })
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
        return toast({
          position: "top-right",
          title: "Error",
          description: "Balance not enough",
          status: "error",
        })
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
            <Box bg={grayBg} p={4} borderRadius="lg" pt={2}>
              <Heading fontSize="md" className="octo-gray">
                From
              </Heading>
              <Flex mt={3} alignItems="center" justifyContent="space-between">
                <HStack spacing={3} maxW="calc(100% - 120px)">
                  <Avatar
                    boxSize={8}
                    name={fromChainName}
                    src={
                      isReverse
                        ? nearLogo
                        : (appchain?.appchain_metadata?.fungible_token_metadata
                            .icon as any)
                    }
                  />
                  <Heading
                    fontSize="lg"
                    textOverflow="ellipsis"
                    overflow="hidden"
                    whiteSpace="nowrap"
                  >
                    {fromAccount || fromChainName}
                  </Heading>
                </HStack>
                {!fromAccount ? (
                  isReverse ? (
                    <Button
                      colorScheme="octo-blue"
                      isLoading={isLogging}
                      isDisabled={isLogging}
                      onClick={onLogin}
                      size="sm"
                    >
                      Connect
                    </Button>
                  ) : (
                    <Button
                      colorScheme="octo-blue"
                      onClick={async () => {
                        // eth
                        if (isEvm) {
                          if (typeof window.ethereum !== "undefined") {
                            console.log("MetaMask is installed!")
                            window.ethereum
                              .request({
                                method: "eth_requestAccounts",
                              })
                              .then((res: any) => {
                                console.log("res", res)
                              })
                              .catch(console.error)
                          }
                        } else {
                          // polkadot
                          setSelectAccountModalOpen.on()
                        }
                      }}
                      size="sm"
                    >
                      Connect
                    </Button>
                  )
                ) : isReverse ? (
                  <Button variant="white" onClick={onLogout} size="sm">
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    variant="white"
                    onClick={setSelectAccountModalOpen.on}
                    size="sm"
                  >
                    Change
                  </Button>
                )}
              </Flex>
            </Box>
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
            <Box
              bg={isAccountInputFocused ? bg : grayBg}
              p={4}
              borderRadius="lg"
              pt={2}
              borderColor={isAccountInputFocused ? "#2468f2" : grayBg}
              borderWidth={1}
            >
              <Flex
                alignItems="center"
                justifyContent="space-between"
                minH="25px"
              >
                <Heading fontSize="md" className="octo-gray">
                  Target
                </Heading>
                {isInvalidTargetAccount ? (
                  <HStack color="red">
                    <WarningIcon boxSize={3} />
                    <Text fontSize="xs">Invalid account</Text>
                  </HStack>
                ) : targetAccountNeedDepositStorage ? (
                  <HStack>
                    <WarningIcon color="red" boxSize={3} />
                    <Text fontSize="xs" color="red">
                      This account hasn't been setup yet
                    </Text>
                    <Button
                      colorScheme="octo-blue"
                      variant="ghost"
                      size="xs"
                      isDisabled={isDepositingStorage || !accountId}
                      isLoading={isDepositingStorage}
                      onClick={onDepositStorage}
                    >
                      {accountId ? "Setup" : "Please Login"}
                    </Button>
                  </HStack>
                ) : null}
              </Flex>
              <HStack spacing={3} mt={3}>
                <Avatar
                  boxSize={8}
                  name={targetChainName}
                  src={
                    !isReverse
                      ? nearLogo
                      : (appchain?.appchain_metadata?.fungible_token_metadata
                          .icon as any)
                  }
                />
                <InputGroup variant="unstyled">
                  <Input
                    value={targetAccount}
                    size="lg"
                    fontWeight={600}
                    maxW="calc(100% - 40px)"
                    placeholder={`Target account in ${targetChainName}`}
                    borderRadius="none"
                    onFocus={setIsAccountInputFocused.on}
                    onBlur={setIsAccountInputFocused.off}
                    onChange={(e) => setTargetAccount(e.target.value)}
                    ref={targetAccountInputRef}
                    type="text"
                  />
                  {targetAccount ? (
                    <InputRightElement>
                      <IconButton
                        aria-label="clear"
                        size="sm"
                        isRound
                        onClick={onClearTargetAccount}
                      >
                        <Icon
                          as={AiFillCloseCircle}
                          boxSize={5}
                          className="octo-gray"
                        />
                      </IconButton>
                    </InputRightElement>
                  ) : null}
                </InputGroup>
              </HStack>
            </Box>
            <Box
              borderWidth={1}
              p={4}
              borderColor={isAmountInputFocused ? "#2468f2" : grayBg}
              bg={isAmountInputFocused ? bg : grayBg}
              borderRadius="lg"
              pt={2}
              mt={6}
            >
              <Flex
                alignItems="center"
                justifyContent="space-between"
                minH="25px"
              >
                <Heading fontSize="md" className="octo-gray">
                  Bridge Asset
                </Heading>
                {fromAccount && !collectible ? (
                  <Skeleton
                    isLoaded={
                      !isLoadingBalance &&
                      ((!isReverse && !!appchainApi) ||
                        (isReverse && !!appchain))
                    }
                  >
                    <HStack>
                      <Text fontSize="sm" variant="gray">
                        Balance: {balance ? DecimalUtil.beautify(balance) : "-"}
                      </Text>
                      {balance?.gt(ZERO_DECIMAL) ? (
                        <Button
                          size="xs"
                          variant="ghost"
                          colorScheme="octo-blue"
                          onClick={onSetMax}
                        >
                          Max
                        </Button>
                      ) : null}
                    </HStack>
                  </Skeleton>
                ) : null}
              </Flex>
              {collectible ? (
                <Flex
                  mt={3}
                  borderWidth={1}
                  p={2}
                  borderColor="octo-blue.500"
                  borderRadius="lg"
                  overflow="hidden"
                  position="relative"
                >
                  <Box w="20%">
                    <Image src={collectible.metadata.mediaUri} w="100%" />
                  </Box>
                  <VStack alignItems="flex-start" ml={3}>
                    <Heading fontSize="md">{collectible.metadata.name}</Heading>
                  </VStack>
                  <Box position="absolute" top={1} right={1}>
                    <IconButton
                      aria-label="clear"
                      size="sm"
                      isRound
                      onClick={() => setCollectible(undefined)}
                    >
                      <Icon
                        as={AiFillCloseCircle}
                        boxSize={5}
                        className="octo-gray"
                      />
                    </IconButton>
                  </Box>
                </Flex>
              ) : (
                <Flex mt={3} alignItems="center">
                  <AmountInput
                    autoFocus
                    placeholder="0.00"
                    fontSize="xl"
                    fontWeight={700}
                    unstyled
                    value={amount}
                    onChange={setAmount}
                    refObj={amountInputRef}
                    onFocus={setIsAmountInputFocused.on}
                    onBlur={setIsAmountInputFocused.off}
                  />
                  <Button
                    ml={3}
                    size="sm"
                    variant="ghost"
                    onClick={setSelectTokenModalOpen.on}
                  >
                    <HStack>
                      <Avatar
                        name={tokenAsset?.metadata?.symbol}
                        src={tokenAsset?.metadata?.icon as any}
                        boxSize={5}
                        size="sm"
                      />
                      <Heading fontSize="md">
                        {tokenAsset?.metadata?.symbol}
                      </Heading>
                      <Icon as={ChevronDownIcon} />
                    </HStack>
                  </Button>
                </Flex>
              )}
            </Box>
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
      <SelectWeb3AccountModal
        isOpen={selectAccountModalOpen}
        onClose={setSelectAccountModalOpen.off}
        accounts={accounts}
        onChooseAccount={onSelectAccount}
        selectedAccount={fromAccount}
      />

      <SelectTokenModal
        isOpen={selectTokenModalOpen}
        onClose={setSelectTokenModalOpen.off}
        tokens={filteredTokens}
        isReverse={isReverse}
        appchainApi={appchainApi}
        appchainId={appchainId}
        fromAccount={fromAccount}
        collectibleClasses={collectibleClasses}
        onSelectToken={onSelectToken}
        selectedToken={tokenAsset?.metadata?.symbol}
      />

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
