import { CloudVendor, NetworkType, NodeState, OCTNetwork } from "types";

export const EMAIL_REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,15})+$/;

export const ANCHOR_METHODS = {
  viewMethods: [
    "get_protocol_settings",
    "get_validator_deposit_of",
    "get_wrapped_appchain_token",
    "get_delegator_deposit_of",
    "get_validator_profile",
    "get_unbonded_stakes_of",
    "get_delegator_rewards_of",
    "get_anchor_status",
    "get_validator_list_of",
    "get_validator_set_info_of",
    "get_user_staking_histories_of",
  ],
  changeMethods: [
    "enable_delegation",
    "disable_delegation",
    "decrease_stake",
    "withdraw_validator_rewards",
    "unbond_stake",
    "withdraw_stake",
    "unbond_delegation",
    "withdraw_delegator_rewards",
    "decrease_delegation",
  ],
};

export const TOKEN_METHODS = {
  viewMethods: [
    "storage_balance_of",
    "ft_balance_of",
    "storage_balance_bounds",
    "ft_metadata",
  ],
  changeMethods: [],
};

export const NODE_STATE_RECORD: Record<NodeState, any> = {
  [NodeState.INIT]: { label: "Init", color: "blue", state: 0 },
  [NodeState.APPLYING]: { label: "Applying", color: "teal", state: 10 },
  [NodeState.APPLY_FAILED]: { label: "Apply Failed", color: "red", state: 11 },
  [NodeState.RUNNING]: { label: "Running", color: "octo-blue", state: 12 },
  [NodeState.DESTROYING]: { label: "Destroying", color: "teal", state: 20 },
  [NodeState.DESTROY_FAILED]: {
    label: "Destroy Failed",
    color: "orange",
    state: 21,
  },
  [NodeState.DESTROYED]: { label: "Destroyed", color: "gray", state: 22 },
  [NodeState.UPGRADING]: { label: "Upgrading", color: "green", state: 30 },
};

export const OAUTH_SCOPE =
  "https://www.googleapis.com/auth/cloud-platform.read-only https://www.googleapis.com/auth/compute";

const INSTANCES: Record<
  string,
  Record<string, Record<string, string> | string>
> = {
  t3: {
    instance_type: "c5.large",
    volume_size: "120",
    type: {
      desc: "ec2 c5.large",
      price: "61.2",
      unit: "m",
    },
    storage: {
      desc: "120GB",
      price: "22",
      unit: "m",
    },
    dataTransfer: {
      desc: "100GB",
      price: "0.09",
      unit: "G",
    },
    hd: {
      cpu: "2 vCPUs",
      ram: "4.0 GiB",
    },
    total: {
      price: "92.2",
      unit: "m",
    },
  },
  t5: {
    instance_type: "c5.large",
    volume_size: "250",
    type: {
      desc: "ec2 c5.large",
      price: "61.2",
      unit: "m",
    },
    storage: {
      desc: "250GB",
      price: "42",
      unit: "m",
    },
    dataTransfer: {
      desc: "4500GB",
      price: "0.09",
      unit: "G",
    },
    hd: {
      cpu: "2 vCPUs",
      ram: "4.0 GiB",
    },
    total: {
      price: "508.2",
      unit: "m",
    },
  },
  "s-4vcpu-8gb": {
    instance_type: "s-4vcpu-8gb",
    volume_size: "120",
    type: {
      desc: "s-4vcpu-8gb",
      price: "48",
      unit: "m",
    },
    storage: {
      desc: "120GB",
      price: "12",
      unit: "m",
    },
    dataTransfer: {
      desc: "100GB",
      price: "0.0",
      unit: "m",
    },
    hd: {
      cpu: "4 vCPUs",
      ram: "8.0 GiB",
    },
    total: {
      price: "60",
      unit: "m",
    },
  },
  "s-4vcpu-8gb-fusotao": {
    instance_type: "s-4vcpu-8gb",
    volume_size: "250",
    type: {
      desc: "s-4vcpu-8gb",
      price: "48",
      unit: "m",
    },
    storage: {
      desc: "250GB",
      price: "25",
      unit: "m",
    },
    dataTransfer: {
      desc: "7TB",
      price: "20",
      unit: "m",
    },
    hd: {
      cpu: "4 vCPUs",
      ram: "8.0 GiB",
    },
    total: {
      price: "93",
      unit: "m",
    },
  },
  "e2-standard-2": {
    instance_type: "e2-standard-2",
    volume_size: "120",
    type: {
      desc: "e2-standard-2",
      price: "49.92",
      unit: "m",
    },
    storage: {
      desc: "120GB",
      price: "20.4",
      unit: "m",
    },
    dataTransfer: {
      desc: "100GB",
      price: "0.11",
      unit: "G",
    },
    hd: {
      cpu: "2 vCPUs",
      ram: "8.0 GiB",
    },
    total: {
      price: "81.32",
      unit: "m",
    },
  },
  "e2-standard-4": {
    instance_type: "e2-standard-2",
    volume_size: "250",
    type: {
      desc: "e2-standard-2",
      price: "49.92",
      unit: "m",
    },
    storage: {
      desc: "250GB",
      price: "42.5",
      unit: "m",
    },
    dataTransfer: {
      desc: "4500GB",
      price: "0.11",
      unit: "G",
    },
    hd: {
      cpu: "2 vCPUs",
      ram: "8.0 GiB",
    },
    total: {
      price: "587.42",
      unit: "m",
    },
  },
};

