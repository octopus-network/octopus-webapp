import Decimal from 'decimal.js';
import BN from "bn.js";
import {utils} from "near-api-js";

export const T_GAS: Decimal = new Decimal(10 ** 12);
export const SIMPLE_CALL_GAS = T_GAS.mul(50).toString();
export const COMPLEX_CALL_GAS = T_GAS.mul(300).toFixed();

export const FAILED_TO_REDIRECT_MESSAGE = 'Failed to redirect to sign transaction';

export const OCT_TOKEN_DECIMALS = 18;

export const EPOCH_DURATION_MS = 24 * 3600 * 1000;

export class NearGas {
	//TGas as unit,
	// 1TGas = 1e12gas = 0.0001 Ⓝ in 2021/12/3,
	// 1TGas ≈ 1 millisecond of "compute" time
	public static ONE_TERA_GAS = "1000000000000";
	public static MAX_GAS = NearGas.TGas();
	public static FT_STORAGE_DEPOSIT_GAS = NearGas.TGas(20);
	public static WITHDRAW_DELEGATOR_REWARDS_GAS = NearGas.TGas(150);
  
	public static TGas(amount_of_tgas: number = 300): BN {
	  return new BN(this.ONE_TERA_GAS).muln(amount_of_tgas);
	}
  }
  
  
  export class NearAmount {
	public static ONE_YOCTO_NEAR_RAW: string = "0.000000000000000000000001";
	public static NONE_NEAR = NearAmount.yocto_near_amount(0) ;
	public static ONE_YOCTO_NEAR = NearAmount.yocto_near_amount();
	public static FT_DEPOSIT_AMOUNT = NearAmount.near_amount(0.1);
  
	public static yocto_near_amount(amount_of_yocto: number = 1): BN {
	  return new BN(utils.format.parseNearAmount(this.ONE_YOCTO_NEAR_RAW)!).muln(
		amount_of_yocto
	  );
	}
  
	public static near_amount(amount_of_near: number = 1): BN {
	  return new BN(utils.format.parseNearAmount("1")!).muln(amount_of_near);
	}
  } 