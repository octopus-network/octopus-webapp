export type FungibleTokenMetadata = {
  spec: string;
  name: string;
  symbol: string;
  icon: string | null;
  reference: string | null;
  referenceHash: string | null;
  decimals: number;
}

export type StorageDeposit = {
  total: string;
  available: string;
}