import {
  Button,
  Center,
  Flex,
  Input,
  Link,
  Spinner,
  Text,
  useBoolean,
  useColorMode,
  useColorModeValue,
} from "@chakra-ui/react"
import { useWalletSelector } from "components/WalletSelectorContextProvider"
import { useEffect, useState } from "react"
import { AnchorContract, AppchainInfo, CLOUD_VENDOR, Validator } from "types"
import Initial from "./DeployStep/Initial"
import { RegisterValidatorModal } from "views/Appchain/MyStaking/RegisterValidatorModal"
import { Toast } from "components/common/toast"
import { getNodeDetail } from "utils/appchain"
import useSWR from "swr"
import { API_HOST } from "config"
import RecommendInstance from "./DeployStep/RecommendInstance"

enum DeployStep {
  NEED_ACCESS_KEY,
  CONFIRMED_ACCESS_KEY,
  NEED_SECRECT_KEY,
}

export default function NodeDeploy({
  validator,
  appchainId,
  setNode,
  myNodeSetOAuthUser,
  isShowRegister,
  appchain,
  anchor,
}: {
  validator?: Validator
  appchainId?: string
  setNode: (node: any) => void
  myNodeSetOAuthUser: (user: any) => void
  isShowRegister: boolean
  appchain?: AppchainInfo
  anchor?: AnchorContract
}) {
  const inputBg = useColorModeValue("#f5f7fa", "whiteAlpha.100")
  const cloudVendorInLocalStorage = window.localStorage.getItem(
    "OCTOPUS_DEPLOYER_CLOUD_VENDOR"
  ) as CLOUD_VENDOR
  const accessKeyInLocalStorage =
    window.localStorage.getItem("OCTOPUS_DEPLOYER_ACCESS_KEY") ||
    window.localStorage.getItem("accessKey") ||
    ""

  const [step, setStep] = useState<DeployStep>(DeployStep.NEED_ACCESS_KEY)
  const [cloudVendor, setCloudVendor] = useState<CLOUD_VENDOR>(
    cloudVendorInLocalStorage || CLOUD_VENDOR.AWS
  )
  const [accessKey, setAccessKey] = useState<string>(accessKeyInLocalStorage)
  const [secretKey, setSecretKey] = useState<string>("")
  const [projects, setProjects] = useState<any[]>()
  const [isManuallyDeployed, setIsManuallyDeployed] = useBoolean()
  const [isDeploying, setIsDeploying] = useBoolean()
  const [projectId, setProjectId] = useState<string>()
  const [registerValidatorModalOpen, setRegisterValidatorModalOpen] =
    useBoolean(false)

  const { data: instance } = useSWR(
    appchainId ? `appchain/${appchainId}/recommend-instance` : null
  )

  const isDeployed = isShowRegister || isManuallyDeployed

  useEffect(() => {
    if (appchainId) {
      const ismd = localStorage.getItem(`manually-deployed-${appchainId}`)
      ismd === "true" && setIsManuallyDeployed.on()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appchainId])

  const isUnbonding = !!(validator && validator?.is_unbonding)

  const { accountId, network } = useWalletSelector()

  const onConfirmAccessKey = async () => {
    if (!accessKey) {
      return Toast.error("Please input access key")
    }
    if (!accountId) {
      return Toast.error("Please connect wallet")
    }

    setStep(DeployStep.CONFIRMED_ACCESS_KEY)
    window.localStorage.setItem("OCTOPUS_DEPLOYER_ACCESS_KEY", accessKey)
    window.localStorage.setItem("OCTOPUS_DEPLOYER_CLOUD_VENDOR", cloudVendor)

    try {
      const node = await getNodeDetail({
        cloudVendor,
        accessKey,
        appchainId: appchainId!,
        accountId,
        network,
      })
      if (!node) {
        setStep(DeployStep.NEED_SECRECT_KEY)
      }
    } catch (error) {
      Toast.error(error)
    }
  }

  return (
    <>
      {step === DeployStep.NEED_ACCESS_KEY && (
        <Initial
          validator={validator}
          cloudVendor={cloudVendor}
          setCloudVendor={setCloudVendor}
          setInputAccessKey={setAccessKey}
          setProjects={setProjects}
          myNodeSetOAuthUser={myNodeSetOAuthUser}
          cloudAccessKey={accessKey}
        />
      )}

      {step === DeployStep.CONFIRMED_ACCESS_KEY && (
        <Center minH="60px">
          <Spinner size="md" thickness="4px" speed="1s" color="octo-blue.500" />
        </Center>
      )}

      {step === DeployStep.NEED_SECRECT_KEY && (
        <>
          <Flex pt={4} pb={4} justifyContent="center" flexDirection="column">
            <Flex bg={inputBg} p={1} borderRadius="lg">
              <Input
                variant="unstyled"
                placeholder="Secret Key"
                w="100%"
                p={2}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
              />
            </Flex>

            <RecommendInstance appchainId={appchainId} />
          </Flex>
        </>
      )}

      {isDeployed ? (
        <Flex direction="column" mt={4} mb={2} gap={6}>
          <Button
            onClick={setRegisterValidatorModalOpen.on}
            colorScheme="octo-blue"
            isDisabled={!accountId || isUnbonding}
            width="100%"
          >
            {!accountId
              ? "Please Login"
              : isUnbonding
              ? "Unbonding"
              : "Register Validator"}
          </Button>
        </Flex>
      ) : (
        <Flex m={2} flexDirection="column" gap={2}>
          <Flex direction="row" gap={2}>
            <Button
              colorScheme="octo-blue"
              flex={isDeployed ? "" : "1"}
              width={isDeployed ? "100%" : ""}
              onClick={() => {
                if (step === DeployStep.NEED_ACCESS_KEY && accessKey) {
                  onConfirmAccessKey()
                }
              }}
              isDisabled={
                isDeploying ||
                !accessKey ||
                (cloudVendor === "GCP" && !projectId)
              }
            >
              {!!validator ? "Confirm" : "Deploy"}
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
                  )
                  setIsManuallyDeployed.on()
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

      <RegisterValidatorModal
        isOpen={registerValidatorModalOpen}
        onClose={setRegisterValidatorModalOpen.off}
        anchor={anchor}
        appchain={appchain}
      />
    </>
  )
}
