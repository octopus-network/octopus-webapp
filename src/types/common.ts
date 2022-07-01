export type NetworkConfig = {
  near: {
    archivalUrl: string
    explorerUrl: string
    helperUrl: string
    networkId: NetworkType
    nodeUrl: string
    walletUrl: string
    restApiUrl: string
  }
  octopus: {
    explorerUrl: string
    octTokenContractId: string
    registryContractId: string
  }
}

export type BridgeConfig = {
  tokenPallet: {
    section: string
    method: string
    paramsType: "Tuple" | "Array"
    valueKey: string
  }
  whitelist: Record<string, string[]>
}

type ConverterItemConfig = {
  contractId: string
}

export enum NetworkType {
  MAINNET = "mainnet",
  TESTNET = "testnet",
}

export type ConverterConfig = {
  [NetworkType.TESTNET]: ConverterItemConfig
  [NetworkType.MAINNET]: ConverterItemConfig
}

export type BridgeProcessParams = {
  signed_commitment: number[]
  validator_proofs: any
  mmr_leaf_for_mmr_root: number[]
  mmr_proof_for_mmr_root: number[]
  encoded_messages: number[]
  header: number[]
  mmr_leaf_for_header: number[]
  mmr_proof_for_header: number[]
  hash?: string
}
