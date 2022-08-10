import {
  Avatar,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  useBoolean,
  useColorModeValue,
} from "@chakra-ui/react"
import nearLogo from "assets/near.svg"
import { useWalletSelector } from "components/WalletSelectorContextProvider"
import useAccounts from "hooks/useAccounts"
import { useCallback, useEffect, useState } from "react"
import { AppchainInfoWithAnchorStatus, TokenAsset } from "types"
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types"
import { SelectWeb3AccountModal } from "views/Bridge/SelectWeb3AccountModal"
import { Toast } from "components/common/toast"
import { AiFillCloseCircle } from "react-icons/ai"
import { providers } from "near-api-js"
import { CodeResult } from "near-api-js/lib/providers/provider"
import { ApiPromise } from "@polkadot/api"
import { WarningIcon } from "@chakra-ui/icons"
import { DecimalUtil } from "utils"
import Decimal from "decimal.js"
import { SIMPLE_CALL_GAS } from "primitives"
import { web3Enable, web3FromSource } from "@polkadot/extension-dapp"

export default function AddressInpput({
  label,
  chain,
  appchain,
  onChange,
  tokenAsset,
  appchainApi,
}: {
  label: string
  chain: string
  appchain?: AppchainInfoWithAnchorStatus
  onChange: (value: string | undefined) => void
  tokenAsset?: TokenAsset
  appchainApi?: ApiPromise
}) {
  const grayBg = useColorModeValue("#f2f4f7", "#1e1f34")
  const isEvm = appchain?.appchain_metadata.template_type === "BarnacleEvm"

  const [selectAccountModalOpen, setSelectAccountModalOpen] = useBoolean()
  const [targetAccountNeedDepositStorage, setTargetAccountNeedDepositStorage] =
    useBoolean()
  const [address, setAddress] = useState<string | undefined>()
  const { accountId, modal, selector } = useWalletSelector()
  const [isDepositingStorage, setIsDepositingStorage] = useBoolean()
  const { accounts, currentAccount, setCurrentAccount } = useAccounts(
    isEvm,
    isEvm
  )
  const isNear = chain === "NEAR"
  const isFrom = label === "From"

  const onUpdateAddress = useCallback(
    (value: string | undefined) => {
      setAddress(value)
      onChange(value)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  useEffect(() => {
    if (isNear) {
      onUpdateAddress(accountId)
    } else {
      onUpdateAddress(currentAccount?.address)
    }
  }, [accountId, currentAccount, isNear, onUpdateAddress])

  const onSelectAccount = (account: InjectedAccountWithMeta) => {
    setCurrentAccount(account)
    onUpdateAddress(account.address)
    setSelectAccountModalOpen.off()
  }

  useEffect(() => {
    setTargetAccountNeedDepositStorage.off()
    if (!address || isFrom || !tokenAsset) {
      return
    }
    if (isNear) {
      const provider = new providers.JsonRpcProvider({
        url: selector.options.network.nodeUrl,
      })
      provider
        .query<CodeResult>({
          request_type: "call_function",
          account_id: tokenAsset.contractId,
          method_name: "storage_balance_of",
          args_base64: btoa(JSON.stringify({ account_id: address })),
          finality: "optimistic",
        })
        .then((res) => {
          const storage = JSON.parse(Buffer.from(res.result).toString())
          if (storage === null) {
            setTargetAccountNeedDepositStorage.on()
          }
        })
    } else if (appchainApi) {
      appchainApi?.query.system.account(address).then((res: any) => {
        if (res.providers.toNumber() === 0) {
          setTargetAccountNeedDepositStorage.on()
        }
      })
    }
  }, [
    address,
    isNear,
    isFrom,
    tokenAsset,
    selector.options.network.nodeUrl,
    setTargetAccountNeedDepositStorage,
    appchainApi,
    isEvm,
  ])

  const onLogin = () => {
    if (isNear) {
      modal.show()
    } else if (isEvm) {
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
      } else {
        Toast.error("Please install MetaMask first")
      }
    } else {
      // polkadot
      setSelectAccountModalOpen.on()
    }
  }

  const onLogout = () => {
    if (isNear) {
      selector
        .wallet()
        .then((w) => {
          w.signOut()

          window.location.reload()
        })
        .catch(Toast.error)
    } else {
      setSelectAccountModalOpen.on()
    }
  }

  const onClear = () => {
    onUpdateAddress("")
  }

  const onDepositStorage = async () => {
    if (!isNear) {
      if (!appchainApi || !currentAccount) {
        return
      }
      await web3Enable("Octopus Network")
      const injected = await web3FromSource(currentAccount.meta.source || "")
      appchainApi.setSigner(injected.signer)

      setIsDepositingStorage.on()

      const res = await appchainApi?.query.system.account(address)
      const resJSON: any = res?.toJSON()
      const balance = DecimalUtil.fromString(
        resJSON?.data?.free,
        Array.isArray(tokenAsset?.metadata.decimals)
          ? tokenAsset?.metadata.decimals[1]
          : tokenAsset?.metadata.decimals
      )
      const toDepositAmount = DecimalUtil.toU64(
        new Decimal(isEvm ? 0.0002 : 0.01),
        appchain?.appchain_metadata?.fungible_token_metadata?.decimals
      ).toString()

      if (!balance.gte(toDepositAmount)) {
        return Toast.error("Balance not enough")
      }
      const tx = appchainApi.tx.balances.transfer(address!, toDepositAmount)

      tx.signAndSend(currentAccount.address, (res) => {
        if (res.isInBlock) {
          setIsDepositingStorage.off()
          setTargetAccountNeedDepositStorage.off()
        }
      })

      return
    }

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
              args: { account_id: address },
              gas: SIMPLE_CALL_GAS,
              deposit: "1250000000000000000000",
            },
          },
        ],
      })
      setIsDepositingStorage.off()
    } catch (err) {
      setIsDepositingStorage.off()
      Toast.error(err)
    }
  }

  return (
    <Box bg={grayBg} p={4} borderRadius="lg" pt={2}>
      <Flex alignItems="center" justifyContent="space-between" minH="25px">
        <Heading fontSize="md" className="octo-gray">
          {label}
        </Heading>
        {targetAccountNeedDepositStorage && (
          <HStack>
            <WarningIcon color="red" boxSize={3} />
            <Text fontSize="xs" color="red">
              This account hasn't been setup yet
            </Text>
            <Button
              colorScheme="octo-blue"
              variant="ghost"
              size="xs"
              isDisabled={isDepositingStorage}
              isLoading={isDepositingStorage}
              onClick={onDepositStorage}
            >
              {accountId ? "Setup" : "Please Login"}
            </Button>
          </HStack>
        )}
      </Flex>
      <Flex mt={3} alignItems="center" justifyContent="space-between">
        <HStack spacing={1} flex={1}>
          <Avatar
            boxSize={8}
            name={chain}
            src={
              chain === "NEAR"
                ? nearLogo
                : (appchain?.appchain_metadata?.fungible_token_metadata
                    .icon as any)
            }
          />
          <InputGroup variant="unstyled">
            <Input
              value={address}
              size="lg"
              fontWeight={600}
              maxW="calc(100% - 40px)"
              placeholder={`Target account in ${chain}`}
              borderRadius="none"
              onChange={(e) => onUpdateAddress(e.target.value)}
              type="text"
            />
            {address && !isFrom && (
              <InputRightElement>
                <IconButton
                  aria-label="clear"
                  size="sm"
                  isRound
                  onClick={onClear}
                >
                  <Icon
                    as={AiFillCloseCircle}
                    boxSize={5}
                    className="octo-gray"
                  />
                </IconButton>
              </InputRightElement>
            )}
          </InputGroup>
        </HStack>

        {!address ? (
          <Button colorScheme="octo-blue" onClick={onLogin} size="sm">
            Connect
          </Button>
        ) : (
          <Button variant="white" onClick={onLogout} size="sm">
            {isNear ? "Disconnect" : "Change"}
          </Button>
        )}
      </Flex>
      <SelectWeb3AccountModal
        isOpen={selectAccountModalOpen}
        onClose={setSelectAccountModalOpen.off}
        accounts={accounts}
        onChooseAccount={onSelectAccount}
        selectedAccount={address}
      />
    </Box>
  )
}
