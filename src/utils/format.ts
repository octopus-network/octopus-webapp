import { encodeAddress } from "@polkadot/util-crypto"
import { AppchainInfo } from "types"

export const formatAppChainAddress = (
  addr: string | undefined,
  appchain: AppchainInfo | undefined
) => {
  if (!addr || !appchain) {
    return ""
  }
  if (appchain.appchain_metadata.template_type === "BarnacleEvm") {
    return addr
  }
  try {
    return encodeAddress(addr)
  } catch (err) {}
  return addr
}
