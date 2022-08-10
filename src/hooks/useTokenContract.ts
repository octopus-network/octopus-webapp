import { useWalletSelector } from "components/WalletSelectorContextProvider"
import { TOKEN_METHODS } from "config/constants"
import { useEffect, useState } from "react"
import { TokenContract } from "types"

export function useTokenContract(contractId?: string) {
  const [tokenContract, setTokenContract] = useState<TokenContract>()
  const { nearAccount } = useWalletSelector()

  useEffect(() => {
    if (nearAccount && contractId) {
      setTokenContract(
        new TokenContract(nearAccount!, contractId, TOKEN_METHODS)
      )
    } else {
      setTokenContract(undefined)
    }
  }, [contractId, nearAccount])

  return tokenContract
}
