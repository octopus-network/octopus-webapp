import { Contract } from 'near-api-js';

import { 
  StorageDeposit, 
  WrappedAppchainToken 
} from 'types';

type FtBalanceOfArgs = {
  account_id: string
}

type StorageBalanceOfArgs = FtBalanceOfArgs;

type FtTransferCallArgs = {
  receiver_id: string;
  amount: string;
  msg: string;
}

type GetDepositForArgs = {
  appchain_id: string;
  account_id: string;
}

type WithdrawDepositOfArgs = {
  appchain_id: string;
  amount: string;
}

export class TokenContract extends Contract {
 
  ft_balance_of(args: FtBalanceOfArgs): Promise<string> {
    return this.ft_balance_of(args);
  };

  storage_balance_of(args: StorageBalanceOfArgs): Promise<StorageDeposit> {
    return this.storage_balance_of(args);
  };

  ft_transfer_call(args: FtTransferCallArgs, gas: string, deposit: number): Promise<void> {
    return this.ft_transfer_call(args, gas, deposit);
  };
}

export class RegistryContract extends Contract {
  get_owner(): Promise<string> {
    return this.get_owner();
  }

  get_upvote_deposit_for(args: GetDepositForArgs): Promise<string> {
    return this.get_upvote_deposit_for(args);
  }

  get_downvote_deposit_for(args: GetDepositForArgs): Promise<string> {
    return this.get_downvote_deposit_for(args);
  }

  withdraw_upvote_deposit_of(args: WithdrawDepositOfArgs, gas: string): Promise<void> {
    return this.withdraw_upvote_deposit_of(args, gas);
  }

  withdraw_downvote_deposit_of(args: WithdrawDepositOfArgs, gas: string): Promise<void> {
    return this.withdraw_downvote_deposit_of(args, gas);
  }

}


export class AnchorContract extends Contract {
  enable_delegation(args: {}, gas: string): Promise<void> {
    return this.enable_delegation(args, gas);
  }

  disable_delegation(args: {}, gas: string): Promise<void> {
    return this.disable_delegation(args, gas);
  }

  decrease_stake(args: { amount: string }, gas: string): Promise<void> {
    return this.decrease_stake(args, gas);
  }

  get_protocol_settings(): Promise<any> {
    return this.get_protocol_settings();
  }

  get_validator_deposit_of(args: { validator_id: string }): Promise<string> {
    return this.get_validator_deposit_of(args);
  } 

  get_delegator_deposit_of(args: { delegator_id: string, validator_id: string }): Promise<string> {
    return this.get_delegator_deposit_of(args);
  } 

  withdraw_validator_rewards(args: { validator_id: string }, gas: string): Promise<void> {
    return this.withdraw_validator_rewards(args, gas);
  }

  get_wrapped_appchain_token(): Promise<WrappedAppchainToken> {
    return this.get_wrapped_appchain_token();
  }
}