import { useEffect, useState } from "react"

export default function useEthAccounts() {
  const [accounts, setAccounts] = useState([])

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      console.log("MetaMask is installed!")
      window.ethereum
        .request({
          method: "eth_requestAccounts",
        })
        .then((res: any) => {
          setAccounts(res)
        })
        .catch(console.error)
    }
  }, [])

  return accounts
}
