import Decimal from "decimal.js";
import BN from "bn.js";

import { beautify } from "../utils";
import { OCT_TOKEN_DECIMALS } from "primitives";

export const ZERO_DECIMAL = new Decimal(0);
export const ONE_DECIMAL = new Decimal(1);
export const ONE_HUNDRED_DECIMAL = new Decimal(100);

export class DecimalUtil {
  public static fromString(input: string | undefined, shift = 0): Decimal {
    if (!input) {
      return ZERO_DECIMAL;
    }
    return new Decimal(input || 0).div(new Decimal(10).pow(shift));
  }

  public static fromNumber(input: number, shift = 0): Decimal {
    return new Decimal(input).div(new Decimal(10).pow(shift));
  }

  public static fromValue(
    input: string | number | undefined | Decimal,
    shift = 0
  ): Decimal {
    if (!input) {
      return ZERO_DECIMAL;
    }
    return new Decimal(input).div(new Decimal(10).pow(shift));
  }

  public static fromU64(input: BN, shift = 0): Decimal {
    return new Decimal(input.toString()).div(new Decimal(10).pow(shift));
  }

  public static toU64(input: Decimal, shift = 0): BN {
    if (input.isNeg()) {
      throw new Error(
        `Negative decimal value ${input} cannot be converted to u64.`
      );
    }

    const shiftedValue = new BN(
      input.mul(new Decimal(10).pow(new Decimal(shift))).toFixed()
    );
    return shiftedValue;
  }

  public static shift(
    input: Decimal | number | string | undefined,
    shift = 0
  ): Decimal {
    return new Decimal(input || 0).div(new Decimal(10).pow(new Decimal(shift)));
  }

  public static power(
    input: Decimal | number | string | undefined,
    shift = 0
  ): Decimal {
    return new Decimal(input || 0).mul(new Decimal(10).pow(new Decimal(shift)));
  }

  public static beautify(input: Decimal, fixed?: number, trim = true): string {
    if (fixed === undefined) {
      fixed = input.eq(ZERO_DECIMAL)
        ? 2
        : input.gt(ZERO_DECIMAL) && input.lt(ONE_DECIMAL)
        ? 6
        : input.gt(ONE_DECIMAL) && input.lt(ONE_HUNDRED_DECIMAL)
        ? 3
        : 2;
    }

    const str = input.toFixed(fixed, Decimal.ROUND_DOWN);
    return beautify(str, trim);
  }

  public static formatAmount(
    input: string | number | undefined | Decimal,
    decimals = OCT_TOKEN_DECIMALS,
    fixed = 0
  ): string {
    return DecimalUtil.beautify(DecimalUtil.fromValue(input, decimals), fixed);
  }
}
