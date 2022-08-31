import Decimal from "decimal.js"
import { OCT_TOKEN_DECIMALS } from "primitives"
import { AnchorContract, Validator } from "types"
import { DecimalUtil } from "./decimal"

export const getStakeLimit = async ({
  type,
  validatorId,
  anchor,
  octBalance,
}: {
  type: "increase" | "decrease"
  validatorId: string
  anchor: AnchorContract
  octBalance: Decimal
}) => {
  try {
    const protocolSettings = await anchor.get_protocol_settings()
    const step = DecimalUtil.fromString(
      protocolSettings.minimum_validator_deposit_changing_amount,
      OCT_TOKEN_DECIMALS
    ).toNumber()
    const vs = await anchor.get_validator_list_of()
    const v = vs.find((v: Validator) => v.validator_id === validatorId)

    if (type === "increase") {
      const anchorStatus = await anchor.get_anchor_status()
      const validatorSetInfo = await anchor.get_validator_set_info_of({
        era_number: anchorStatus.index_range_of_validator_set_history.end_index,
      })

      const maximumAllowedIncreased = new Decimal(validatorSetInfo.total_stake)
        .mul(protocolSettings.maximum_validator_stake_percent)
        .div(100)
        .minus(v.total_stake)

      const max = Math.min(
        Math.floor(
          DecimalUtil.shift(
            maximumAllowedIncreased,
            OCT_TOKEN_DECIMALS
          ).toNumber()
        ),
        octBalance.toNumber()
      )

      return {
        max,
        min: step,
      }
    } else {
      const maximumAllowedDecreased = new Decimal(v.deposit_amount).minus(
        protocolSettings.minimum_validator_deposit
      )

      const max = Math.floor(
        DecimalUtil.shift(
          maximumAllowedDecreased,
          OCT_TOKEN_DECIMALS
        ).toNumber()
      )

      return {
        max,
        min: step,
      }
    }
  } catch (error) {}

  return {
    min: 0,
    max: 0,
  }
}

export const getDelegateLimit = async ({
  type,
  validatorId,
  anchor,
  octBalance,
  deposited,
}: {
  type: "increase" | "decrease"
  validatorId: string
  anchor: AnchorContract
  octBalance: Decimal
  deposited: Decimal
}) => {
  try {
    const protocolSettings = await anchor.get_protocol_settings()

    const step = DecimalUtil.fromString(
      protocolSettings.minimum_delegator_deposit_changing_amount,
      OCT_TOKEN_DECIMALS
    ).toNumber()

    if (type === "increase") {
      const vs = await anchor.get_validator_list_of()
      const v = vs.find((v: Validator) => v.validator_id === validatorId)

      const anchorStatus = await anchor.get_anchor_status()
      const validatorSetInfo = await anchor.get_validator_set_info_of({
        era_number: anchorStatus.index_range_of_validator_set_history.end_index,
      })

      const maximumAllowedIncreased = new Decimal(validatorSetInfo.total_stake)
        .mul(protocolSettings.maximum_validator_stake_percent)
        .div(100)
        .minus(v.total_stake)

      const max = Math.min(
        Math.floor(
          DecimalUtil.shift(
            maximumAllowedIncreased,
            OCT_TOKEN_DECIMALS
          ).toNumber()
        ),
        octBalance.toNumber()
      )

      let min = step
      if (deposited.eq(0)) {
        min = DecimalUtil.fromString(
          protocolSettings.minimum_delegator_deposit,
          OCT_TOKEN_DECIMALS
        ).toNumber()
      }

      return {
        max,
        min,
      }
    } else {
      const minimumDelegatorDeposit = DecimalUtil.fromString(
        protocolSettings.minimum_delegator_deposit,
        OCT_TOKEN_DECIMALS
      ).toNumber()

      let min = 0
      if (deposited.toNumber() > minimumDelegatorDeposit + step) {
        min = step
      }
      const max = deposited.toNumber() - minimumDelegatorDeposit
      return {
        max: max > 0 ? max : 0,
        min,
      }
    }
  } catch (error) {}

  return {
    min: 0,
    max: 0,
  }
}
