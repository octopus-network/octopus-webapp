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
import { useEffect, useState } from "react";
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
  const [isManuallyDeployed, setIsManuallyDeployed] = useBoolean();
  const [isDeploying, setIsDeploying] = useBoolean();
  const [registerValidatorModalOpen, setRegisterValidatorModalOpen] =
    useBoolean(false);

  useEffect(() => {
    if (appchainId) {
      const ismd = localStorage.getItem(`manually-deployed-${appchainId}`);
      ismd === "true" && setIsManuallyDeployed.on();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appchainId]);

  const isUnbonding = !!(validator && validator?.is_unbonding);

  const { oauthUser } = useGCP();
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
        return Toast.error("Please login GCP");
      }
      setVendorKeys({
        ...(vendorKeys || {}),
        [appchainId]: { vendor: cloudVendor, key: oauthUser.Ca },
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
    isBtnDisabled = !accessKey || isDeploying;
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
        accessKey,
        instance_type: instance.instance_type,
        volume_size: instance.volume_size,
        gcpId: cloudVendor === CloudVendor.GCP ? oauthUser?.Ca : undefined,
      });
      setIsDeploying.off();
      fetchNode();
    } catch (error) {
      setIsDeploying.off();

      Toast.error(error);
    }
  };

  if (validator && isManuallyDeployed) {
    return (
      <>
        <Center minH="175px">
          <Text fontSize="md" color="gray.500">
            You have deployed a node for this appchain manually.
          </Text>
        </Center>
      </>
    );
  }

  return (
    <>
      {step === DeployStep.NEED_ACCESS_KEY && !isManuallyDeployed && (
        <Initial
          validator={validator}
          cloudVendor={cloudVendor}
          setCloudVendor={setCloudVendor}
          setInputAccessKey={setAccessKey}
          cloudAccessKey={accessKey}
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
        />
      )}

      {!isManuallyDeployed && (
        <Flex m={2} flexDirection="column" gap={2}>
          <Flex direction="row" gap={2}>
            <Button
              colorScheme="octo-blue"
              flex={"1"}
              onClick={() => {
                if (step === DeployStep.NEED_ACCESS_KEY && accessKey) {
                  onConfirmAccessKey();
                } else if (step === DeployStep.NEED_SECRECT_KEY && secretKey) {
                  onDeploy();
                }
              }}
              isDisabled={isBtnDisabled}
            >
              {step === DeployStep.NEED_SECRECT_KEY ? "Confirm" : "Deploy"}
            </Button>

            {step === DeployStep.NEED_ACCESS_KEY && [
              <Text key="divider" padding="2">
                OR
              </Text>,
              <Button
                colorScheme="octo-blue"
                key="button"
                variant="outline"
                flex="1"
                onClick={() => {
                  localStorage.setItem(
                    `manually-deployed-${appchainId}`,
                    "true"
                  );
                  setIsManuallyDeployed.on();
                }}
              >
                Deployed manually
              </Button>,
            ]}
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
      )}

      {validator && step === DeployStep.NEED_ACCESS_KEY && isManuallyDeployed && (
        <Flex direction="column" mt={2} mb={2} gap={6}>
          <Button
            onClick={onConfirmAccessKey}
            colorScheme="octo-blue"
            isDisabled={!accountId || isUnbonding}
            width="100%"
          >
            Confirm Your{" "}
            {cloudVendor === CloudVendor.AWS ? "Access Key" : "Token Name"}
          </Button>
        </Flex>
      )}

      {isManuallyDeployed && (
        <Flex direction="column" mt={2} mb={2} gap={6}>
          <Button
            onClick={setRegisterValidatorModalOpen.on}
            colorScheme="octo-blue"
            isDisabled={!accountId || isUnbonding}
            width="100%"
          >
            Register Validator
          </Button>
        </Flex>
      )}

      <RegisterValidatorModal
        isOpen={registerValidatorModalOpen}
        onClose={setRegisterValidatorModalOpen.off}
        anchor={anchor}
        appchain={appchain}
      />
    </>
  );
}
