import Decimal from "decimal.js";
import { OCT_TOKEN_DECIMALS } from "primitives";
import { AnchorContract, AppchainInfoWithAnchorStatus, Validator } from "types";
import { DecimalUtil } from "./decimal";

export const validateValidatorStake = async (anchor: AnchorContract, depositAmount: Decimal, type: 'IncreaseStake' | 'IncreaseDelegation', validator?: Validator, appchain?: AppchainInfoWithAnchorStatus) => {
  try {
    const protocolSettings = await anchor.get_protocol_settings();
    
    if (type === 'IncreaseDelegation' && validator && appchain) {
      if (depositAmount.lessThanOrEqualTo(DecimalUtil.fromString(protocolSettings.minimum_delegator_deposit_changing_amount))) {
        throw new Error(`The deposit of the validator is too few, the minimum deposit is ${DecimalUtil.fromString(protocolSettings.minimum_delegator_deposit_changing_amount, OCT_TOKEN_DECIMALS)} OCT.`);
      }

      const maximumAllowedDeposit = DecimalUtil.fromString(appchain.total_stake).mul(protocolSettings.maximum_validator_stake_percent).div(100)
      const validatorTotalStake = DecimalUtil.fromString(validator.total_stake).add(depositAmount);
      if (validatorTotalStake.greaterThan(maximumAllowedDeposit)) {
        throw new Error("The total stake of the validator is too much.");
      }
    } else {
      if (depositAmount.lessThanOrEqualTo(DecimalUtil.fromString(protocolSettings.minimum_validator_deposit_changing_amount))) {
        throw new Error(`The deposit of the validator is too few, the minimum deposit is ${DecimalUtil.fromString(protocolSettings.minimum_validator_deposit_changing_amount, OCT_TOKEN_DECIMALS)} OCT.`);
      }
    }
  } catch (error) {
    throw error;
  }
}