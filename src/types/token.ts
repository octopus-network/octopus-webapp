export type FungibleTokenMetadata = {
  spec: string
  name: string
  symbol: string
  icon: string | null
  reference: string | null
  referenceHash: string | null
  decimals: number
  token_id?: string
}

export type StorageDeposit = {
  total: string
  available: string
}

interface FTInfo {
  decimals: number
  name: string
  symbol: string
}

export interface CrossChainToken {
  bridging_state: "Closed" | "Active"
  contract_account: string
  locked_balance: string
  price_in_usd: string
  metadata: FTInfo
}

export interface TokenPriceItem {
  TVL: number
  price: number
  token_account_id: string
  ftInfo: FTInfo
}
