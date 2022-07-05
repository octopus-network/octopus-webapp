import { Contract } from "near-api-js"

import {
  StorageDeposit,
  WrappedAppchainToken,
  ValidatorProfile,
  RewardHistory,
  UnbondedHistory,
  StakingHistory,
  BridgeProcessParams,
} from "types"
import { ProtocolSettings } from "./appchain"

type FtBalanceOfArgs = {
  account_id: string
}

type StorageBalanceOfArgs = FtBalanceOfArgs

type FtTransferCallArgs = {
  receiver_id: string
  amount: string
  msg: string
}

type GetDepositForArgs = {
  appchain_id: string
  account_id: string
}

type WithdrawDepositOfArgs = {
  appchain_id: string
  amount: string
}

type GetDelegatorRewardsOfArgs = {
  start_era: string
  end_era: string
  delegator_id: string
  validator_id: string
}

export type AccountId = string
export type Amount = string

export interface WhitelistToken {
  token_id: string
  decimals: number
}

export interface ConversionPool {
  id: number
  in_token: AccountId
  in_token_balance: Amount
  out_token: AccountId
  out_token_balance: Amount
  reversible: boolean
  in_token_rate: number
  out_token_rate: number
  creator: AccountId
}

export class TokenContract extends Contract {
  ft_balance_of(args: FtBalanceOfArgs): Promise<string> {
    return this.ft_balance_of(args)
  }

  storage_balance_of(args: StorageBalanceOfArgs): Promise<StorageDeposit> {
    return this.storage_balance_of(args)
  }

  ft_transfer_call(
    args: FtTransferCallArgs,
    gas: string,
    deposit: number
  ): Promise<void> {
    return this.ft_transfer_call(args, gas, deposit)
  }

  ft_metadata(): Promise<any> {
    return this.ft_metadata()
  }
}

export class RegistryContract extends Contract {
  get_owner(): Promise<string> {
    return this.get_owner()
  }

  get_upvote_deposit_for(args: GetDepositForArgs): Promise<string> {
    return this.get_upvote_deposit_for(args)
  }

  get_downvote_deposit_for(args: GetDepositForArgs): Promise<string> {
    return this.get_downvote_deposit_for(args)
  }

  withdraw_upvote_deposit_of(
    args: WithdrawDepositOfArgs,
    gas: string
  ): Promise<void> {
    return this.withdraw_upvote_deposit_of(args, gas)
  }

  withdraw_downvote_deposit_of(
    args: WithdrawDepositOfArgs,
    gas: string
  ): Promise<void> {
    return this.withdraw_downvote_deposit_of(args, gas)
  }

  get_registry_settings(): Promise<any> {
    return this.get_registry_settings()
  }
}

export class AnchorContract extends Contract {
  enable_delegation(args: {}, gas: string): Promise<void> {
    return this.enable_delegation(args, gas)
  }

  disable_delegation(args: {}, gas: string): Promise<void> {
    return this.disable_delegation(args, gas)
  }

  decrease_stake(args: { amount: string }, gas: string): Promise<void> {
    return this.decrease_stake(args, gas)
  }

  get_protocol_settings(): Promise<ProtocolSettings> {
    return this.get_protocol_settings()
  }

  get_anchor_status(): Promise<any> {
    return this.get_anchor_status()
  }

  get_validator_deposit_of(args: { validator_id: string }): Promise<string> {
    return this.get_validator_deposit_of(args)
  }

  get_delegator_deposit_of(args: {
    delegator_id: string
    validator_id: string
  }): Promise<string> {
    return this.get_delegator_deposit_of(args)
  }

  withdraw_validator_rewards(
    args: { validator_id: string },
    gas: string
  ): Promise<void> {
    return this.withdraw_validator_rewards(args, gas)
  }

  withdraw_delegator_rewards(
    args: { validator_id: string; delegator_id: string },
    gas: string
  ): Promise<void> {
    return this.withdraw_delegator_rewards(args, gas)
  }

  get_wrapped_appchain_token(): Promise<WrappedAppchainToken> {
    return this.get_wrapped_appchain_token()
  }

  get_validator_profile(args: {
    validator_id: string
  }): Promise<ValidatorProfile> {
    return this.get_validator_profile(args)
  }

  unbond_stake(args: {}, gas: string): Promise<void> {
    return this.unbond_stake(args, gas)
  }

  unbond_delegation(
    args: { validator_id: string },
    gas: string
  ): Promise<void> {
    return this.unbond_delegation(args, gas)
  }

  get_unbonded_stakes_of(args: {
    account_id: string
  }): Promise<UnbondedHistory[]> {
    return this.get_unbonded_stakes_of(args)
  }

  withdraw_stake(args: { account_id: string }, gas: string): Promise<void> {
    return this.withdraw_stake(args, gas)
  }

  get_delegator_rewards_of(
    args: GetDelegatorRewardsOfArgs
  ): Promise<RewardHistory[]> {
    return this.get_delegator_rewards_of(args)
  }

  decrease_delegation(
    args: { validator_id: string; amount: string },
    gas: string
  ): Promise<void> {
    return this.decrease_delegation(args, gas)
  }

  burn_wrapped_appchain_token(
    args: { receiver_id: string; amount: string },
    gas: string
  ): Promise<void> {
    return this.burn_wrapped_appchain_token(args, gas)
  }

  process_appchain_messages_with_all_proofs(
    args: BridgeProcessParams,
    gas: string
  ): Promise<void> {
    return this.process_appchain_messages_with_all_proofs(args, gas)
  }

  get_appchain_message_processing_result_of(args: {
    nonce: number
  }): Promise<any> {
    return this.get_appchain_message_processing_result_of(args)
  }

  get_user_staking_histories_of(args: {
    account_id: string
  }): Promise<StakingHistory[]> {
    return this.get_user_staking_histories_of(args)
  }
}

export class ConvertorContract extends Contract {
  get_whitelist(): Promise<WhitelistToken[]> {
    return this.get_whitelist()
  }

  get_pools(args: {
    from_index: number
    limit: number
  }): Promise<ConversionPool[]> {
    return this.get_pools(args)
  }

  create_pool(args: {
    in_token: AccountId
    out_token: AccountId
    is_reversible: boolean
    in_token_rate: number
    out_token_rate: number
  }): Promise<number> {
    return this.create_pool(args)
  }

  get_storage_fee_gap_of(args: { account_id: AccountId }): Promise<number> {
    return this.get_storage_fee_gap_of(args)
  }

  withdraw_token_in_pool(args: {
    pool_id: number
    token_id: AccountId
    amount: string
  }): Promise<void> {
    return this.withdraw_token_in_pool(args)
  }
}

export class CollectibleContract extends Contract {
  nft_tokens_for_owner(
    args: {
      account_id: AccountId;
      from_index: string;
      limit?: string;
    }
  ): Promise<any> {
    return this.nft_tokens_for_owner(args);
  }

  nft_transfer_call(
    args: {
      receiver_id: AccountId;
      token_id: string | null;
      approval_id?: string;
      memo?: string;
      msg: string;
    },
    gas: string,
    deposit: number
  ): Promise<any> {
    return this.nft_transfer_call(args, gas, deposit);
  }
}
