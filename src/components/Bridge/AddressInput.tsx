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
import { useEffect, useState } from "react"
import { AppchainInfoWithAnchorStatus } from "types"
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types"
import { SelectWeb3AccountModal } from "views/Bridge/SelectWeb3AccountModal"
import { Toast } from "components/common/toast"
import { AiFillCloseCircle } from "react-icons/ai"
import { WarningIcon } from "@chakra-ui/icons"

export default function AddressInpput({
  label,
  chain,
  appchain,
}: {
  label: string
  chain: string
  appchain?: AppchainInfoWithAnchorStatus
}) {
  const grayBg = useColorModeValue("#f2f4f7", "#1e1f34")
  const isEvm = appchain?.appchain_metadata.template_type === "BarnacleEvm"

  const [isDepositingStorage, setIsDepositingStorage] = useBoolean()
  const [selectAccountModalOpen, setSelectAccountModalOpen] = useBoolean()
  const [address, setAddress] = useState<string | undefined>()
  const { accountId, modal, selector } = useWalletSelector()
  const { accounts, currentAccount, setCurrentAccount } = useAccounts(
    isEvm,
    isEvm
  )
  const isNear = chain === "NEAR"
  const isFrom = label === "From"
  useEffect(() => {
    if (isNear) {
      setAddress(accountId)
    } else {
      setAddress(currentAccount?.address)
    }
  }, [accountId, currentAccount, isNear])

  const onSelectAccount = (account: InjectedAccountWithMeta) => {
    setCurrentAccount(account)
    setSelectAccountModalOpen.off()
  }

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
    setAddress("")
  }

  const onDepositStorage = async () => {
    // if (isReverse) {
    //   if (!appchainApi || !currentAccount) {
    //     return
    //   }
    //   await web3Enable("Octopus Network")
    //   const injected = await web3FromSource(currentAccount.meta.source || "")
    //   appchainApi.setSigner(injected.signer)
    //   setIsDepositingStorage.on()
    //   const res = await appchainApi?.query.system.account(fromAccount)
    //   const resJSON: any = res?.toJSON()
    //   const balance = DecimalUtil.fromString(
    //     resJSON?.data?.free,
    //     Array.isArray(tokenAsset?.metadata.decimals)
    //       ? tokenAsset?.metadata.decimals[1]
    //       : tokenAsset?.metadata.decimals
    //   )
    //   const toDepositAmount = DecimalUtil.toU64(
    //     new Decimal(0.01),
    //     appchain?.appchain_metadata?.fungible_token_metadata?.decimals
    //   ).toString()
    //   if (!balance.gte(toDepositAmount)) {
    //     return Toast.error("Balance not enough")
    //   }
    //   const tx = appchainApi.tx.balances.transfer(
    //     targetAccount,
    //     toDepositAmount
    //   )
    //   tx.signAndSend(currentAccount.address, (res) => {
    //     if (res.isInBlock) {
    //       setIsDepositingStorage.off()
    //       setTargetAccountNeedDepositStorage.off()
    //     }
    //   })
    //   return
    // }
    // console.log("accountId", targetAccount, accountId)
    // try {
    //   setIsDepositingStorage.on()
    //   const wallet = await selector.wallet()
    //   await wallet.signAndSendTransaction({
    //     signerId: accountId,
    //     receiverId: tokenAsset?.contractId,
    //     actions: [
    //       {
    //         type: "FunctionCall",
    //         params: {
    //           methodName: "storage_deposit",
    //           args: { account_id: targetAccount },
    //           gas: SIMPLE_CALL_GAS,
    //           deposit: "1250000000000000000000",
    //         },
    //       },
    //     ],
    //   })
    //   setIsDepositingStorage.off()
    // } catch (err) {
    //   setIsDepositingStorage.off()
    //   if (err instanceof Error) {
    //     if (err.message === FAILED_TO_REDIRECT_MESSAGE) {
    //       return
    //     }
    //     Toast.error(err)
    //   }
    // }
  }

  return (
    <Box bg={grayBg} p={4} borderRadius="lg" pt={2}>
      <Flex alignItems="center" justifyContent="space-between" minH="25px">
        <Heading fontSize="md" className="octo-gray">
          {label}
        </Heading>
        {/* {!isFrom && (
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
                  </HStack>) : null} */}
      </Flex>
      <Flex mt={3} alignItems="center" justifyContent="space-between">
        <HStack spacing={0} maxW="calc(100% - 60px)">
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
          {isFrom ? (
            <Heading
              fontSize="lg"
              textOverflow="ellipsis"
              overflow="hidden"
              whiteSpace="nowrap"
            >
              {address || chain}
            </Heading>
          ) : (
            <InputGroup variant="unstyled" flex="1">
              <Input
                value={address}
                size="lg"
                fontWeight={600}
                maxW="calc(100% - 40px)"
                placeholder={`Target account in ${chain}`}
                borderRadius="none"
                onChange={(e) => setAddress(e.target.value)}
                type="text"
              />
              {address && (
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
          )}
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
