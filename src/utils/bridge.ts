/* eslint-disable no-loop-func */
import { Wallet } from "@near-wallet-selector/core";
import { ApiPromise } from "@polkadot/api";
import { isHex, stringToHex, u8aToHex } from "@polkadot/util";
import { decodeAddress, isAddress } from "@polkadot/util-crypto";
import { Toast } from "components/common/toast";
import { BigNumber, ethers } from "ethers";
import { providers } from "near-api-js";
import { CodeResult } from "near-api-js/lib/providers/provider";
import { COMPLEX_CALL_GAS } from "primitives";
import { TokenAsset, BridgeConfig, BridgeHistory } from "types";
import OctopusAppchain from "./abis/OctopusAppchain.json";
import OctopusSession from "./abis/OctopusSession.json";
import { DecimalUtil, ZERO_DECIMAL } from "./decimal";
import BN from "bn.js";
import Decimal from "decimal.js";
import { request } from "graphql-request";
import { hexToString } from "@polkadot/util";

let _signer: ethers.providers.JsonRpcSigner | null = null;

const OctopusAppchainAddress = "0x0000000000000000000000000000000000000803";
const OctopusSessionAddress = "0x0000000000000000000000000000000000000804";

function toHexAddress(ss58Address: string) {
  if (isHex(ss58Address)) {
    return "";
  }
  try {
    const u8a = decodeAddress(ss58Address);
    return u8aToHex(u8a);
  } catch (err) {
    return "";
  }
}

const getSigner = () => {
  if (!_signer) {
    const provider = new ethers.providers.Web3Provider(
      (window as any).ethereum
    );

    _signer = provider.getSigner();
  }
  return _signer;
};

const TX_QUERY = (hash: string) => `
  query {
    transaction(id: "${hash}") {
      id
      extrinsic {
        id
        hash
        events(filter:{section:{equalTo:"octopusAppchain"}}) {
          nodes {
            section
            method
            data
          }
        }
      }
    }
  }
`;

export async function checkEvmTxSequence(tx: BridgeHistory) {
  const result = await request(
    `https://api.subquery.network/sq/octopus-appchains/testnet-barnacle-evm`,
    TX_QUERY(tx.hash)
  );
  if (result.transaction) {
    const extrinsic = result.transaction.extrinsic;
    if (extrinsic) {
      const events = extrinsic.events;
      if (events) {
        const nodes = events.nodes;
        if (nodes) {
          const node = nodes[0];
          if (node) {
            const data = node.data;
            if (data) {
              const _data = JSON.parse(data);
              if (_data) {
                return Number(_data.sequence);
              }
            }
          }
        }
      }
    }
  }
}

export async function isValidAddress({
  address,
  isNearToAppchain,
  isEvm,
}: {
  address: string;
  isNearToAppchain: boolean;
  isEvm: boolean;
}) {
  // substrate address
  if (isNearToAppchain) {
    return (
      (!isEvm && (isHex(address) || isAddress(address))) ||
      (isEvm && ethers.utils.getAddress(address) !== null)
    );
  }

  return true;
  // TODO: check if address is valid for NEAR
  // try {

  // } catch (error) {
  //   return false
  // }
}

export async function isValidAmount({
  address,
  isNearToAppchain,
  amount,
}: {
  address: string;
  isNearToAppchain: boolean;
  amount: BN;
}): Promise<boolean> {
  if (amount.lte(new BN(0))) {
    return false;
  }

  return true;
}

export async function getPolkaTokenBalance({
  tokenAsset,
  appchainApi,
  bridgeConfig,
  account,
}: {
  tokenAsset: TokenAsset;
  appchainApi: ApiPromise;
  bridgeConfig: BridgeConfig;
  account: string;
}) {
  let balance = ZERO_DECIMAL;
  try {
    if (tokenAsset.assetId === undefined) {
      const res = await appchainApi?.query.system.account(account);
      const resJSON: any = res?.toJSON();
      balance = DecimalUtil.fromString(
        resJSON?.data?.free,
        Array.isArray(tokenAsset?.metadata.decimals)
          ? tokenAsset?.metadata.decimals[1]
          : tokenAsset?.metadata.decimals
      );
    } else {
      const query =
        appchainApi?.query[bridgeConfig.tokenPallet.section]?.[
          bridgeConfig.tokenPallet.method
        ];

      if (!query) {
        return balance;
      }

      const res = await (bridgeConfig.tokenPallet.paramsType === "Tuple"
        ? query([tokenAsset.assetId, account])
        : query(tokenAsset.assetId, account));

      const resJSON: any = res?.toJSON();

      balance = DecimalUtil.fromString(
        resJSON?.[bridgeConfig.tokenPallet.valueKey],
        Array.isArray(tokenAsset?.metadata.decimals)
          ? tokenAsset?.metadata.decimals[1]
          : tokenAsset?.metadata.decimals
      );
    }
  } catch (error) {}

  return balance;
}

