import { AppchainSettings, BridgeConfig, NetworkType } from "types";
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

export const APPCHAIN_SETTINGS: Record<string, AppchainSettings> = isMainnet
  ? {
      fusotao: {
        rpc_endpoint:
          "wss://gateway.mainnet.octopus.network/fusotao/0efwa9v0crdx4dg3uj8jdmc5y7dj4ir2",
        subql_endpoint:
          "https://api.subquery.network/sq/octopus-appchains/fusotao",
        era_reward: "4109000000000000000000",
        bonus_for_new_validator: "1000000000000000000",
      },
      discovol: {
        rpc_endpoint:
          "wss://gateway.mainnet.octopus.network/discovol/afpft46l1egfhrv8at5pfyrld03zseo1",
        subql_endpoint:
          "https://api.subquery.network/sq/octopus-appchains/discovol",
        era_reward: "5479500000000000000",
        bonus_for_new_validator: "100000000000000",
      },
      atocha: {
        rpc_endpoint:
          "wss://gateway.mainnet.octopus.network/atocha/jungxomf4hdcfocwcalgoiz64g9avjim",
        subql_endpoint:
          "https://api.subquery.network/sq/octopus-appchains/atocha",
        era_reward: "13699000000000000000000",
        bonus_for_new_validator: "1000000000000000000",
      },
      myriad: {
        rpc_endpoint:
          "wss://gateway.mainnet.octopus.network/myriad/a4cb0a6e30ff5233a3567eb4e8cb71e0",
        subql_endpoint:
          "https://api.subquery.network/sq/octopus-appchains/myriad",
        era_reward: "68493000000000000000000",
        bonus_for_new_validator: "1000000000000000000",
      },
      debionetwork: {
        rpc_endpoint:
          "wss://gateway.mainnet.octopus.network/debionetwork/ae48005a0c7ecb4053394559a7f4069e",
        subql_endpoint:
          "https://api.subquery.network/sq/octopus-appchains/debionetwork",
        era_reward: "13699000000000000000000",
        bonus_for_new_validator: "1000000000000000000",
      },
    }
  : {
      barnacle0928: {
        rpc_endpoint:
          "wss://gateway.testnet.octopus.network/barnacle0928/9mw012zuf27soh7nrrq3a4p0s2ti3cyn",
        subql_endpoint:
          "https://api.subquery.network/sq/octopus-appchains/testnet-barnacle",
        era_reward: "5000000000000000000000",
        bonus_for_new_validator: "0",
      },
      "plats-network": {
        rpc_endpoint:
          "wss://gateway.testnet.octopus.network/plats-network/1yj1p2a45csyg3y1904lxdmeeazj6d4q",
        subql_endpoint: "",
        era_reward: "34246000000000000000000",
        bonus_for_new_validator: "1000000000000000000",
      },
      "barnacle-evm": {
        rpc_endpoint:
          "wss://gateway.testnet.octopus.network/barnacle-evm/wj1hhcverunusc35jifki19otd4od1n5",
        subql_endpoint:
          "https://api.subquery.network/sq/octopus-appchains/barnacle-evm",
        era_reward: "1000000000000000000000",
        bonus_for_new_validator: "0",
      },
      fusotao: {
        rpc_endpoint:
          "wss://gateway.testnet.octopus.network/fusotao/erc8ygm5qvmi2fw23ijpvzgpzzto47mi",
        subql_endpoint: "",
        era_reward: "4109000000000000000000",
        bonus_for_new_validator: "1000000000000000000",
      },
      discovol: {
        rpc_endpoint:
          "wss://gateway.testnet.octopus.network/discovol/o4urcey87y4n1qimhfrad92gzs315z9h",
        subql_endpoint: "",
        era_reward: "5479500000000000000",
        bonus_for_new_validator: "100000000000000",
      },
      myriad: {
        rpc_endpoint:
          "wss://gateway.testnet.octopus.network/myriad/8f543a1c219f14d83c0faedefdd5be6e",
        subql_endpoint:
          "https://api.subquery.network/sq/octopus-appchains/testnet-myriad",
        era_reward: "68493000000000000000000",
        bonus_for_new_validator: "1000000000000000000",
      },
      debionetwork: {
        rpc_endpoint:
          "wss://gateway.testnet.octopus.network/debionetwork/554976cbb180f676f188abe14d63ca24",
        subql_endpoint:
          "https://api.subquery.network/sq/octopus-appchains/testnet-debionetwork",
        era_reward: "6849000000000000000000",
        bonus_for_new_validator: "1000000000000000000",
      },
      atocha: {
        rpc_endpoint:
          "wss://gateway.testnet.octopus.network/atocha/yevqd2d4jhm0dqakaj4hkbyjjfg6ukbu",
        subql_endpoint:
          "https://api.subquery.network/sq/octopus-appchains/testnet-atocha",
        era_reward: "27397000000000000000000",
        bonus_for_new_validator: "1000000000000000000",
      },
      "uniqueone-appchain": {
        rpc_endpoint:
          "wss://gateway.testnet.octopus.network/uniqueone/e83rnqoi4hr65cwx46a83u6a7a970dgq",
        subql_endpoint:
          "https://api.subquery.network/sq/octopus-appchains/testnet-uniqueone",
        era_reward: "9132000000000000000000",
        bonus_for_new_validator: "0",
      },
    };
