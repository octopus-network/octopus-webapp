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

export default function AddressInpput({
  label,
  chain,
  appchain,
  onChange,
}: {
  label: string
  chain: string
  appchain?: AppchainInfoWithAnchorStatus
  onChange: (value: string) => void
}) {
  const grayBg = useColorModeValue("#f2f4f7", "#1e1f34")
  const isEvm = appchain?.appchain_metadata.template_type === "BarnacleEvm"

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

  return (
    <Box bg={grayBg} p={4} borderRadius="lg" pt={2}>
      <Flex alignItems="center" justifyContent="space-between" minH="25px">
        <Heading fontSize="md" className="octo-gray">
          {label}
        </Heading>
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