export async function getNearTokenBalance({
  nodeUrl,
  accountId,
  tokenAsset,
}: {
  nodeUrl: string;
  accountId: string;
  tokenAsset: TokenAsset;
}) {
  try {
    const provider = new providers.JsonRpcProvider({
      url: nodeUrl,
    });
    const res = await provider.query<CodeResult>({
      request_type: "call_function",
      account_id: tokenAsset.contractId,
      method_name: "ft_balance_of",
      args_base64: btoa(JSON.stringify({ account_id: accountId })),
      finality: "final",
    });

    const bal = JSON.parse(Buffer.from(res.result).toString());

    return DecimalUtil.fromString(
      bal,
      Array.isArray(tokenAsset?.metadata.decimals)
        ? tokenAsset?.metadata.decimals[0]
        : tokenAsset?.metadata.decimals
    );
  } catch (error) {
    return ZERO_DECIMAL;
  }
}

export async function setSessionKey(key: string) {
  const signer = getSigner();
  const contract = new ethers.Contract(
    OctopusSessionAddress,
    OctopusSession,
    signer
  );
  await contract.set_keys(key, "0x00");
}

export async function nearBurn({
  token,
  amount,
  isEvm,
  targetAccount,
  wallet,
  anchorId,
}: {
  token: TokenAsset;
  amount: string;
  isEvm: boolean;
  targetAccount: string;
  wallet: Wallet;
  anchorId: string;
}) {
  const amountInU64 = DecimalUtil.toU64(
    DecimalUtil.fromString(amount),
    Array.isArray(token?.metadata.decimals)
      ? token?.metadata.decimals[0]
      : token?.metadata.decimals
  );

  let targetAccountInHex = targetAccount;

  if (!isEvm) {
    targetAccountInHex = toHexAddress(targetAccount || "");
  }

  if (!targetAccountInHex) {
    throw new Error("Invalid target account");
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
    });
    Toast.success("Transaction has been sent");
    return;
  }

  await wallet.signAndSendTransaction({
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
  });
}

export async function nearBurnNft({
  targetAccount,
  anchorId,
  receiverId,
  tokenId,
  wallet,
}: {
  targetAccount: string;
  anchorId: string;
  receiverId: string;
  tokenId: string;
  wallet: Wallet;
}) {
  let targetAccountInHex = toHexAddress(targetAccount || "");

  if (!targetAccountInHex) {
    throw new Error("Invalid target account");
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
  });
}

export async function substrateBurn({
  api,
  asset,
  bridgeConfig,
  amount,
  targetAccount,
  fromAccount,
  appchainId,
  crosschainFee,
}: {
  api: ApiPromise;
  asset?: TokenAsset;
  bridgeConfig?: BridgeConfig;
  amount: string;
  targetAccount: string;
  fromAccount: string;
  appchainId: string;
  crosschainFee: number;
}) {
  const amountInDec = DecimalUtil.power(
    new Decimal(amount),
    Array.isArray(asset?.metadata.decimals)
      ? asset?.metadata.decimals[0]
      : asset?.metadata.decimals
  );

  const targetAccountInHex = stringToHex(targetAccount);
  let tx: any = null;

  if (bridgeConfig?.crosschainFee) {
    tx =
      asset?.assetId === undefined
        ? api?.tx.octopusBridge.lock(
            targetAccountInHex,
            amountInDec.toFixed(0, Decimal.ROUND_DOWN),
            crosschainFee
          )
        : api?.tx.octopusAppchain.burnNep141(
            asset?.assetId,
            targetAccountInHex,
            amountInDec.toFixed(0, Decimal.ROUND_DOWN),
            crosschainFee
          );
  } else {
    tx =
      asset?.assetId === undefined
        ? api?.tx.octopusAppchain.lock(
            targetAccountInHex,
            amountInDec.toFixed(0, Decimal.ROUND_DOWN)
          )
        : api?.tx.octopusAppchain.burnAsset(
            asset?.assetId,
            targetAccountInHex,
            amountInDec.toFixed(0, Decimal.ROUND_DOWN)
          );
  }

  if (!asset?.assetId) {
    const balance = await getPolkaTokenBalance({
      account: fromAccount,
      appchainApi: api,
      tokenAsset: asset!,
      bridgeConfig: bridgeConfig!,
    });

    if (balance.lt(amount)) {
      amount = balance.toString();
    }

    if (balance.toString() === amount) {
      const info = await tx.paymentInfo(fromAccount);
      const fee = info.partialFee.toString();

      const _amount = amountInDec
        .minus(new Decimal(fee).mul(2))
        .toFixed(0, Decimal.ROUND_DOWN);

      tx =
        asset?.assetId === undefined
          ? api?.tx.octopusAppchain.lock(targetAccountInHex, _amount)
          : api?.tx.octopusAppchain.burnAsset(
              asset?.assetId,
              targetAccountInHex,
              _amount
            );
    }
  }

  await tx.signAndSend(fromAccount, (res: any) => {
    res.events.forEach(({ event: { data, method, section } }: any) => {
      if (
        (section === "octopusAppchain" &&
          (method === "Locked" || method === "AssetBurned")) ||
        (section === "octopusBridge" &&
          (method === "Locked" || method === "BurnNep141"))
      ) {
        window.location.reload();
      }
    });
  });
}

