import {
  Button,
  Center,
  Flex,
  Link,
  Spinner,
  Text,
  useBoolean,
} from "@chakra-ui/react";
import { useWalletSelector } from "components/WalletSelectorContextProvider";
import { useState } from "react";
import {
  AnchorContract,
  AppchainInfo,
  CloudVendor,
  OCTNetwork,
  Validator,
} from "types";
import Initial from "./DeployStep/Initial";
import { RegisterValidatorModal } from "views/Appchain/MyStaking/RegisterValidatorModal";
import { Toast } from "components/common/toast";
import SecretKey from "./DeployStep/SecretKey";
import NodeManager from "utils/NodeManager";
import { CLOUD_NODE_INSTANCES } from "config/constants";
import useLocalStorage from "hooks/useLocalStorage";
import useGCP from "hooks/useGCP";

enum DeployStep {
  NEED_ACCESS_KEY,
  CONFIRMED_ACCESS_KEY,
  NEED_SECRECT_KEY,
}

export default function NodeDeploy({
  validator,
  appchainId,
  appchain,
  anchor,
  fetchNode,
}: {
  validator?: Validator;
  appchainId?: string;
  appchain?: AppchainInfo;
  anchor?: AnchorContract;
  fetchNode: () => void;
}) {
  const [vendorKeys, setVendorKeys] = useLocalStorage("vendorKeys", null);

  let currentVendor;
  let currentAccessKey = "";
  if (vendorKeys && appchainId && vendorKeys[appchainId]) {
    currentVendor = vendorKeys[appchainId].vendor || "";
    currentAccessKey = vendorKeys[appchainId].key || "";
  }
  const [step, setStep] = useState<DeployStep>(DeployStep.NEED_ACCESS_KEY);
  const [cloudVendor, setCloudVendor] = useState<CloudVendor>(
    currentVendor || CloudVendor.AWS
  );
  const [accessKey, setAccessKey] = useState<string>(currentAccessKey);
  const [secretKey, setSecretKey] = useState<string>("");
  const [deployRegion, setDeployRegion] = useState<string>("");
  const [isDeploying, setIsDeploying] = useBoolean();
  const [registerValidatorModalOpen, setRegisterValidatorModalOpen] =
    useBoolean(false);

  const { onLogin, oauthUser, onRequestAccessToken, projects, accessToken } =
    useGCP();

  const { accountId, network } = useWalletSelector();

  const onConfirmAccessKey = async () => {
    if (!appchainId) {
      return;
    }
    if (!accessKey) {
      return Toast.error(
        `Please input ${
          cloudVendor === CloudVendor.AWS ? "Access Key" : "Token Name"
        }`
      );
    }
    if (!accountId) {
      return Toast.error("Please connect wallet");
    }

    setStep(DeployStep.CONFIRMED_ACCESS_KEY);
    if (cloudVendor === CloudVendor.GCP) {
      if (!oauthUser) {
        return Toast.error("Please login with Google first");
      }
      setVendorKeys({
        ...(vendorKeys || {}),
        [appchainId]: { vendor: cloudVendor, key: oauthUser.sub },
      });
    } else {
      setVendorKeys({
        ...(vendorKeys || {}),
        [appchainId]: { vendor: cloudVendor, key: accessKey },
      });
    }

    try {
      const node = await NodeManager.getNodeDetail({
        cloudVendor,
        accessKey,
        appchainId: appchainId!,
        accountId,
        network,
      });
      if (!node) {
        setStep(DeployStep.NEED_SECRECT_KEY);
      } else {
        fetchNode();
      }
    } catch (error) {
      Toast.error(error);
    }
  };

  let isBtnDisabled = false;
  if (step === DeployStep.NEED_ACCESS_KEY) {
    isBtnDisabled =
      !accessKey ||
      isDeploying ||
      (cloudVendor === CloudVendor.GCP && !oauthUser);
  } else if (step === DeployStep.NEED_SECRECT_KEY) {
    isBtnDisabled = !secretKey;
  } else if (step === DeployStep.CONFIRMED_ACCESS_KEY) {
    isBtnDisabled = true;
  }

  const onDeploy = async () => {
    if (!accountId || !appchainId) {
      return Toast.error("Please connect wallet");
    }
    if (!oauthUser && cloudVendor === CloudVendor.GCP) {
      return Toast.error("Please login with Google first");
    }
    setIsDeploying.on();

    const instance = (CLOUD_NODE_INSTANCES[appchainId] ||
      CLOUD_NODE_INSTANCES[OCTNetwork.BARNANCLE_0918])[cloudVendor];

    try {
      await NodeManager.deployNode({
        appchainId,
        cloudVendor,
        accountId,
        network,
        region: deployRegion,
        secret_key: secretKey,
        accessKey: accessToken?.access_token || "",
        instance_type: instance.instance_type,
        volume_size: instance.volume_size,
        gcpId: cloudVendor === CloudVendor.GCP ? oauthUser?.sub : undefined,
      });
      setIsDeploying.off();
      fetchNode();
    } catch (error) {
      setIsDeploying.off();
      Toast.error(error);
    }
  };

  return (
    <>
      {step === DeployStep.NEED_ACCESS_KEY && (
        <Initial
          validator={validator}
          cloudVendor={cloudVendor}
          setCloudVendor={setCloudVendor}
          setInputAccessKey={setAccessKey}
          cloudAccessKey={accessKey}
          onLogin={onLogin}
          oauthUser={oauthUser}
        />
      )}

      {step === DeployStep.CONFIRMED_ACCESS_KEY && (
        <Center minH="60px">
          <Spinner size="md" thickness="4px" speed="1s" color="octo-blue.500" />
        </Center>
      )}

      {step === DeployStep.NEED_SECRECT_KEY && (
        <SecretKey
          appchainId={appchainId}
          secretKey={secretKey}
          setSecretKey={setSecretKey}
          setDeployRegion={setDeployRegion}
          cloudVendor={cloudVendor}
          projects={projects}
        />
      )}

      <Flex m={2} flexDirection="column" gap={2}>
        <Flex direction="row" justify="center">
          <Button
            colorScheme="octo-blue"
            flex={"1"}
            onClick={() => {
              if (step === DeployStep.NEED_ACCESS_KEY && accessKey) {
                if (cloudVendor === CloudVendor.GCP) {
                  onRequestAccessToken(() => {
                    onConfirmAccessKey();
                  });
                } else {
                  onConfirmAccessKey();
                }
              } else if (step === DeployStep.NEED_SECRECT_KEY && secretKey) {
                onDeploy();
              }
            }}
            isDisabled={isBtnDisabled}
          >
            {step === DeployStep.NEED_SECRECT_KEY ? "Confirm" : "Next"}
          </Button>
        </Flex>
        <Text textAlign="center" mt={4}>
          Learn about{" "}
          <Link
            href="https://docs.oct.network/maintain/validator-deploy.html#deploy-validator-node"
            variant="blue-underline"
            isExternal
            ml={2}
          >
            Deploy Validator Node
          </Link>
        </Text>
      </Flex>

      <RegisterValidatorModal
        isOpen={registerValidatorModalOpen}
        onClose={setRegisterValidatorModalOpen.off}
        anchor={anchor}
        appchain={appchain}
      />
    </>
  );
}
