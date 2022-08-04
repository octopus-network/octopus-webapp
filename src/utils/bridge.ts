import { Wallet } from "@near-wallet-selector/core"
import { ApiPromise } from "@polkadot/api"
import { isHex, stringToHex, u8aToHex } from "@polkadot/util"
import { decodeAddress } from "@polkadot/util-crypto"
import { Toast } from "components/common/toast"
import { BigNumber, ethers } from "ethers"
import { COMPLEX_CALL_GAS } from "primitives"
import { BridgeHistoryStatus, TokenAsset } from "types"
import OctopusAppchain from "./abis/OctopusAppchain.json"
import OctopusSession from "./abis/OctopusSession.json"
import { DecimalUtil } from "./decimal"

let _signer: ethers.providers.JsonRpcSigner | null = null

const OctopusAppchainAddress = "0x0000000000000000000000000000000000000803"
const OctopusSessionAddress = "0x0000000000000000000000000000000000000804"

function toHexAddress(ss58Address: string) {
  if (isHex(ss58Address)) {
    return ""
  }
  try {
    const u8a = decodeAddress(ss58Address)
    return u8aToHex(u8a)
  } catch (err) {
    return ""
  }
}

const getSigner = () => {
  if (!_signer) {
    const provider = new ethers.providers.Web3Provider((window as any).ethereum)

    _signer = provider.getSigner()
  }
  return _signer
}

export async function nearBurn({
  token,
  amount,
  isEvm,
  targetAccount,
  wallet,
  anchorId,
}: {
  token: TokenAsset
  amount: string
  isEvm: boolean
  targetAccount: string
  wallet: Wallet
  anchorId: string
}) {
  const amountInU64 = DecimalUtil.toU64(
    DecimalUtil.fromString(amount),
    Array.isArray(token?.metadata.decimals)
      ? token?.metadata.decimals[0]
      : token?.metadata.decimals
  )

  let targetAccountInHex = targetAccount
  if (!isEvm) {
    targetAccountInHex = toHexAddress(targetAccount || "")
  }

  if (!targetAccountInHex) {
    throw new Error("Invalid target account")
  }

  if (token?.assetId === undefined) {
    await wallet.signAndSendTransaction({
      receiverId: anchorId,
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: "burn_wrapped_appchain_token",
            args: {
              receiver_id: targetAccountInHex,
              amount: amountInU64.toString(),
            },
            gas: COMPLEX_CALL_GAS,
            deposit: "0",
          },
        },
      ],
    })
    Toast.success("Transaction has been sent")
    return
  }

  wallet.signAndSendTransaction({
    receiverId: token.contractId,
    actions: [
      {
        type: "FunctionCall",
        params: {
          methodName: "ft_transfer_call",
          args: {
            receiver_id: anchorId,
            amount: amountInU64.toString(),
            msg: JSON.stringify({
              BridgeToAppchain: {
                receiver_id_in_appchain: targetAccountInHex,
              },
            }),
          },
          gas: COMPLEX_CALL_GAS,
          deposit: "1",
        },
      },
    ],
  })
}

export async function nearBurnNft({
  targetAccount,
  anchorId,
  receiverId,
  tokenId,
  wallet,
}: {
  targetAccount: string
  anchorId: string
  receiverId: string
  tokenId: string
  wallet: Wallet
}) {
  let targetAccountInHex = toHexAddress(targetAccount || "")

  if (!targetAccountInHex) {
    throw new Error("Invalid target account")
  }

  await wallet.signAndSendTransaction({
    receiverId,
    actions: [
      {
        type: "FunctionCall",
        params: {
          methodName: "nft_transfer_call",
          args: {
            receiver_id: anchorId,
            token_id: tokenId,
            msg: JSON.stringify({
              BridgeToAppchain: {
                receiver_id_in_appchain: targetAccountInHex,
              },
            }),
          },
          gas: COMPLEX_CALL_GAS,
          deposit: "1",
        },
      },
    ],
  })
}

export async function substrateBurn({
  api,
  asset,
  amount,
  targetAccount,
  fromAccount,
  appchainId,
  updateTxn,
}: {
  api: ApiPromise
  asset?: TokenAsset
  amount: string
  targetAccount: string
  fromAccount: string
  appchainId: string
  updateTxn: (key: string, value: any) => void
}) {
  const targetAccountInHex = stringToHex(targetAccount)
  const tx: any =
    asset?.assetId === undefined
      ? api?.tx.octopusAppchain.lock(targetAccountInHex, amount)
      : api?.tx.octopusAppchain.burnAsset(
          asset?.assetId,
          targetAccountInHex,
          amount
        )

  await tx.signAndSend(fromAccount, ({ events = [] }: any) => {
    events.forEach(({ event: { data, method, section } }: any) => {
      console.log("event", { data, method, section })

      if (
        section === "octopusAppchain" &&
        (method === "Locked" || method === "AssetBurned")
      ) {
        updateTxn(appchainId || "", {
          isAppchainSide: true,
          appchainId,
          hash: tx.hash.toString(),
          sequenceId: data[method === "Locked" ? 3 : 4].toNumber(),
          amount,
          status: BridgeHistoryStatus.Pending,
          timestamp: new Date().getTime(),
          fromAccount,
          toAccount: targetAccount,
          tokenContractId: asset?.contractId,
        })
      }
    })
  })
}

export async function evmBurn({
  asset_id,
  amount,
  receiver_id,
}: {
  asset_id?: number
  amount: string
  receiver_id: string
}) {
  if (typeof asset_id === "number") {
    evmBurnAsset(asset_id, amount, receiver_id)
  } else {
    evmLock(amount, receiver_id)
  }
}

export async function evmLock(amount: string, receiver_id: string) {
  try {
    const signer = getSigner()
    const contract = new ethers.Contract(
      OctopusAppchainAddress,
      OctopusAppchain,
      signer
    )
    await contract.lock(amount, receiver_id)
  } catch (error) {
    throw error
  }
}

export async function evmBurnAsset(
  asset_id: number,
  amount: string,
  receiver_id: string
) {
  try {
    const signer = getSigner()
    const contract = new ethers.Contract(
      OctopusAppchainAddress,
      OctopusAppchain,
      signer
    )
    await contract.burn_asset(asset_id, amount, receiver_id)
  } catch (error) {
    throw error
  }
}

export async function evmLockNft(
  class_id: number,
  instance_id: BigNumber,
  receiver_id: string
) {
  try {
    const signer = getSigner()
    const contract = new ethers.Contract(
      OctopusAppchainAddress,
      OctopusAppchain,
      signer
    )
    await contract.lock_nft(class_id, instance_id, receiver_id)
  } catch (error) {
    throw error
  }
}
