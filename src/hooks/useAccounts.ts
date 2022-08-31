import { useEffect, useState } from "react"
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types"
import { web3Enable, web3Accounts } from "@polkadot/extension-dapp"
import detectEthereumProvider from "@metamask/detect-provider"

export default function useAccounts(isEvm: boolean, isRequest: boolean) {
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([])
  const [currentAccount, setCurrentAccount] =
    useState<InjectedAccountWithMeta>()

  const storageKey = isEvm ? "currentETHAccount" : "currentSubstradeAccount"

  useEffect(() => {
    async function getAccounts() {
      if (!isRequest) {
        return
      }

      try {
        const previousAccount = localStorage.getItem(storageKey)
        if (isEvm) {
          const provider = await detectEthereumProvider({
            mustBeMetaMask: true,
          })
          if (provider) {
            const accounts = await (provider as any).request({
              method: "eth_requestAccounts",
            })

            const _accounts = accounts.map((t: string) => {
              return {
                address: t,
                meta: { source: "metamask" },
              }
            })
            setAccounts(_accounts)
            const oldAccount = _accounts.find(
              (a: InjectedAccountWithMeta) => a.address === previousAccount
            )
            if (previousAccount && oldAccount) {
              setCurrentAccount(oldAccount)
            } else {
              setCurrentAccount(_accounts[0])
            }
          }
        } else {
          await web3Enable("Octopus Network")
          const accounts = await web3Accounts()
          setAccounts(accounts)
          const oldAccount = accounts.find(
            (a: InjectedAccountWithMeta) => a.address === previousAccount
          )
          if (accounts.length) {
            if (oldAccount) {
              setCurrentAccount(oldAccount)
            } else {
              setCurrentAccount(accounts[0])
            }
          }
        }
      } catch (error) {}
    }

    getAccounts()
  }, [isEvm, isRequest, storageKey])

  return {
    accounts,
    currentAccount,
    setCurrentAccount: (newAccount: InjectedAccountWithMeta) => {
      setCurrentAccount(newAccount)
      localStorage.setItem(
        isEvm ? "currentETHAccount" : "currentSubstradeAccount",
        newAccount.address
      )
    },
  }
}
