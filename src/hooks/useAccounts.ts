import { useEffect, useState } from "react"
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types"
import { web3Enable, web3Accounts } from "@polkadot/extension-dapp"
import detectEthereumProvider from "@metamask/detect-provider"

export default function useAccounts(isEvm: boolean, isRequest: boolean) {
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([])
  const [currentAccount, setCurrentAccount] =
    useState<InjectedAccountWithMeta>()

  useEffect(() => {
    if (isEvm) {
      if (!isRequest) {
        return
      }
      detectEthereumProvider({ mustBeMetaMask: true })
        .then((provider: any) => {
          if (provider) {
            provider
              .request({
                method: "eth_requestAccounts",
              })
              .then((accounts: string[]) => {
                const _accounts = accounts.map((t) => {
                  return {
                    address: t,
                    meta: { source: "metamask" },
                  }
                })
                setAccounts(_accounts)
                setCurrentAccount(_accounts[0])
              })
          }
        })
        .catch(console.error)
    } else {
      web3Enable("Octopus Network").then((res) => {
        web3Accounts().then((accounts) => {
          setAccounts(accounts)
          if (accounts.length) {
            setCurrentAccount(accounts[0])
          }
        })
      })
    }
  }, [isEvm, isRequest])

  return {
    accounts,
    currentAccount,
    setCurrentAccount,
  }
}