export const CLOUD_NODE_INSTANCES: Record<string, any> = {
  [OCTNetwork.ATOCHA]: {
    [CloudVendor.AWS]: INSTANCES["t3"],
    [CloudVendor.DO]: INSTANCES["s-4vcpu-8gb"],
    [CloudVendor.GCP]: INSTANCES["e2-standard-2"],
  },
  [OCTNetwork.DEIP]: {
    [CloudVendor.AWS]: INSTANCES["t3"],
    [CloudVendor.DO]: INSTANCES["s-4vcpu-8gb"],
    [CloudVendor.GCP]: INSTANCES["e2-standard-2"],
  },
  [OCTNetwork.DEBIO_NETWORK]: {
    [CloudVendor.AWS]: INSTANCES["t3"],
    [CloudVendor.DO]: INSTANCES["s-4vcpu-8gb"],
    [CloudVendor.GCP]: INSTANCES["e2-standard-2"],
  },
  [OCTNetwork.MYRIAD]: {
    [CloudVendor.AWS]: INSTANCES["t3"],
    [CloudVendor.DO]: INSTANCES["s-4vcpu-8gb"],
    [CloudVendor.GCP]: INSTANCES["e2-standard-2"],
  },
  [OCTNetwork.FUSOTAO]: {
    [CloudVendor.AWS]: INSTANCES["t5"],
    [CloudVendor.DO]: INSTANCES["s-4vcpu-8gb-fusotao"],
    [CloudVendor.GCP]: INSTANCES["e2-standard-4"],
  },
  [OCTNetwork.DISCOVOL]: {
    [CloudVendor.AWS]: INSTANCES["t3"],
    [CloudVendor.DO]: INSTANCES["s-4vcpu-8gb"],
    [CloudVendor.GCP]: INSTANCES["e2-standard-2"],
  },
  [OCTNetwork.BARNANCLE_0918]: {
    [CloudVendor.AWS]: INSTANCES["t3"],
    [CloudVendor.DO]: INSTANCES["s-4vcpu-8gb"],
    [CloudVendor.GCP]: INSTANCES["e2-standard-2"],
  },
};

export const APPCHAIN_TOKEN_PALLET: Record<
  string,
  {
    section: string;
    method: string;
    paramsType: "Tuple" | "Array";
    valueKey: string;
  }
> = {
  default: {
    section: "octopusAssets",
    method: "account",
    paramsType: "Array",
    valueKey: "balance",
  },
  fusotao: {
    section: "token",
    method: "balances",
    paramsType: "Tuple",
    valueKey: "free",
  },
};

export const APPCHAIN_COLLECTIBLE_CLASSES: Record<
  NetworkType,
  Record<string, number[]>
> = {
  testnet: {
    "barnacle-evm": [1],
    barnacle0928: [0],
    "uniqueone-appchain": [0, 1, 2],
  },
  mainnet: {},
};
