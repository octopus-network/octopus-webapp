import Decimal from 'decimal.js';

const NETWORK = process.env.REACT_APP_OCT_NETWORK || 'testnet';

export const T_GAS: Decimal = new Decimal(10 ** 12);
export const SIMPLE_CALL_GAS = T_GAS.mul(50).toString();
export const COMPLEX_CALL_GAS = T_GAS.mul(300).toFixed();

export const REGISTRY_CONTRACT_ID = process.env.REACT_APP_OCT_REGISTRY_CONTRACT || 'dev-oct-registry.testnet';
export const OCT_TOKEN_CONTRACT_ID = process.env.REACT_APP_OCT_TOKEN_CONTRACT || 'oct.beta_oct_relay.testnet';

export const octopus = {
  explorerUrl: `https://explorer.${NETWORK}.oct.network`
}