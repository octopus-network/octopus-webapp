import { Contract } from 'near-api-js';

import { StorageDeposit } from 'types';

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