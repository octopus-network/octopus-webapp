import Jazzicon, { jsNumberForAddress } from "react-jazzicon"
import Identicon from "@polkadot/react-identicon"

export default function OctIdenticon({
  value,
  size,
}: {
  value: string
  size: number
}) {
  if (value.startsWith("0x")) {
    return <Jazzicon diameter={size} seed={jsNumberForAddress(value)} />
  }
  return <Identicon value={value} size={size} />
}
