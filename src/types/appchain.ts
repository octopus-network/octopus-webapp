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