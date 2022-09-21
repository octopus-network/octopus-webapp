import { CloudVendor, NodeState, OCTNetwork } from "types"

export const EMAIL_REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,15})+$/

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
}

export const TOKEN_METHODS = {
  viewMethods: [
    "storage_balance_of",
    "ft_balance_of",
    "storage_balance_bounds",
    "ft_metadata",
  ],
  changeMethods: [],
}

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
}

export const OAUTH_SCOPE =
  "https://www.googleapis.com/auth/cloud-platform.read-only https://www.googleapis.com/auth/compute"

const INSTANCES: Record<
  string,
  Record<string, Record<string, string> | string>
> = {
  t3: {
    instance_type: "t3.small",
    volume_size: "120",
    type: {
      desc: "ec2 t3.small",
      price: "14.4",
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
      ram: "2.0 GiB",
    },
    total: {
      price: "45",
      unit: "m",
    },
  },
  t5: {
    instance_type: "c3.large",
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
      price: "509",
      unit: "m",
    },
  },
  "s-2vcpu-2gb-intel": {
    instance_type: "s-2vcpu-2gb-intel",
    volume_size: "120",
    type: {
      desc: "s-2vcpu-2gb-intel",
      price: "21",
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
      unit: "G",
    },
    hd: {
      cpu: "2 vCPUs",
      ram: "2.0 GiB",
    },
    total: {
      price: "33",
      unit: "m",
    },
  },
  "s-4vcpu-8gb-intel": {
    instance_type: "s-4vcpu-8gb-intel",
    volume_size: "250",
    type: {
      desc: "s-4vcpu-8gb-intel",
      price: "28",
      unit: "m",
    },
    storage: {
      desc: "500GB",
      price: "25",
      unit: "m",
    },
    dataTransfer: {
      desc: "4500GB",
      price: "0.0",
      unit: "G",
    },
    hd: {
      cpu: "2 vCPUs",
      ram: "4.0 GiB",
    },
    total: {
      price: "81",
      unit: "m",
    },
  },
}

export const CLOUD_NODE_INSTANCES: Record<string, any> = {
  [OCTNetwork.ATOCHA]: {
    [CloudVendor.AWS]: INSTANCES["t3"],
    [CloudVendor.DO]: INSTANCES["s-2vcpu-2gb-intel"],
  },
  [OCTNetwork.DEIP]: {
    [CloudVendor.AWS]: INSTANCES["t3"],
    [CloudVendor.DO]: INSTANCES["s-2vcpu-2gb-intel"],
  },
  [OCTNetwork.DEBIO_NETWORK]: {
    [CloudVendor.AWS]: INSTANCES["t3"],
    [CloudVendor.DO]: INSTANCES["s-2vcpu-2gb-intel"],
  },
  [OCTNetwork.MYRIAD]: {
    [CloudVendor.AWS]: INSTANCES["t3"],
    [CloudVendor.DO]: INSTANCES["s-2vcpu-2gb-intel"],
  },
  [OCTNetwork.FUSOTAO]: {
    [CloudVendor.AWS]: INSTANCES["t5"],
    [CloudVendor.DO]: INSTANCES["s-4vcpu-8gb-intel"],
  },
  [OCTNetwork.DISCOVOL]: {
    [CloudVendor.AWS]: INSTANCES["t3"],
    [CloudVendor.DO]: INSTANCES["s-2vcpu-2gb-intel"],
  },
  [OCTNetwork.BARNANCLE_0918]: {
    [CloudVendor.AWS]: INSTANCES["t3"],
    [CloudVendor.DO]: INSTANCES["s-2vcpu-2gb-intel"],
  },
}
