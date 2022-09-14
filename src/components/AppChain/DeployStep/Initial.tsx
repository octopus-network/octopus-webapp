import {
  Box,
  Button,
  CloseButton,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  Select,
  Text,
  useColorModeValue,
} from "@chakra-ui/react"
import { OAUTH_SCOPE } from "config/constants"
import { useEffect, useState } from "react"
import { FcGoogle } from "react-icons/fc"
import { CLOUD_VENDOR, Validator } from "types"

export default function Initial({
  cloudAccessKey,
  validator,
  cloudVendor,
  setCloudVendor,
  setInputAccessKey,
  setProjects,
  myNodeSetOAuthUser,
}: {
  cloudAccessKey: string
  validator?: Validator
  cloudVendor: CLOUD_VENDOR
  setCloudVendor: (cloudVendor: CLOUD_VENDOR) => void
  setInputAccessKey: (inputAccessKey: string) => void
  setProjects: (projects: any) => void
  myNodeSetOAuthUser: (user: any) => void
}) {
  const inputBg = useColorModeValue("#f5f7fa", "whiteAlpha.100")

  const [isAuthorized, setIsAuthorized] = useState(false)
  const [oauthUser, setOAuthUser] = useState<any>()
  const [authClient, setAuthClient] = useState<any>()

  const onOAuth = () => {
    authClient?.signIn()
  }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authClient])

  return (
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
                value={cloudAccessKey}
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
                  icon={<CloseButton boxSize="10px" />}
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
            It seems you're a validator already, enter Access Key to check your
            node status
          </Text>
        )}
      </Flex>
    </>
  )
}
