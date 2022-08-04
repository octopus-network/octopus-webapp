import React, { useState, useEffect } from "react"

import {
  Input,
  Text,
  List,
  Heading,
  Link,
  FormControl,
  FormHelperText,
  useColorModeValue,
  Flex,
  Box,
  Icon,
  useBoolean,
  Button,
} from "@chakra-ui/react"

import type { ApiPromise } from "@polkadot/api"
import { isHex } from "@polkadot/util"
import { ChevronRightIcon } from "@chakra-ui/icons"
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types"
import { web3FromSource } from "@polkadot/extension-dapp"
import { Empty } from "components"

import { BaseModal } from "components"
import { AppchainInfo } from "types"
import AccountItem from "components/common/AccountItem"
import detectEthereumProvider from "@metamask/detect-provider"
import useAccounts from "hooks/useAccounts"
import { Toast } from "components/common/toast"
import { setSessionKey } from "utils/bridge"

type SetSessionKeyModalProps = {
  isOpen: boolean
  onClose: () => void
  appchainApi?: ApiPromise
  appchain?: AppchainInfo
}

export const SetSessionKeyModal: React.FC<SetSessionKeyModalProps> = ({
  isOpen,
  onClose,
  appchainApi,
  appchain,
}) => {
  const bg = useColorModeValue("#f6f7fa", "#15172c")

  const [key, setKey] = useState("")
  const [isSubmitting, setIsSubmitting] = useBoolean(false)

  const [isInAccountsPage, setIsInAccountsPage] = useBoolean()

  useEffect(() => {
    if (isOpen) {
      setIsInAccountsPage.off()
    }
  }, [isOpen])

  const isEvm = appchain?.appchain_metadata.template_type === "BarnacleEvm"
  const { accounts, currentAccount, setCurrentAccount } = useAccounts(
    isEvm,
    isOpen
  )

  const onChooseAccount = (account: InjectedAccountWithMeta) => {
    setCurrentAccount(account)
    setIsInAccountsPage.off()
  }

  const onKeyChange = (key: string) => {
    if (
      isHex(key) &&
      ((!isEvm && key.length === 324) || (isEvm && key.length === 326))
    ) {
      setKey(key)
    } else {
      setKey("")
    }
  }

  const onSubmit = async () => {
    try {
      setIsSubmitting.on()
      if (isEvm) {
        await setSessionKey(key)
      } else {
        const injected = await web3FromSource(currentAccount?.meta.source || "")
        appchainApi?.setSigner(injected.signer)

        const tx = appchainApi?.tx.session.setKeys(key, "0x00")
        if (!tx) {
          setIsSubmitting.off()
          return
        }

        await tx.signAndSend(currentAccount?.address as any, (res: any) => {
          if (res.isInBlock) {
            Toast.success("Set session keys success")

            setTimeout(() => {
              window.location.reload()
            }, 500)
          }
        })
      }
      setIsSubmitting.off()
    } catch (err: any) {
      setIsSubmitting.off()
      Toast.error(err)
    }
  }

  const onConnect = async () => {
    if (!isEvm) {
      return
    }

    try {
      const provider = await detectEthereumProvider({ mustBeMetaMask: true })
      await (provider as any)?.request({
        method: "eth_requestAccounts",
      })
    } catch (error) {
      console.log("error", error)
    }
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isInAccountsPage ? "Choose Account" : "Set Session Key"}
      maxW="520px"
    >
      {isInAccountsPage ? (
        <Box>
          {!accounts?.length ? (
            <Empty message="No accounts. Please install wallet extension." />
          ) : (
            <List>
              {accounts.map((account) => (
                <Box
                  p={2}
                  _hover={{ background: bg }}
                  key={account.address}
                  borderRadius="lg"
                  cursor="pointer"
                  onClick={() => onChooseAccount(account)}
                >
                  <AccountItem account={account} />
                </Box>
              ))}
            </List>
          )}
        </Box>
      ) : (
        <>
          <List spacing={4}>
            <Flex
              p={3}
              bg={bg}
              borderRadius="lg"
              cursor="pointer"
              justifyContent="space-between"
              alignItems="center"
              onClick={() => {
                if (isEvm && !currentAccount) {
                  onConnect()
                } else {
                  setIsInAccountsPage.on()
                }
              }}
            >
              {!currentAccount ? (
                <Text variant="gray">
                  {isEvm
                    ? "Please Connect Wallet"
                    : "Please Install Wallet Extension"}
                </Text>
              ) : (
                <AccountItem account={currentAccount} />
              )}
              <Icon as={ChevronRightIcon} boxSize={6} />
            </Flex>
            <FormControl mt={2}>
              <Input
                type="text"
                placeholder="Session key"
                autoFocus
                onChange={(e) => onKeyChange(e.target.value)}
              />
              <FormHelperText>
                Session Key is usually a set of hex strings, you can get it from
                the node you deployed
                <Link
                  href="https://docs.oct.network/maintain/validator-set-session-keys.html"
                  variant="blue-underline"
                  isExternal
                  ml={2}
                >
                  How to get?
                </Link>
              </FormHelperText>
            </FormControl>
          </List>
          <Box mt={8}>
            <Button
              colorScheme="octo-blue"
              onClick={onSubmit}
              width="100%"
              isDisabled={!key || !currentAccount}
              isLoading={isSubmitting}
            >
              Set
            </Button>
          </Box>
        </>
      )}
    </BaseModal>
  )
}
