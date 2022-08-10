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
  viewMethods: ["storage_balance_of", "ft_balance_of"],
  changeMethods: [],
}
