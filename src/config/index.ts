import { BridgeConfig, NetworkType } from "types";
import {
  APPCHAIN_COLLECTIBLE_CLASSES,
  APPCHAIN_TOKEN_PALLET,
} from "./constants";

export * from "./theme";

const env: NetworkType = (process.env.ENV || "mainnet") as NetworkType;
const isMainnet = env === "mainnet";

export const API_HOST = isMainnet
  ? "https://api-worker.octopus-network.workers.dev"
  : "https://api-worker-testnet.octopus-network.workers.dev";

export const DEPLOY_CONFIG = {
  deployApiHost: isMainnet
    ? "https://1fus85rip4.execute-api.ap-northeast-1.amazonaws.com/api"
    : "https://3jd9s8zf1l.execute-api.us-west-2.amazonaws.com/api",
  regions: [
    {
      label: "Random",
      value: "",
    },
    {
      label: "Asia Pacific",
      value: "ap",
    },
    {
      label: "Europe",
      value: "eu",
    },
    {
      label: "United States",
      value: "us",
    },
  ],
  upgradeWhitelist: [],
};

export const BRIDGE_CONFIG = (appchainId?: string): BridgeConfig => {
  return {
    tokenPallet: APPCHAIN_TOKEN_PALLET[appchainId || "default"],
    whitelist: {},
    crosschainFee: appchainId
      ? (isMainnet
          ? ["myriad", "fusotao"]
          : ["barnacle0928", "uniqueone-appchain", "myriad"]
        ).includes(appchainId)
      : false,
  };
};

export const COLLECTIBLE_CLASSES = (appchainId?: string) => {
  return appchainId ? APPCHAIN_COLLECTIBLE_CLASSES[env]?.[appchainId] : [];
};

export const NETWORK_CONFIG = {
  near: {
    networkId: env,
    nodeUrl: `https://rpc.${env}.near.org`,
    archivalUrl: `https://archival-rpc.${env}.near.org`,
    walletUrl: `https://wallet.${env}.near.org`,
    helperUrl: `https://helper.${env}.near.org`,
    explorerUrl: `https://explorer.${env}.near.org`,
    restApiUrl: "https://rest.nearapi.org",
  },
  octopus: {
    explorerUrl: `https://explorer.${env}.oct.network`,
    registryContractId: isMainnet
      ? "octopus-registry.near"
      : "dev-oct-registry.testnet",
    octTokenContractId: isMainnet
      ? "f5cfbc74057c610c8ef151a439252680ac68c6dc.factory.bridge.near"
      : "oct.beta_oct_relay.testnet",
    councilContractId: isMainnet
      ? "octopus-council.octopus-registry.near"
      : "octopus-council.registry.test_oct.testnet",
  },
};
