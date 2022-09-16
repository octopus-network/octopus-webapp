import { FungibleTokenMetadata } from "types"

export enum AppchainState {
  Registered = "Registered",
  Auditing = "Auditing",
  Dead = "Dead",
  InQueue = "InQueue",
  Staging = "Staging",
  Booting = "Booting",
  Active = "Active",
}

export enum CloudVendor {
  AWS = "AWS",
  DO = "DO",
}

export type AppchainInfo = {
  appchain_anchor: string
  appchain_id: string
  appchain_metadata: {
    contact_email: string
    description: string
    custom_metadata: Record<string, any>
    function_spec_url: string
    fungible_token_metadata: FungibleTokenMetadata
    github_address: string
    github_release: string
    ido_amount_of_wrapped_appchain_token: string
    initial_era_reward: string
    premined_wrapped_appchain_token: string
    premined_wrapped_appchain_token_beneficiary: string
    initial_supply_of_wrapped_appchain_token: string
    website_url: string
    template_type: "Barnacle" | "BarnacleEvm"
  }
  appchain_owner: string
  appchain_state: AppchainState
  downvote_deposit: string
  go_live_time: string
  register_deposit: string
  registered_time: string
  total_stake: string
  upvote_deposit: string
  validator_count: number
  voting_score: string
  evm_chain_id: string
}

export type IndexRange = {
  start_index: string
  end_index: string
}

export type AnchorStatus = {
  total_stake_in_next_era: string
  validator_count_in_next_era: string
  delegator_count_in_next_era: string
  index_range_of_appchain_notification_history: IndexRange
  index_range_of_validator_set_history: IndexRange
  index_range_of_anchor_event_history: IndexRange
  index_range_of_staking_history: IndexRange
  index_range_of_appchain_message_processing_results: IndexRange
  permissionless_actions_status: {
    switching_era_number: string
    distributing_reward_era_number: string
  }
  asset_transfer_is_paused: boolean
  rewards_withdrawal_is_paused: boolean
}

export type AppchainInfoWithAnchorStatus = AppchainInfo & {
  anchor_status?: AnchorStatus
}

export type RewardHistory = {
  era_number: string
  total_reward: string
  unwithdrawn_reward: string
  expired: boolean
}

export type Validator = {
  validator_id: string
  validator_id_in_appchain: string
  deposit_amount: string
  total_stake: string
  is_unbonding: boolean
  delegators_count: string
  can_be_delegated_to: boolean
}

export type AppchainSettings = {
  rpc_endpoint: string
  subql_endpoint: string
  era_reward: string
}

export type WrappedAppchainToken = {
  metadata: FungibleTokenMetadata
  contract_account: string
  premined_beneficiary: string
  premined_balance: string
  changed_balance: string
  price_in_usd: string
  total_supply: string
}

export type ValidatorSessionKey = {
  babe: string
  beefy: string
  grandpa: string
  imOnline: string
  octopus: string
}

export type ValidatorProfile = {
  profile: {
    email: string
    socialMediaHandle: string
  }
  validator_id_in_appchain: string
}

export type Delegator = {
  delegator_id: string
  delegation_amount: string
}

export type UnbondedHistory = {
  era_number: string
  amount: string
  unlock_time: string
}

export type TokenAsset = {
  contractId: string
  assetId?: number
  metadata: Omit<FungibleTokenMetadata, "decimals"> & {
    decimals: number | [number, number]
  }
}

export type Collectible = {
  id: string
  class: string
  owner: string
  metadata: {
    name: string
    mediaUri: string
  }
}

export enum BridgeHistoryStatus {
  Pending,
  Succeed,
  Failed,
}

export type BridgeHistory = {
  isAppchainSide: boolean
  appchainId: string
  hash: string
  sequenceId: number
  fromAccount: string
  toAccount: string
  amount: string
  status: BridgeHistoryStatus
  timestamp: number
  message?: string
  tokenContractId: string
  isEvm?: boolean
}

export type StakingFact = {
  StakeIncreased?: {
    amount: string
    validator_id: string
  }
  StakeDecreased?: {
    amount: string
    validator_id: string
  }
  DelegationIncreased?: {
    amount: string
    delegator_id: string
    validator_id: string
  }
  DelegationDecreased?: {
    amount: string
    delegator_id: string
    validator_id: string
  }
  DelegatorRegistered?: {
    amount: string
    delegator_id: string
    validator_id: string
  }
  ValidatorRegistered?: {
    amount: string
    can_be_delegated_to: boolean
    validator_id: string
    validator_id_in_appchain: string
  }
  ValidatorDelegationEnabled?: {
    validator_id: string
    amount: string
  }
}

export type StakingHistory = {
  block_height: number
  has_taken_effect: boolean
  staking_fact: StakingFact
  timestamp: number
}

export type UserVotes = {
  downvotes: string
  upvotes: string
}

export type ProtocolSettings = {
  minimum_validator_deposit: string
  minimum_validator_deposit_changing_amount: string
  maximum_validator_stake_percent: number
  minimum_delegator_deposit: string
  minimum_delegator_deposit_changing_amount: string
  minimum_total_stake_price_for_booting: string
  maximum_market_value_percent_of_near_fungible_tokens: number
  maximum_market_value_percent_of_wrapped_appchain_token: number
  minimum_validator_count: string
  maximum_validator_count: string
  maximum_validators_per_delegator: string
  unlock_period_of_validator_deposit: string
  unlock_period_of_delegator_deposit: string
  maximum_era_count_of_unwithdrawn_reward: string
  maximum_era_count_of_valid_appchain_message: string
  validator_commission_percent: number
  maximum_allowed_unprofitable_era_count: number
}

export interface NodeDetail {
  instance: {
    ip: string
    user: string
    ssh_key: string
  }
  state: string
  sync: boolean
  task: {
    chain_spec: string
    cloud_vendor: string
    volume_type: string
    availability_zones: string[]
    instance_count: string
    instance_type: string
    name: string
    project: string
    region: string
    telemetry_url: string
    volume_size: string
  }
  user: string
  uuid: string
  skey: string
}

export enum NodeState {
  INIT = "0",
  APPLYING = "10",
  APPLY_FAILED = "11",
  RUNNING = "12",
  DESTROYING = "20",
  DESTROY_FAILED = "21",
  DESTROYED = "22",
  UPGRADING = "30",
}

export interface NodeMetric {
  memory: {
    avail: number
    buff: number
    cache: number
    free: number
    percentage: number
    total: number
    used: number
  }
  filesystem: {
    avail: number
    percentage: number
    total: number
  }
  cpu: {
    hi: number
    id: number
    ni: number
    percentage: number
    si: number
    st: number
    sy: number
    us: number
    wa: number
  }[]
}

export enum ValidatorStatus {
  Registered = "Registered",
  New = "New",
  Validating = "Validating",
  Validating_N_Not_Producing = "Validating_N_Not_Producing",
  Unstaking = "Unstaking",
}
