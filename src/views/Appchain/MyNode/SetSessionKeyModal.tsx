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
  HStack,
  VStack,
  Flex,
  Box,
  Icon,
  useToast,
  useBoolean,
  Button,
} from "@chakra-ui/react"

import type { ApiPromise } from "@polkadot/api"
import { isHex } from "@polkadot/util"
import { ChevronRightIcon } from "@chakra-ui/icons"
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types"
import {
  web3FromSource,
  web3Enable,
  web3Accounts,
} from "@polkadot/extension-dapp"
import { Empty } from "components"

import { BaseModal } from "components"
import OctIdenticon from "components/common/OctIdenticon"

type SetSessionKeyModalProps = {
  isOpen: boolean
  onClose: () => void
  appchainApi: ApiPromise | undefined
}

export const SetSessionKeyModal: React.FC<SetSessionKeyModalProps> = ({
  isOpen,
  onClose,
  appchainApi,
}) => {
  const toast = useToast()

  const bg = useColorModeValue("#f6f7fa", "#15172c")
  const [currentAccount, setCurrentAccount] =
    useState<InjectedAccountWithMeta>()
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>()
  const [key, setKey] = useState("")
  const [isSubmitting, setIsSubmitting] = useBoolean(false)

  const [isInAccountsPage, setIsInAccountsPage] = useBoolean()

  useEffect(() => {
    if (isOpen) {
      setIsInAccountsPage.off()
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      web3Enable("Octopus Network").then((res) => {
        web3Accounts().then((accounts) => {
          setAccounts(accounts)
          if (accounts.length) {
            setCurrentAccount(accounts[0])
          }
        })
      })
    }
  }, [isOpen])

  const onChooseAccount = (account: InjectedAccountWithMeta) => {
    setCurrentAccount(account)
    setIsInAccountsPage.off()
  }

  const onKeyChange = (key: string) => {
    if (isHex(key) && key.length === 324) {
      setKey(key)
    } else {
      setKey("")
    }
  }

  const onSubmit = async () => {
    setIsSubmitting.on()
    const injected = await web3FromSource(currentAccount?.meta.source || "")
    appchainApi?.setSigner(injected.signer)

    const tx = appchainApi?.tx.session.setKeys(key, "0x00")
    if (!tx) {
      setIsSubmitting.off()
      return
    }

    try {
      await tx
        .signAndSend(currentAccount?.address as any, (res: any) => {
          if (res.isInBlock) {
            toast({
              title: "Set session keys success",
              status: "success",
              position: "top-right",
            })

            setTimeout(() => {
              window.location.reload()
            }, 500)
          }
        })
        .catch((err) => {
          setIsSubmitting.off()
          throw new Error(err.toString())
        })
    } catch (err: any) {
      setIsSubmitting.off()
      toast({
        title: err.toString(),
        status: "error",
        position: "top-right",
      })
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
                  <HStack w="calc(100% - 100px)">
                    <OctIdenticon value={account.address} size={32} />
                    <VStack spacing={0} alignItems="flex-start" w="100%">
                      <Heading fontSize="md">
                        {account.meta?.name || "No Name"}
                      </Heading>
                      <Text
                        variant="gray"
                        fontSize="xs"
                        w="100%"
                        whiteSpace="nowrap"
                        overflow="hidden"
                        textOverflow="ellipsis"
                      >
                        {account.address}
                      </Text>
                    </VStack>
                  </HStack>
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
              onClick={setIsInAccountsPage.on}
            >
              {!currentAccount ? (
                <Text variant="gray">Please Install Wallet Extension</Text>
              ) : (
                <>
                  <HStack w="calc(100% - 100px)">
                    <OctIdenticon value={currentAccount.address} size={40} />
                    <VStack spacing={1} alignItems="flex-start" w="100%">
                      <Heading fontSize="lg">
                        {currentAccount.meta?.name || "No Name"}
                      </Heading>
                      <Text
                        variant="gray"
                        fontSize="sm"
                        w="100%"
                        whiteSpace="nowrap"
                        overflow="hidden"
                        textOverflow="ellipsis"
                      >
                        {currentAccount.address}
                      </Text>
                    </VStack>
                  </HStack>
                </>
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
