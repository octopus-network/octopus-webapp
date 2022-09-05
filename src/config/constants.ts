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

export const NODE_STATE_RECORD: any = {
  "0": { label: "Init", color: "blue", state: 0 },
  "10": { label: "Applying", color: "teal", state: 10 },
  "11": { label: "Apply Failed", color: "red", state: 11 },
  "12": { label: "Running", color: "octo-blue", state: 12 },
  "20": { label: "Destroying", color: "teal", state: 20 },
  "21": { label: "Destroy Failed", color: "orange", state: 21 },
  "22": { label: "Destroyed", color: "gray", state: 22 },
  "30": { label: "Upgrading", color: "green", state: 30 },
}

export const OAUTH_SCOPE =
  "https://www.googleapis.com/auth/cloud-platform.read-only https://www.googleapis.com/auth/compute"
