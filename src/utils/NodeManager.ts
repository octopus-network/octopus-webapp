import axios from "axios";
import { AWS_API_HOST, env } from "config";
import { CloudVendor, NetworkType, NodeDetail, NodeMetric } from "types";

export default class NodeManager {
  static async getNodeDetail({
    appchainId,
    accountId,
    network,
    cloudVendor,
    accessKey,
  }: {
    appchainId: string;
    accountId: string;
    network: NetworkType;
    cloudVendor: CloudVendor;
    accessKey: string;
  }) {
    const oldAuthStr = [
      "appchain",
      appchainId,
      "network",
      network,
      "cloud",
      cloudVendor,
      accessKey,
    ].join("-");
    const authStr = [
      "appchain",
      appchainId,
      "network",
      network,
      "cloud",
      cloudVendor,
      "account",
      accountId,
      accessKey,
    ].join("-");

    let res = { data: [] };
    try {
      res = await axios.get(`${AWS_API_HOST}`, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          authorization: authStr,
        },
      });
    } catch (error) {
      res = await axios.get(`${AWS_API_HOST}`, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          authorization: oldAuthStr,
        },
      });
    }

    const nodes: NodeDetail[] = res.data;

    if (nodes.length) {
      return nodes.find((t) => t?.state === "12") || nodes[0];
    }
    return null;
  }

  static async deployNode({
    cloudVendor,
    region,
    instance_type,
    volume_size,
    secret_key,
    accessKey,
    appchainId,
    network,
    accountId,
    gcpId,
  }: {
    cloudVendor: CloudVendor;
    region?: string;
    instance_type?: string;
    volume_size?: string;
    secret_key: string;
    accessKey: string;
    appchainId: string;
    network: NetworkType;
    accountId: string;
    gcpId?: string;
  }) {
    const authKey = [
      "appchain",
      appchainId,
      "network",
      network,
      "cloud",
      cloudVendor,
      "account",
      accountId,
      gcpId || accessKey,
    ].join("-");

    let _secretKey = secret_key;
    let project = undefined;
    if (cloudVendor === CloudVendor.GCP) {
      _secretKey = accessKey;
      project = secret_key;
    }
    const task = await axios.post(
      `${AWS_API_HOST}`,
      {
        cloud_vendor: cloudVendor,
        region,
        instance_type,
        volume_size,
        chain_spec: `octopus-${network}`,
        secret_key: _secretKey,
        project,
      },
      {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          authorization: authKey,
        },
      }
    );
    return task.data;
  }

  static async upgradeNode({
    uuid,
    secret_key,
    image,
    user,
    network,
  }: {
    uuid: string;
    secret_key: string;
    image: string;
    user: string;
    network: NetworkType;
  }) {
    return await axios.put(
      `${AWS_API_HOST}/${uuid}`,
      {
        action: "update_image",
        secret_key: secret_key,
        image: image,
      },
      {
        headers: { authorization: user },
      }
    );
  }

  static async deleteNode({
    uuid,
    user,
    network,
  }: {
    uuid: string;
    user: string;
    network: NetworkType;
  }) {
    await axios.delete(`${AWS_API_HOST}/${uuid}`, {
      headers: { authorization: user },
    });
  }

  static async applyNode({
    uuid,
    user,
    network,
    secretKey,
  }: {
    uuid: string;
    user: string;
    network: NetworkType;
    secretKey: string;
  }) {
    await axios.put(
      `${AWS_API_HOST}/${uuid}`,
      {
        action: "apply",
        secret_key: secretKey,
      },
      {
        headers: { authorization: user },
      }
    );
  }

  static async getNodeMetrics({
    accountId,
    currentVendor,
    currentKey,
    appchainId,
    uuid,
  }: {
    accountId: string;
    currentVendor: CloudVendor;
    currentKey: string;
    appchainId: string;
    uuid: string;
  }): Promise<NodeMetric> {
    try {
      const authKey = getAuthKey(
        currentVendor,
        currentKey,
        appchainId,
        accountId
      );
      return await axios.get(`${AWS_API_HOST}/${uuid}/metrics`, {
        headers: { authorization: authKey },
      });
    } catch (error) {
      try {
        const authKey = getAuthKey(currentVendor, currentKey, appchainId, "");
        return await axios.get(`${AWS_API_HOST}/${uuid}/metrics`, {
          headers: { authorization: authKey },
        });
      } catch (error) {
        throw error;
      }
    }
  }
}

function getAuthKey(
  cloudVendor: string,
  accessKey: string,
  appchainId: string,
  accountId: string
): string {
  if (!accountId) {
    return `appchain-${appchainId}-network-${env}-cloud-${cloudVendor}-${accessKey}`;
  }
  return `appchain-${appchainId}-network-${env}-cloud-${cloudVendor}-account-${accountId}-${accessKey}`;
}
