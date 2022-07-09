import { isHex, hexToString } from '@polkadot/util';
import { DetectCodec } from '@polkadot/types/types';

export const toShortAddress = (address: string, maxLength = 24) => {
  const tmpArr = address.split('.');
  const halfLength = Math.floor(maxLength / 2);
  const realAccount = tmpArr[0];
  if (realAccount.length <= maxLength) {
    return address;
  }
  return realAccount.substr(0, halfLength) + '...' + realAccount.substr(-halfLength) + (tmpArr[1] ? '.' + tmpArr[1] :  '');
}

export function isNumber(value: any) {
  const reg = /^[0-9]+\.?[0-9]*$/;
  return reg.test(value);
}

export function beautify(str = '', trim = true): string {
  const reg = str.indexOf('.') > -1 ? /(\d)(?=(\d{3})+\.)/g : /(\d)(?=(?:\d{3})+$)/g;
  str = str.replace(reg, '$1,');
  return trim ? str.replace(/(\.[0-9]*[1-9]+)(0)*/, '$1') : str;
}

export function sleep(ts = 1000) {
  return new Promise((resolve) => setTimeout(() => resolve(0), ts));
}

export function toValidUrl(url: string | undefined) {
  if (!url) {
    return 'https://www.oct.network';
  }
  if (!/^http(s)?/.test(url)) {
    return `https://${url}`;
  }
  return url;
}

export function decodeNearAccount(address: string) {
  if (isHex(address)) {
    return hexToString(address);
  } else {
    return address;
  }
}

export function toNumArray(data: DetectCodec<any, any>): number[] {
  if (typeof data === 'string') {
    return hexStringToNumArray(data);
  } else {
    return hexStringToNumArray(data.toString());
  }
}

function hexStringToNumArray(hex: string): number[] {
  const hexString = hex.slice(0, 2) === "0x" ? hex.slice(2) : hex;
  return Array.from(Buffer.from(hexString, "hex"));
}