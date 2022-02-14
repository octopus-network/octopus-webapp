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

export function beautify(str = ''): string {
  const reg = str.indexOf('.') > -1 ? /(\d)(?=(\d{3})+\.)/g : /(\d)(?=(?:\d{3})+$)/g;
  str = str.replace(reg, '$1,');
  return str.replace(/(\.[0-9]+[1-9]+)(0)*/, '$1');
}

export function sleep(ts = 1000) {
  return new Promise((resolve) => setTimeout(() => resolve(0), ts));
}

export function getAuthKey(appchainId: string, networkId: string, cloudVendor: string, accessKey: string) {
  return `appchain-${appchainId}-network-${networkId}-cloud-${cloudVendor}-${accessKey}`;
}