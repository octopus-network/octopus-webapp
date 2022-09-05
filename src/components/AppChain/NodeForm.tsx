import { CloseIcon } from "@chakra-ui/icons"
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  Link,
  Select,
  Text,
  useBoolean,
  useColorModeValue,
} from "@chakra-ui/react"
import axios from "axios"
import { Toast } from "components/common/toast"
import { useWalletSelector } from "components/WalletSelectorContextProvider"
import { API_HOST } from "config"
import { useEffect, useState } from "react"
import { FcGoogle } from "react-icons/fc"
import useSWR from "swr"
import { AnchorContract, AppchainInfo, CLOUD_VENDOR, Validator } from "types"
import { RegisterValidatorModal } from "views/Appchain/MyStaking/RegisterValidatorModal"

const OAUTH_SCOPE =
  "https://www.googleapis.com/auth/cloud-platform.read-only https://www.googleapis.com/auth/compute"

export default function NodeForm({
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
  const cloudVendorInLocalStorage = window.localStorage.getItem(
    "OCTOPUS_DEPLOYER_CLOUD_VENDOR"
  ) as CLOUD_VENDOR
  const accessKeyInLocalStorage =
    window.localStorage.getItem("OCTOPUS_DEPLOYER_ACCESS_KEY") ||
    window.localStorage.getItem("accessKey") ||
    ""

  const { data: deployConfig } = useSWR("deploy-config")
  const inputBg = useColorModeValue("#f5f7fa", "whiteAlpha.100")

  const [cloudVendor, setCloudVendor] = useState<CLOUD_VENDOR>(
    cloudVendorInLocalStorage || CLOUD_VENDOR.AWS
  )
  const [accessKey, setAccessKey] = useState<string>(accessKeyInLocalStorage)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [oauthUser, setOAuthUser] = useState<any>()
  const [authClient, setAuthClient] = useState<any>()
  const [projects, setProjects] = useState<any[]>()
  const [projectId, setProjectId] = useState<string>()
  const [inputAccessKey, setInputAccessKey] = useState("")
  const [isLoadingNode, setIsLoadingNode] = useBoolean()
  const [isDeploying, setIsDeploying] = useBoolean()
  const [deployRegion, setDeployRegion] = useState<string>("")
  const [registerValidatorModalOpen, setRegisterValidatorModalOpen] =
    useBoolean(false)
  const [isManuallyDeployed, setIsManuallyDeployed] = useState(false)

  const isUnbonding = !!(validator && validator?.is_unbonding)

  const { accountId } = useWalletSelector()

  const onOAuth = () => {
    authClient?.signIn()
  }

  useEffect(() => {
    if (appchainId) {
      const ismd = localStorage.getItem(`manually-deployed-${appchainId}`)
      setIsManuallyDeployed(ismd === "true")
    }
  }, [appchainId])

  useEffect(() => {
    window.gapi.load("client", () => {
      window.gapi.client
        .init({
          apiKey: "AIzaSyCXBs_7uR9X7wNIWgNuD5D7nvTniKsfjGU",
          clientId:
            "398338012986-f9ge03gubuvksee6rsmtorrpgtrsppf2.apps.googleusercontent.com",
          scope: OAUTH_SCOPE,
          discoveryDocs: [
            "https://www.googleapis.com/discovery/v1/apis/compute/v1/rest",
            "https://cloudresourcemanager.googleapis.com/$discovery/rest?version=v1",
          ],
        })
        .then(() => {
          const client = window.gapi.auth2.getAuthInstance()
          setAuthClient(client)
        })
    })
  }, [])

  useEffect(() => {
    if (!authClient) {
      return
    }

    const checkStatus = () => {
      const user = authClient.currentUser.get()

      const authorized = user.hasGrantedScopes(OAUTH_SCOPE)
      setIsAuthorized(authorized)
      if (authorized) {
        setOAuthUser(user)
        myNodeSetOAuthUser(user)

        const request = window.gapi.client.request({
          method: "GET",
          path: "https://cloudresourcemanager.googleapis.com/v1/projects",
        })

        request.execute((res: any) => {
          setProjects(res?.projects)
          console.log(res)
        })
      }
    }

    if (authClient.isSignedIn.get()) {
      checkStatus()
    }

    authClient.isSignedIn.listen(checkStatus)
  }, [authClient])

  const onNextStep = () => {
    setIsLoadingNode.on()

    const key =
      cloudVendor === "AWS"
        ? inputAccessKey
        : oauthUser.getBasicProfile().getEmail()

    window.localStorage.setItem("OCTOPUS_DEPLOYER_CLOUD_VENDOR", cloudVendor)
    window.localStorage.setItem("OCTOPUS_DEPLOYER_ACCESS_KEY", key)

    axios
      .get(`${API_HOST}/node/${cloudVendor}/${key}/${appchainId}/${accountId}`)
      .then((res) => res.data)
      .then((res) => {
        if (res) {
          setNode(res)
        }
        setAccessKey(key)
        setIsLoadingNode.off()
      })
  }

  const onDeploy = () => {
    setIsDeploying.on()
    axios
      .post(`${API_HOST}/deploy-node`, {
        appchain: appchainId,
        cloudVendor,
        accessKey,
        accountId: accountId,
        region: deployRegion,
        project: projectId,
      })
      .then((res) => res.data)
      .then((res) => {
        if (res) {
          setNode(res)
        }
        setIsDeploying.off()
      })
  }

  let content = null

  const onDeployPressed = () => {
    if (validator || !accessKey) {
      if (
        !cloudVendor ||
        isDeploying ||
        (cloudVendor === "AWS" ? !inputAccessKey : !isAuthorized)
      ) {
        return Toast.error("Invalid access key")
      }
      onNextStep()
    } else {
      onDeploy()
    }
  }

  if (validator || !accessKey) {
    content = (
      <>
        <Flex pt={4} pb={4} justifyContent="center" flexDirection="column">
          <Flex bg={inputBg} p={1} borderRadius="lg">
            <Box>
              <Select
                variant="unstyled"
                p={2}
                defaultValue={cloudVendor}
                onChange={(e) => setCloudVendor(e.target.value as CLOUD_VENDOR)}
              >
                <option value="AWS">AWS</option>
                {/* <option value="GCP">GCP</option> */}
              </Select>
            </Box>
            <Flex flex={1} alignItems="center">
              {cloudVendor === "AWS" ? (
                <Input
                  variant="unstyled"
                  placeholder="Access Key"
                  w="100%"
                  p={2}
                  onChange={(e) => setInputAccessKey(e.target.value)}
                />
              ) : isAuthorized ? (
                <HStack>
                  <Heading fontSize="md">
                    {oauthUser?.getBasicProfile()?.getEmail()}
                  </Heading>
                  <IconButton
                    size="xs"
                    aria-label="logout"
                    isRound
                    onClick={authClient?.signOut}
                    disabled={!authClient}
                    icon={<CloseIcon boxSize="10px" />}
                  />
                </HStack>
              ) : (
                <Button
                  size="sm"
                  onClick={onOAuth}
                  disabled={!authClient}
                  variant="ghost"
                  colorScheme="octo-blue"
                >
                  <Icon as={FcGoogle} mr={1} /> Sign in with Google
                </Button>
              )}
            </Flex>
          </Flex>
          {!!validator && (
            <Text fontSize="sm" variant="gray" mt={1}>
              It seems you're a validator already, enter Access Key to check
              your node status
            </Text>
          )}
        </Flex>
      </>
    )
  } else {
    content = (
      <Flex pt={6} pb={6} justifyContent="center" flexDirection="column">
        {cloudVendor === "GCP" ? (
          <Flex bg={inputBg} p={1} borderRadius="lg" alignItems="center" mb={2}>
            <Box p={2}>
              <Text variant="gray">Projects</Text>
            </Box>
            <Box flex={1}>
              <Select
                variant="unstyled"
                p={2}
                placeholder="Select Project"
                onChange={(e) => setProjectId(e.target.value)}
                textAlign="right"
              >
                {projects?.map((project: any, idx: number) => (
                  <option value={project.projectId} key={`project-${idx}`}>
                    {project.name}
                  </option>
                ))}
              </Select>
            </Box>
          </Flex>
        ) : null}
        <Flex bg={inputBg} p={1} borderRadius="lg" alignItems="center">
          <Box p={2}>
            <Text variant="gray">Deploy region</Text>
          </Box>
          <Box flex={1}>
            <Select
              variant="unstyled"
              p={2}
              defaultValue=""
              onChange={(e) => setDeployRegion(e.target.value)}
              textAlign="right"
            >
              {deployConfig?.regions.map((region: any, idx: number) => (
                <option value={region.value} key={`option-${idx}`}>
                  {region.label}
                </option>
              ))}
            </Select>
          </Box>
        </Flex>
      </Flex>
    )
  }

  const isDeployed = isShowRegister || isManuallyDeployed

  const deployBtn = (
    <Button
      colorScheme="octo-blue"
      flex={isDeployed ? "" : "1"}
      width={isDeployed ? "100%" : ""}
      onClick={onDeployPressed}
      isDisabled={isDeploying || (cloudVendor === "GCP" && !projectId)}
    >
      {!!validator ? "Confirm" : "Deploy"}
    </Button>
  )

  return (
    <>
      {content}
      {isDeployed ? (
        <Flex direction="column" mt={4} mb={2} gap={6}>
          {deployBtn}
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
            {deployBtn}

            <Text padding="2">OR</Text>

            <Button
              colorScheme="octo-blue"
              variant="outline"
              flex="1"
              onClick={() => {
                localStorage.setItem(`manually-deployed-${appchainId}`, "true")
                setIsManuallyDeployed(true)
              }}
            >
              Deployed manually
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
