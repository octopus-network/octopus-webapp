import Decimal from 'decimal.js'
import { parseNearAmount } from 'near-api-js/lib/utils/format'

export const T_GAS: Decimal = new Decimal(10 ** 12)
export const SIMPLE_CALL_GAS = T_GAS.mul(50).toString()
export const COMPLEX_CALL_GAS = T_GAS.mul(200).toFixed()

export const FAILED_TO_REDIRECT_MESSAGE =
  'Failed to redirect to sign transaction'

export const OCT_TOKEN_DECIMALS = 18

export const EPOCH_DURATION_MS = 24 * 3600 * 1000

export const FT_MINIMUM_STORAGE_BALANCE = parseNearAmount('0.00125')
