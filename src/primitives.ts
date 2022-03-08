import Decimal from 'decimal.js';

export const T_GAS: Decimal = new Decimal(10 ** 12);
export const SIMPLE_CALL_GAS = T_GAS.mul(50).toString();
export const COMPLEX_CALL_GAS = T_GAS.mul(200).toFixed();

export const FAILED_TO_REDIRECT_MESSAGE = 'Failed to redirect to sign transaction';

export const OCT_TOKEN_DECIMALS = 18;

export const EPOCH_DURATION_MS = 24 * 3600 * 1000;