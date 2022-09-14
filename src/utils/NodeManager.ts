import axios from "axios"
import { CLOUD_VENDOR, NetworkType, NodeDetail } from "types"

const API_HOST = {
  testnet: `https://3jd9s8zf1l.execute-api.us-west-2.amazonaws.com/api/tasks`,
  mainnet: `https://1fus85rip4.execute-api.ap-northeast-1.amazonaws.com/api`,
}
export default class NodeManager {
  static async getNodeDetail({
    appchainId,
    accountId,
    network,
    cloudVendor,
    accessKey,
  }: {
    appchainId: string
    accountId: string
    network: NetworkType
    cloudVendor: CLOUD_VENDOR
    accessKey: string
  }) {
    const oldAuthStr = `appchain-${appchainId}-network-${network}-cloud-${cloudVendor}-${accessKey}`
    const authStr = `appchain-${appchainId}-network-${network}-cloud-${cloudVendor}-account-${accountId}-${accessKey}`

    let res = { data: [] }
    try {
      res = await axios.get(`${API_HOST[network]}`, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          authorization: authStr,
        },
      })
    } catch (error) {
      res = await axios.get(`${API_HOST[network]}`, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          authorization: oldAuthStr,
        },
      })
    }

    const nodes: NodeDetail[] = res.data

    if (nodes.length) {
      return nodes.find((t) => t?.state === "12") || nodes[0]
    }
    return null
  }

  static async deployNode({
    cloud_vendor,
    region,
    instance_type,
    volume_size,
    secret_key,
    accessKey,
    appchainId,
    network,
    accountId,
  }: {
    cloud_vendor: CLOUD_VENDOR
    region?: string
    instance_type?: string
    volume_size?: string
    secret_key: string
    accessKey: string
    appchainId: string
    network: NetworkType
    accountId: string
  }) {
    const authKey = `appchain-${appchainId}-network-${network}-cloud-${cloud_vendor}-account-${accountId}-${accessKey}`
    const task = await axios.post(
      `${API_HOST[network]}`,
      {
        cloud_vendor,
        region,
        instance_type,
        volume_size,
        chain_spec: `octopus-${network}`,
        secret_key,
      },
      {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          authorization: authKey,
        },
      }
    )
    return task.data
  }

  static async upgradeNode({
    uuid,
    secret_key,
    image,
    user,
    network,
  }: {
    uuid: string
    secret_key: string
    image: string
    user: string
    network: NetworkType
  }) {
    return await axios.put(
      `${API_HOST[network]}/${uuid}`,
      {
        action: "update_image",
        secret_key: secret_key,
        image: image,
      },
      {
        headers: { authorization: user },
      }
    )
  }

  static async deleteNode({
    uuid,
    user,
    network,
  }: {
    uuid: string
    user: string
    network: NetworkType
  }) {
    await axios.delete(`${API_HOST[network]}/${uuid}`, {
      headers: { authorization: user },
    })
  }

  static async applyNode({
    uuid,
    user,
    network,
    secretKey,
  }: {
    uuid: string
    user: string
    network: NetworkType
    secretKey: string
  }) {
    await axios.put(
      `${API_HOST[network]}/${uuid}`,
      {
        action: "apply",
        secret_key: secretKey,
      },
      {
        headers: { authorization: user },
      }
    )
  }
}
