import React, { useState, useEffect } from "react";
import axios from "axios";
import useSWR from "swr";

import {
  Box,
  Heading,
  Button,
  Icon,
  Flex,
  Spinner,
  Center,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useColorModeValue,
  useBoolean,
  Image,
} from "@chakra-ui/react";

import { DeleteIcon } from "@chakra-ui/icons";

import myStakingBg from "assets/my-staking-bg.png";
import { TiKey } from "react-icons/ti";
import { BsThreeDots } from "react-icons/bs";
import { API_HOST } from "config";
import type { ApiPromise } from "@polkadot/api";

import { InstanceInfoModal } from "./InstanceInfoModal";
import {
  AnchorContract,
  AppchainInfo,
  CloudVendor,
  NodeDetail,
  NodeMetric,
  NodeState,
  Validator,
  ValidatorSessionKey,
} from "types";
import { useWalletSelector } from "components/WalletSelectorContextProvider";
import NodeBoard from "components/AppChain/NodeBoard";
import { MyStaking } from "../MyStaking";
import NodeDeploy from "components/AppChain/NodeDeploy";
import NodeManager from "utils/NodeManager";
import { SetSessionKeyModal } from "./SetSessionKeyModal";
import { Toast } from "components/common/toast";
import { AiOutlineClear } from "react-icons/ai";
import useLocalStorage from "hooks/useLocalStorage";
import useGCP from "hooks/useGCP";

type MyNodeProps = {
  appchainId: string | undefined;
  appchainApi: ApiPromise | undefined;
  needKeys: boolean;
  appchain?: AppchainInfo;
  anchor?: AnchorContract;
  validator?: Validator;
  validatorSessionKeys?: Record<string, ValidatorSessionKey>;
};

