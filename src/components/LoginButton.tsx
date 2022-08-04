import React from "react"

import { Button, Icon } from "@chakra-ui/react"

import { AiOutlineUser } from "react-icons/ai"
import { useWalletSelector } from "./WalletSelectorContextProvider"

export const LoginButton: React.FC = () => {
  const { modal } = useWalletSelector()

  const onLogin = (e: any) => {
    modal.show()
  }

  return (
    <Button variant="octo-linear" onClick={onLogin}>
      <Icon as={AiOutlineUser} boxSize={5} mr={2} /> Login
    </Button>
  )
}