export async function evmBurn({
  asset,
  amount,
  receiver_id,
  appchainId,
  fromAccount,
}: {
  asset?: TokenAsset;
  amount: string;
  receiver_id: string;
  appchainId?: string;
  fromAccount?: string;
}) {
  const amountInU64 = DecimalUtil.toU64(
    DecimalUtil.fromString(amount),
    Array.isArray(asset?.metadata.decimals)
      ? asset?.metadata.decimals[0]
      : asset?.metadata.decimals
  );

  let hash = "";
  if (typeof asset?.assetId === "number") {
    hash = await evmBurnAsset(
      asset?.assetId,
      amountInU64.toString(),
      receiver_id
    );
  } else {
    hash = await evmLock(amountInU64.toString(), receiver_id);
  }
  return hash;
}

export async function evmLock(amount: string, receiver_id: string) {
  const signer = getSigner();
  const contract = new ethers.Contract(
    OctopusAppchainAddress,
    OctopusAppchain,
    signer
  );
  const tx = await contract.lock(amount, receiver_id);
  return tx.hash;
}

export async function evmBurnAsset(
  asset_id: number,
  amount: string,
  receiver_id: string
) {
  const signer = getSigner();
  const contract = new ethers.Contract(
    OctopusAppchainAddress,
    OctopusAppchain,
    signer
  );
  const tx = await contract.burn_asset(asset_id, amount, receiver_id);
  return tx.hash;
}

export async function evmLockNft(
  class_id: number,
  instance_id: BigNumber,
  receiver_id: string
) {
  try {
    const signer = getSigner();
    const contract = new ethers.Contract(
      OctopusAppchainAddress,
      OctopusAppchain,
      signer
    );
    await contract.lock_nft(class_id, instance_id, receiver_id);
  } catch (error) {
    throw error;
  }
}

export async function getAppchainNFTs(
  classIds: number[],
  appchainApi: ApiPromise,
  account: string,
  appchainId: string
) {
  try {
    let promises: any[] = [];
    if (appchainId === "uniqueone-appchain") {
      const allEntries = await appchainApi.query.ormlNFT.tokensByOwner.entries(
        account
      );
      promises = allEntries.map(([a, b]) => {
        const [, [classId, instanceId]] = a.toHuman() as any;

        return appchainApi.query.ormlNFT
          .tokens(classId, instanceId)
          .then((res) => {
            if (res) {
              const unique = res.toJSON() as any;

              const metadata = JSON.parse(hexToString(unique.metadata));

              return {
                id: instanceId,
                class: classId,
                metadata: metadata,
                owner: account,
              };
            }
            return null;
          })
          .catch(console.log);
      });
    } else {
      promises = classIds.map((classId) => {
        return appchainApi.query.octopusUniques.class(classId).then((info) => {
          const { instances, items } = (info?.toJSON() as any) || {};

          const count = instances || items || 0;

          const tmpPromises = [];

          for (let i = 0; i <= count; i++) {
            const p = appchainApi.query.octopusUniques
              .asset(classId, i)
              .then(async (res) => {
                try {
                  if (res) {
                    const _res =
                      await appchainApi.query.octopusUniques.instanceMetadataOf(
                        classId,
                        i
                      );

                    const unique = res.toJSON() as any;

                    if (!(unique && unique.owner === account)) {
                      return null;
                    }

                    const metadataHuman = _res.toHuman() as any;

                    if (!metadataHuman) {
                      return null;
                    }

                    const metadata = JSON.parse(
                      hexToString(metadataHuman.data)
                    );

                    if (!metadata || !unique) {
                      return null;
                    }

                    return {
                      ...(unique as any),
                      id: i,
                      class: classId,
                      metadata: metadata,
                    };
                  }
                } catch (error) {
                  console.error(error);
                }

                return null;
              });
            tmpPromises.push(p);
          }

          return Promise.all(tmpPromises as any).then((res) => {
            return res?.filter((item) => !!item);
          });
        });
      });
    }
    const ress = await Promise.all(promises);
    const tmpArr: any[] = ress?.length ? ress.flat(Infinity) : [];

    return tmpArr.filter((t) => t);
  } catch (error) {
    return [];
  }
}
