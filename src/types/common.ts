export type NetworkConfig = {
  near: {
    archivalUrl: string;
    explorerUrl: string;
    helperUrl: string;
    networkId: string;
    nodeUrl: string;
    walletUrl: string;
  },
  octopus: {
    explorerUrl: string;
    octTokenContractId: string;
    registryContractId: string;
  }
}

export type BridgeConfig = {
  tokenPallet: {
    section: string;
    method: string;
    paramsType: 'Tuple' | 'Array';
    valueKey: string;
  };
}