export const MyNode: React.FC<MyNodeProps> = ({
  appchainId,
  needKeys,
  appchainApi,
  appchain,
  anchor,
  validator,
  validatorSessionKeys,
}) => {
  const bg = useColorModeValue("white", "#15172c");
  const validatorBg = useColorModeValue(
    "linear-gradient(137deg,#1486ff 4%, #0c4df5)",
    "linear-gradient(137deg,#1486ff 4%, #0c4df5)"
  );

  const [node, setNode] = useState<NodeDetail>();

  const [isInitializing, setIsInitializing] = useBoolean();
  const [isDestroying, setIsDestroying] = useBoolean();

  const [nodeMetrics, setNodeMetrics] = useState<NodeMetric>();

  const [instanceInfoModalOpen, setInstanceInfoModalOpen] = useBoolean();
  const [isManuallyDeployed, setIsManuallyDeployed] = useBoolean();
  const [setSessionKeyModalOpen, setSetSessionKeyModalOpen] = useBoolean(false);

  const { data: deployConfig } = useSWR("deploy-config");

  const { accountId, network } = useWalletSelector();

  const [vendorKeys, setVendorKeys] = useLocalStorage("vendorKeys", null);
  const currentVendor =
    vendorKeys && appchainId && vendorKeys[appchainId]
      ? vendorKeys[appchainId].vendor
      : "";
  const currentKey =
    vendorKeys && appchainId && vendorKeys[appchainId]
      ? vendorKeys[appchainId].key
      : "";

  useEffect(() => {
    if (appchainId) {
      const ismd = localStorage.getItem(`manually-deployed-${appchainId}`);
      ismd === "true" && setIsManuallyDeployed.on();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appchainId]);

  const fetchNode = async () => {
    setIsInitializing.on();
    const _vendorKeysStr = window.localStorage.getItem("vendorKeys");
    const _vendorKeys = _vendorKeysStr ? JSON.parse(_vendorKeysStr) : null;
    NodeManager.getNodeDetail({
      appchainId: appchainId!,
      cloudVendor:
        _vendorKeys && appchainId && _vendorKeys[appchainId]
          ? _vendorKeys[appchainId].vendor
          : CloudVendor.AWS,
      accessKey:
        _vendorKeys && appchainId && _vendorKeys[appchainId]
          ? _vendorKeys[appchainId].key
          : "",
      accountId: accountId!,
      network,
    })
      .then((node) => {
        if (node) {
          setNode(node);
          if (
            node?.state &&
            [NodeState.APPLYING, NodeState.DESTROYING].includes(
              node?.state as NodeState
            )
          ) {
            setTimeout(() => {
              fetchNode();
            }, 3000);
          }
          fetchMetrics(node);
        }
        setIsInitializing.off();
      })
      .catch(() => {
        setIsInitializing.off();
      });
  };

  const fetchMetrics = async (node: NodeDetail | undefined) => {
    if (accountId && node && appchainId) {
      axios
        .get(
          `
        ${API_HOST}/node-metrics/${node.uuid}/${currentVendor}/${currentKey}/${appchainId}/${accountId}
      `
        )
        .then((res) => res.data)
        .then((res) => {
          if (res?.memory) {
            setNodeMetrics(res);
          }
        });
    }
  };

  useEffect(() => {
    if (!currentKey || !appchainId || !currentVendor || !accountId) {
      return;
    }
    fetchNode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey, accountId, appchainId, currentVendor]);

  useEffect(() => {
    fetchMetrics(node);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node, appchainId, accountId, currentVendor, currentKey]);

  const onClearCache = () => {
    window.localStorage.removeItem(`manually-deployed-${appchainId}`);
    setVendorKeys({
      ...(vendorKeys || {}),
      [appchainId!]: { vendor: "", key: "" },
    });
    window.location.reload();
  };

  const skeyBadge = needKeys && !!node?.skey;
  const metricBadge =
    !!nodeMetrics && nodeMetrics?.filesystem?.percentage > 0.8;
  let validatorSessionKey;
  if (validator && validatorSessionKeys && node) {
    validatorSessionKey = validatorSessionKeys[validator.validator_id];
  }

  const { oauthUser, onRequestAccessToken, accessToken } = useGCP(
    currentVendor === CloudVendor.GCP
  );

  const destroyNode = (secretKey: string) => {
    setIsDestroying.on();
    Toast.info("Destroying node, check details on your instance");
    axios
      .delete(`${deployConfig.deployApiHost}/tasks/${node?.uuid}`, {
        data: {
          secret_key: secretKey,
        },
        headers: { authorization: node?.user! },
      })
      .then((res) => {
        window.location.reload();
      })
      .catch(() => {
        setIsDestroying.off();
      });
  };
  const onDestroyNode = async () => {
    let secretKey: string;

    if ([CloudVendor.AWS, CloudVendor.DO].includes(currentVendor)) {
      secretKey =
        window.prompt(
          CloudVendor.AWS === currentVendor
            ? "Please enter the secret key of your server"
            : "Please enter the personal access token of your server",
          ""
        ) || "";

      if (!secretKey) {
        return;
      }
    } else if (currentVendor === CloudVendor.GCP) {
      if (!oauthUser) {
        return Toast.error("Please login with your Google account first");
      }
      if (!accessToken) {
        onRequestAccessToken((t) => {
          if (!t.access_token) {
            return Toast.error("Failed to get access token");
          }
          destroyNode(t.access_token);
        });
        return;
      } else {
        secretKey = accessToken.access_token;
      }
    }

    destroyNode(secretKey!);
  };

  const menuItems = [
    {
      isDisabled: isManuallyDeployed
        ? false
        : !appchainApi || !node?.skey || !validator,
      onClick: setSetSessionKeyModalOpen.on,
      label: "Set Session Key",
      icon: TiKey,
      hasBadge: skeyBadge,
    },
    {
      isDisabled: (node ? node.state === "10" : true) || isDestroying,
      onClick: onDestroyNode,
      label: "Destroy",
      icon: DeleteIcon,
      hasBadge: false,
    },
    {
      isDisabled: false,
      onClick: onClearCache,
      label: "Clear Node Info",
      icon: AiOutlineClear,
      hasBadge: false,
    },
  ];

  return (
    <>
      <Box position="relative" mb={5} p={4} borderRadius="lg" bg={validatorBg}>
        <Image
          position="absolute"
          bottom="0"
          right="0"
          h="110%"
          src={myStakingBg}
          zIndex={0}
        />
        <MyStaking appchain={appchain} anchor={anchor} validator={validator} />
      </Box>

      <Box position="relative" p={4} borderRadius="lg" bg={bg}>
        <Flex justifyContent="space-between" alignItems="center">
          <Heading fontSize="lg">My Node</Heading>
          <Menu>
            <MenuButton
              as={Button}
              size="sm"
              colorScheme="octo-blue"
              variant="ghost"
              position="relative"
            >
              <Icon as={BsThreeDots} boxSize={5} />
              {skeyBadge && (
                <Box
                  position="absolute"
                  top="0px"
                  right="0px"
                  boxSize={2}
                  bg="red"
                  borderRadius="full"
                />
              )}
            </MenuButton>
            <MenuList>
              {menuItems.map((item) => (
                <MenuItem
                  key={item.label}
                  position="relative"
                  onClick={item.onClick}
                  isDisabled={item.isDisabled}
                >
                  <Icon as={item.icon} mr={2} boxSize={4} /> {item.label}
                  {item.hasBadge && (
                    <Box
                      position="absolute"
                      top="10px"
                      right="10px"
                      boxSize={2}
                      bg="red"
                      borderRadius="full"
                    />
                  )}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        </Flex>
        {isInitializing && !node && (
          <Center minH="160px">
            <Spinner
              size="md"
              thickness="4px"
              speed="1s"
              color="octo-blue.500"
            />
          </Center>
        )}
        {node && (
          <NodeBoard
            node={node}
            cloudVendor={currentVendor}
            anchor={anchor}
            appchain={appchain}
            validator={validator}
            onOpenInstance={setInstanceInfoModalOpen.on}
            metricBadge={metricBadge}
          />
        )}
        {!node && !isInitializing && (
          <NodeDeploy
            validator={validator}
            appchainId={appchainId}
            anchor={anchor}
            appchain={appchain}
            fetchNode={fetchNode}
          />
        )}
      </Box>

      <InstanceInfoModal
        metrics={nodeMetrics}
        isOpen={instanceInfoModalOpen}
        onClose={setInstanceInfoModalOpen.off}
      />

      <SetSessionKeyModal
        isOpen={setSessionKeyModalOpen}
        onClose={setSetSessionKeyModalOpen.off}
        appchain={appchain}
        appchainApi={appchainApi}
        skey={node?.skey}
        validator={validator}
        validatorSessionKey={validatorSessionKey}
      />
    </>
  );
};
