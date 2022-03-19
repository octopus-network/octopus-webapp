import {
  FungibleTokenMetadata
} from 'types';

export enum AppchainState {
  Registered = 'Registered',
  Auditing = 'Auditing',
  Dead = 'Dead',
  InQueue = 'InQueue',
  Staging = 'Staging',
  Booting = 'Booting',
  Active = 'Active'
}

export type AppchainInfo = {
  appchain_anchor: string;
  appchain_id: string;
  appchain_metadata: {
    contact_email: string;
    custom_metadata: Record<string, any>;
    function_spec_url: string;
    fungible_token_metadata: FungibleTokenMetadata;
    github_address: string;
    github_release: string;
    ido_amount_of_wrapped_appchain_token: string;
    initial_era_reward: string;
    premined_wrapped_appchain_token: string;
    premined_wrapped_appchain_token_beneficiary: string;
    initial_supply_of_wrapped_appchain_token: string;
    website_url: string;
  },
  appchain_owner: string;
  appchain_state: AppchainState;
  downvote_deposit: string;
  go_live_time: string;
  register_deposit: string;
  registered_time: string;
  total_stake: string;
  upvote_deposit: string;
  validator_count: number;
  voting_score: string;
}

export type IndexRange = {
  start_index: string;
  end_index: string;
}

export type AnchorStatus = {
  total_stake_in_next_era: string;
  validator_count_in_next_era: string;
  delegator_count_in_next_era: string;
  index_range_of_appchain_notification_history: IndexRange;
  index_range_of_validator_set_history: IndexRange;
  index_range_of_anchor_event_history: IndexRange,
  index_range_of_staking_history: IndexRange,
  index_range_of_appchain_message_processing_results: IndexRange,
  permissionless_actions_status: {
    switching_era_number: string;
    distributing_reward_era_number: string;
  };
  asset_transfer_is_paused: boolean;
  rewards_withdrawal_is_paused: boolean;
}

export type AppchainInfoWithAnchorStatus = AppchainInfo & {
  anchor_status?: AnchorStatus;
}

export type RewardHistory = {
  era_number: string;
  total_reward: string;
  unwithdrawn_reward: string;
}

export type Validator = {
  validator_id: string;
  validator_id_in_appchain: string;
  deposit_amount: string;
  total_stake: string;
  is_unbonding: boolean;
  delegators_count: string;
  can_be_delegated_to: boolean;
}

export type AppchainSettings = {
  rpc_endpoint: string;
  subql_endpoint: string;
  era_reward: string;
}

export type WrappedAppchainToken = {
  metadata: FungibleTokenMetadata;
  contract_account: string;
  premined_beneficiary: string;
  premined_balance: string;
  changed_balance: string;
  price_in_usd: string;
  total_supply: string;
}

export type ValidatorSessionKey = {
  babe: string;
  beefy: string;
  grandpa: string;
  imOnline: string;
  octopus: string;
}

export type ValidatorProfile = {
  profile: {
    email: string;
    socialMediaHandle: string;
  },
  validator_id_in_appchain: string;
}

export type Delegator = {
  delegator_id: string;
  delegation_amount: string;
}

export type UnbondedHistory = {
  era_number: string;
  amount: string;
  unlock_time: string;
}

export type TokenAsset = {
  contractId: string;
  assetId?: number;
  metadata: Omit<FungibleTokenMetadata, 'decimals'> & {
    decimals: number | [number, number]
  };
}

export enum BridgeHistoryStatus {
  Pending,
  Succeed,
  Failed
}

export type BridgeHistory = {
  isAppchainSide: boolean;
  appchainId: string;
  hash: string;
  sequenceId: number;
  fromAccount: string;
  toAccount: string;
  amount: string;
  status: BridgeHistoryStatus;
  timestamp: number;
  message?: string;
  tokenContractId: string;
}

export type StakingFact = {
  'StakeIncreased'?: {
    amount: string;
    validator_id: string;
  },
  'StakeDecreased'?: {
    amount: string;
    validator_id: string;
  },
  'DelegationIncreased'?: {
    amount: string;
    delegator_id: string;
    validator_id: string;
  },
  'DelegationDecreased'?: {
    amount: string;
    delegator_id: string;
    validator_id: string;
  },
  'DelegatorRegistered'?: {
    amount: string;
    delegator_id: string;
    validator_id: string;
  },
  'ValidatorRegistered'?: {
    amount: string;
    can_be_delegated_to: boolean;
    validator_id: string;
    validator_id_in_appchain: string;
  },
  'ValidatorDelegationEnabled'?: {
    validator_id: string;
    amount: string;
  }
}

export type StakingHistory = {
  block_height: number;
  has_taken_effect: boolean;
  staking_fact: StakingFact;
  timestamp: number;
}

export type UserVotes = {
  downvotes: string;
  upvotes: string;
}