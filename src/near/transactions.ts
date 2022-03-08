import { Action, functionCall, createTransaction } from "near-api-js/lib/transaction";
import { NearAmount, NearGas } from "../primitives";
import { baseDecode } from "borsh";
import { PublicKey } from "near-api-js/lib/utils";
import { GlobalVars } from "../stores/global";

let wallet = GlobalVars.global_wallet;
console.log("wallet in transaction", wallet)

type AccountId = string;

export interface NearTransactionInfo {
	receiverId: string;
	actions: Action[];
}

export class NearTransaction {
	private transaction_infos: NearTransactionInfo[] = [];

	constructor() {
	}

	private async createTransaction({
		receiverId,
		actions,
		nonceOffset = 1,
	}: {
		receiverId: string;
		actions: Action[];
		nonceOffset?: number;
	}) {
		let account = wallet.account();
		let localKey = await account.connection.signer.getPublicKey(
			account.accountId, account.connection.networkId);
		let accessKey = await account.accessKeyForTransaction(receiverId, actions, localKey);
		if (!accessKey) {
			throw new Error(
				`Cannot find matching key for transaction sent to ${receiverId}`
			);
		}

		const block = await account.connection.provider.block({ finality: "final" });
		const blockHash = baseDecode(block.header.hash);

		const publicKey = PublicKey.from(accessKey.public_key);
		const nonce = accessKey.access_key.nonce + nonceOffset

		return createTransaction(
			account.accountId,
			publicKey,
			receiverId,
			nonce,
			actions,
			blockHash
		);
	}

	public add_action(receiver_id: AccountId, action_factory: NearActionFactory) {
		this.transaction_infos.push({ receiverId: receiver_id, actions: [action_factory.action] })
	}

	public add_actions(receiver_id: AccountId, action_factory: NearActionFactory[]) {
		this.transaction_infos.push({ receiverId: receiver_id, actions: action_factory.map(e => e.action) })
	}

	public add_transaction(transaction: NearTransactionFactory): NearTransaction {
		transaction.transactionInfos.forEach(e => this.transaction_infos.push(e))
		return this;
	}

	public async execute(callback_url?: string): Promise<void> {
		let transactions = await Promise.all(
			this.transaction_infos.map((ts) =>
				this.createTransaction({
					actions: ts.actions,
					receiverId: ts.receiverId,
				})
			)
		);

		return wallet.requestSignTransactions({ transactions: transactions, callbackUrl: callback_url })
	}

}


export interface FTStorageBalance {
	total: string;
	available: string;
}
export function ftGetStorageBalance(
	tokenId: AccountId,
	accountId: AccountId = wallet.getAccountId()): Promise<FTStorageBalance | null> {
	return wallet.account().viewFunction(
		tokenId,
		"storage_balance_of",
		{ account_id: accountId }
	)
}

export class NearTransactionFactory {
	private readonly _transactionInfos: NearTransactionInfo[];
	public get transactionInfos() { return this._transactionInfos }
	constructor(transactionInfos: NearTransactionInfo[]) {
		this._transactionInfos = transactionInfos
	}

	public static async appchain_reward_claim_transactions(
		token_id: AccountId,
		anchor_contract_id: AccountId,
		validator_id: AccountId,
		delegator_id: AccountId | null = null,
	): Promise<NearTransactionFactory> {

		let depositBalance = await ftGetStorageBalance(token_id)

		let transactionInfos: NearTransactionInfo[] = [];
		if (!depositBalance || depositBalance.total === "0") {
			transactionInfos.push({
				receiverId: token_id,
				actions: [NearActionFactory.ft_storage_deposit_action().action]
			})
		}
		transactionInfos.push({
			receiverId: anchor_contract_id,
			actions: [NearActionFactory.withdraw_rewards_action(validator_id, delegator_id).action]
		})
		return new NearTransactionFactory(transactionInfos);
	}
}

export class NearActionFactory {
	private readonly _action: Action;
	public get action() {
		return this._action
	}

	constructor(action: Action) {
		this._action = action
	}

	public static withdraw_rewards_action(
		validator_id: AccountId,
		delegator_id: AccountId | null
	): NearActionFactory {
		return new NearActionFactory(
			functionCall(
				delegator_id?"withdraw_delegator_rewards":"withdraw_validator_rewards",
				delegator_id?
				{delegator_id: delegator_id,validator_id: validator_id}:
				{validator_id: validator_id},
				NearGas.WITHDRAW_DELEGATOR_REWARDS_GAS,
				NearAmount.NONE_NEAR
			)
		)
	}

	public static ft_storage_deposit_action(
		account_id: AccountId = wallet.getAccountId(),
		registrationOnly = false
	): NearActionFactory {
		return new NearActionFactory(functionCall(
			"storage_deposit",
			{
				account_id: account_id,
				registration_only: registrationOnly,
			},
			NearGas.FT_STORAGE_DEPOSIT_GAS,
			NearAmount.FT_DEPOSIT_AMOUNT
		));
	}
}