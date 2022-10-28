export type NetworkConfig = {
  near: {
    archivalUrl: string;
    explorerUrl: string;
    helperUrl: string;
    networkId: NetworkType;
    nodeUrl: string;
    walletUrl: string;
    restApiUrl: string;
  };
  octopus: {
    explorerUrl: string;
    octTokenContractId: string;
    registryContractId: string;
    councilContractId: string;
  };
};

export type BridgeConfig = {
  tokenPallet: {
    section: string;
    method: string;
    paramsType: "Tuple" | "Array";
    valueKey: string;
  };
  whitelist: Record<string, string[]>;
};

type ConverterItemConfig = {
  contractId: string;
};

export enum NetworkType {
  MAINNET = "mainnet",
  TESTNET = "testnet",
}

export type ConverterConfig = {
  [NetworkType.TESTNET]: ConverterItemConfig;
  [NetworkType.MAINNET]: ConverterItemConfig;
};
