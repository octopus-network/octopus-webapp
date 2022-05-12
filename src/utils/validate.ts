import Decimal from 'decimal.js'
import { OCT_TOKEN_DECIMALS } from 'primitives'
import { AnchorContract, AppchainInfoWithAnchorStatus, Validator } from 'types'
import { DecimalUtil } from './decimal'

export const validateValidatorStake = async (
  anchor: AnchorContract,
  depositAmount: Decimal,
  type:
    | 'IncreaseStake'
    | 'IncreaseDelegation'
    | 'DecreaseStake'
    | 'DecreaseDelegation',
  validator?: Validator,
  appchain?: AppchainInfoWithAnchorStatus
) => {
  try {
    const protocolSettings = await anchor.get_protocol_settings()

    if (['IncreaseDelegation', 'DecreaseDelegation'].includes(type)) {
      if (
        depositAmount.lessThanOrEqualTo(
          DecimalUtil.fromString(
            protocolSettings.minimum_delegator_deposit_changing_amount
          )
        )
      ) {
        throw new Error(
          `The deposit of the validator is too few, the minimum deposit is ${DecimalUtil.fromString(
            protocolSettings.minimum_delegator_deposit_changing_amount,
            OCT_TOKEN_DECIMALS
          )} OCT.`
        )
      }
    } else if (['IncreaseStake', 'DecreaseStake'].includes(type)) {
      if (
        depositAmount.lessThanOrEqualTo(
          DecimalUtil.fromString(
            protocolSettings.minimum_validator_deposit_changing_amount
          )
        )
      ) {
        throw new Error(
          `The deposit of the validator is too few, the minimum deposit is ${DecimalUtil.fromString(
            protocolSettings.minimum_validator_deposit_changing_amount,
            OCT_TOKEN_DECIMALS
          )} OCT.`
        )
      }
    }

    if (
      ['IncreaseDelegation', 'IncreaseStake'].includes(type) &&
      validator &&
      appchain
    ) {
      const maximumAllowedDeposit = DecimalUtil.fromString(appchain.total_stake)
        .mul(protocolSettings.maximum_validator_stake_percent)
        .div(100)
      const validatorTotalStake = DecimalUtil.fromString(
        validator.total_stake
      ).add(depositAmount)
      if (validatorTotalStake.greaterThan(maximumAllowedDeposit)) {
        throw new Error('The total stake of the validator is too much.')
      }
    }
  } catch (error) {
    throw error
  }
}

export const isValidNumber = (value: string, max: string): boolean => {
  if (value.trim() === '' || value.trim() === '0') {
    return false
  }
  const reg = /^-?\d*\.?\d*$/
  const isValid = reg.test(value)
  if (max === undefined) {
    return isValid
  }
  return isValid && Number(value) <= Number(max)
}
