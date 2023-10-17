import { encodeAddress } from "@polkadot/util-crypto";
import { AppchainInfo } from "types";

export const formatAppChainAddress = (
  addr: string | undefined,
  appchain: AppchainInfo | undefined
) => {
  if (!addr || !appchain) {
    return "";
  }

  if (
    appchain?.appchain_metadata.appchain_type !== "Cosmos" &&
    appchain?.appchain_metadata.appchain_type?.Substrate === "BarnacleEvm"
  ) {
    return addr;
  }
  try {
    return encodeAddress(addr);
  } catch (err) {}
  return addr;
};

export const formatNearAddress = (addr: string) => {
  if (addr.includes(".")) {
    return addr;
  }
  return addr.substring(0, 6) + "..." + addr.substring(60);
};
