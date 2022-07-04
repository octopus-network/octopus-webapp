import { decodeAddress } from "@polkadot/util-crypto"
import { u8aToHex, isHex } from "@polkadot/util"
import { TypeRegistry, createType } from "@polkadot/types"
import { DetectCodec } from "@polkadot/types/types"
import { toNumArray } from "./common"
import { ApiPromise } from "@polkadot/api"
import axios from "axios"

export function toHexAddress(ss58Address: string) {
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

export function messageProofWithoutProof(encoded_messages: string) {
  return {
    header: [] as number[],
    encoded_messages: toNumArray(encoded_messages),
    mmr_leaf: [] as number[],
    mmr_proof: [] as number[],
  }
}

export async function getOffchainDataForCommitment(
  appchain: ApiPromise,
  commitment: string
) {
  const prefixBuffer = Buffer.from("commitment", "utf8")
  const key = "0x" + prefixBuffer.toString("hex") + commitment.slice(2)

  const data = (
    await appchain.rpc.offchain.localStorageGet("PERSISTENT", key)
  ).toString()

  return data
}

export async function getLastBlockNumberOfAppchain(
  rpcUrl: string,
  anchorContractId: string
) {
  const res: any = await axios
    .post(rpcUrl, {
      jsonrpc: "2.0",
      id: "dontcare",
      method: "query",
      params: {
        request_type: "call_function",
        finality: "final",
        account_id: anchorContractId,
        method_name: "get_latest_commitment_of_appchain",
        args_base64: "e30=",
      },
    })
    .then((res) => res.data)
    .then((res) => res.result.result)

  const lastCommitment = JSON.parse(
    res.reduce((str: any, chr: any) => str + String.fromCharCode(chr), "")
  )

  console.log("lastCommitment", lastCommitment)

  return lastCommitment ? lastCommitment.block_number : 0
}

export function decodeData(type: any, data: any): DetectCodec<any, any> {
  const registry = new TypeRegistry()
  registry.register(type)
  return createType(registry, Object.keys(type)[0], data)
}

export function decodeMmrProofWrapper(rawMmrProofWrapper: any): {
  blockHash: DetectCodec<any, any>
  mmrLeaf: DetectCodec<any, any>
  mmrProof: DetectCodec<any, any>
} {
  const mmrProofWrapper = rawMmrProofWrapper.toJSON()
  const mmrLeaf: any = decodeData(
    {
      MmrLeaf: {
        version: "u8",
        parent_number_and_hash: "(u32, Hash)",
        beefy_next_authority_set: "BeefyNextAuthoritySet",
        parachain_heads: "Hash",
      },
      BeefyNextAuthoritySet: {
        id: "u64",
        len: "u32",
        root: "Hash",
      },
    },
    mmrProofWrapper.leaf
  )
  const mmrProof: any = decodeData(
    {
      MMRProof: {
        leafIndex: "u64",
        leafCount: "u64",
        items: "Vec<Hash>",
      },
    },
    mmrProofWrapper.proof
  )
  return {
    blockHash: mmrProofWrapper.blockHash,
    mmrLeaf,
    mmrProof,
  }
}

export function decodeSignedCommitment(hashString: string) {
  const decodedSignedCommitment = decodeData(
    {
      BeefySignedCommitment: {
        commitment: "BeefyCommitment",
        signatures: "Vec<Signature>",
      },
      BeefyId: "[u8; 33]",
      BeefyCommitment: {
        payload: "BeefyPayload",
        blockNumber: "BlockNumber",
        validatorSetId: "ValidatorSetId",
      },
      BeefyNextAuthoritySet: {
        id: "u64",
        len: "u32",
        root: "H256",
      },
      Signature: "[u8; 65]",
      BeefyPayload: "Vec<(BeefyPayloadId, Vec<u8>)>",
      MmrRootHash: "H256",
      ValidatorSetId: "u64",
      BeefyPayloadId: "[u8; 2]",
    },
    hashString
  )
  return decodedSignedCommitment
}
