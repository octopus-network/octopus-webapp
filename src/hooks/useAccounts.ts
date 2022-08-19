import { useEffect, useState } from "react"
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types"
import { web3Enable, web3Accounts } from "@polkadot/extension-dapp"
import detectEthereumProvider from "@metamask/detect-provider"

export default function useAccounts(isEvm: boolean, isRequest: boolean) {
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([])
  const [currentAccount, setCurrentAccount] =
    useState<InjectedAccountWithMeta>()

  useEffect(() => {
    async function getAccounts() {
      if (!isRequest) {
        return
      }

      try {
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
            setCurrentAccount(_accounts[0])
          }
        } else {
          await web3Enable("Octopus Network")
          const accounts = await web3Accounts()
          setAccounts(accounts)
          if (accounts.length) {
            setCurrentAccount(accounts[0])
          }
        }
      } catch (error) {}
    }

    getAccounts()
  }, [isEvm, isRequest])

  return {
    accounts,
    currentAccount,
    setCurrentAccount,
  }
}
