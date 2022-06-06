import React, { useState, useEffect } from 'react'
import axios from 'axios'
import useSWR from 'swr'

import {
  Box,
  Heading,
  Button,
  Text,
  List,
  Icon,
  Flex,
  SimpleGrid,
  Select,
  Spinner,
  useClipboard,
  Center,
  Link,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Input,
  Tag,
  IconButton,
  useColorModeValue,
  useBoolean,
  Skeleton,
} from '@chakra-ui/react'

import {
  DownloadIcon,
  DeleteIcon,
  CheckIcon,
  CopyIcon,
  RepeatIcon,
} from '@chakra-ui/icons'

import { CloseIcon } from '@chakra-ui/icons'
import { BsFillTerminalFill } from 'react-icons/bs'
import { HiUpload } from 'react-icons/hi'
import { TiKey } from 'react-icons/ti'
import { BsThreeDots } from 'react-icons/bs'
import { API_HOST } from 'config'
import { Alert } from 'components'
import { useGlobalStore } from 'stores'
import { SetSessionKeyModal } from './SetSessionKeyModal'
import type { ApiPromise } from '@polkadot/api'
import { FcGoogle } from 'react-icons/fc'

import { InstanceInfoModal } from './InstanceInfoModal'

type MyNodeProps = {
  appchainId: string | undefined
  appchainApi: ApiPromise | undefined
  needKeys: boolean
}

const cloudVendorInLocalStorage =
  window.localStorage.getItem('OCTOPUS_DEPLOYER_CLOUD_VENDOR') || ''
const accessKeyInLocalStorage =
  window.localStorage.getItem('OCTOPUS_DEPLOYER_ACCESS_KEY') ||
  window.localStorage.getItem('accessKey') ||
  ''

const statesRecord: any = {
  '0': { label: 'Init', color: 'blue', state: 0 },
  '10': { label: 'Applying', color: 'teal', state: 10 },
  '11': { label: 'Apply Failed', color: 'red', state: 11 },
  '12': { label: 'Running', color: 'octo-blue', state: 12 },
  '20': { label: 'Destroying', color: 'teal', state: 20 },
  '21': { label: 'Destroy Failed', color: 'orange', state: 21 },
  '22': { label: 'Destroyed', color: 'gray', state: 22 },
  '30': { label: 'Upgrading', color: 'green', state: 30 },
}

const OAUTH_SCOPE = 'https://www.googleapis.com/auth/cloud-platform.read-only'

export const MyNode: React.FC<MyNodeProps> = ({
  appchainId,
  needKeys,
  appchainApi,
}) => {
  const bg = useColorModeValue('white', '#15172c')

  const [cloudVendor, setCloudVendor] = useState<string>(
    cloudVendorInLocalStorage || 'AWS'
  )
  const [accessKey, setAccessKey] = useState<string>(accessKeyInLocalStorage)
  const [node, setNode] = useState<any>()

  const [isInitializing, setIsInitializing] = useBoolean()
  const [isLoadingNode, setIsLoadingNode] = useBoolean()
  const [isDeploying, setIsDeploying] = useBoolean()
  const [isDeleting, setIsDeleting] = useBoolean()
  const [isApplying, setIsApplying] = useBoolean()
  const [isRefreshing, setIsRefreshing] = useBoolean()
  const [isDestroying, setIsDestroying] = useBoolean()
  const [isUpgrading, setIsUpgrading] = useBoolean()

  const [nodeMetrics, setNodeMetrics] = useState<any>()

  const [upgradeAlertOpen, setUpgradeAlertOpen] = useBoolean()
  const [setSessionKeyModalOpen, setSetSessionKeyModalOpen] = useBoolean()
  const [instanceInfoModalOpen, setInstanceInfoModalOpen] = useBoolean()

  const [isImageNeedUpgrade, setIsImageNeedUpgrade] = useBoolean()
  const [oauthUser, setOAuthUser] = useState<any>()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [authClient, setAuthClient] = useState<any>()
  const [projects, setProjects] = useState<any[]>()
  const [projectId, setProjectId] = useState<string>()
  const [deployRegion, setDeployRegion] = useState<string>('')

  const [inputAccessKey, setInputAccessKey] = useState('')

  const inputBg = useColorModeValue('#f5f7fa', 'whiteAlpha.100')

  const { data: deployConfig } = useSWR('deploy-config')

  const { global } = useGlobalStore()
  const { hasCopied: hasInstanceCopied, onCopy: onCopyInstance } = useClipboard(
    node?.instance ? `${node.instance.user}@${node.instance.ip}` : ''
  )

  const { hasCopied: hasNodeIdCopied, onCopy: onCopyNodeId } = useClipboard(
    node?.uuid || ''
  )

  useEffect(() => {
    window.gapi.load('client', () => {
      window.gapi.client.init({
        'apiKey': 'AIzaSyCXBs_7uR9X7wNIWgNuD5D7nvTniKsfjGU',
        'clientId': '398338012986-f9ge03gubuvksee6rsmtorrpgtrsppf2.apps.googleusercontent.com',
        'scope': OAUTH_SCOPE,
        'discoveryDocs': [
          'https://www.googleapis.com/discovery/v1/apis/compute/v1/rest',
          'https://cloudresourcemanager.googleapis.com/$discovery/rest?version=v1'
        ]
      }).then(() => {
        const client = window.gapi.auth2.getAuthInstance();
        setAuthClient(client);
      });
    });
  }, []);
 
  useEffect(() => {
    if (!authClient) {
      return;
    }

    const checkStatus = () => {
      const user = authClient.currentUser.get()
     
      const authorized = user.hasGrantedScopes(OAUTH_SCOPE)
      setIsAuthorized(authorized)
      if (authorized) {
        setOAuthUser(user)

        const request = window.gapi.client.request({
          'method': 'GET',
          'path': 'https://cloudresourcemanager.googleapis.com/v1/projects'
        })

        request.execute((res: any) => {
          setProjects(res?.projects)
        })
      }
    }

    if (authClient.isSignedIn.get()) {
      checkStatus()
    }

    authClient.isSignedIn.listen(checkStatus)
    
  }, [authClient])

  useEffect(() => {
    if (
      !accessKeyInLocalStorage ||
      !appchainId ||
      !cloudVendorInLocalStorage ||
      !global.accountId
    ) {
      return
    }
    setIsInitializing.on()
    axios
      .get(
        `
      ${API_HOST}/node/${cloudVendorInLocalStorage}/${accessKeyInLocalStorage}/${appchainId}/${global.accountId}
    `
      )
      .then((res) => res.data)
      .then((res) => {
        if (res) {
          setNode(res)
        }
        setIsInitializing.off()
      })
  }, [appchainId, global])

  useEffect(() => {
    if (!node || !deployConfig || !appchainId) {
      return
    }

    if (global.accountId && node?.state === '12') {
      axios
        .get(
          `
        ${API_HOST}/node-metrics/${node.uuid}/${cloudVendorInLocalStorage}/${accessKeyInLocalStorage}/${appchainId}/${global.accountId}
      `
        )
        .then((res) => res.data)
        .then((res) => {
          setNodeMetrics(res)
        })
    }

    if (
      deployConfig.baseImages[appchainId]?.image &&
      node.task?.base_image &&
      node.task?.base_image !== deployConfig.baseImages[appchainId].image &&
      (!deployConfig.upgradeWhitelist?.length ||
        deployConfig.upgradeWhitelist.includes(global.accountId))
    ) {
      setIsImageNeedUpgrade.on()
    } else {
      setIsImageNeedUpgrade.off()
    }
  }, [node, deployConfig, appchainId, global])

  const onNextStep = () => {
    
    setIsLoadingNode.on()
 
    const key = cloudVendor === 'AWS' ? inputAccessKey : oauthUser.getBasicProfile().getEmail()

    window.localStorage.setItem('OCTOPUS_DEPLOYER_CLOUD_VENDOR', cloudVendor)
    window.localStorage.setItem('OCTOPUS_DEPLOYER_ACCESS_KEY', key)

    axios
      .get(
        `${API_HOST}/node/${cloudVendor}/${key}/${appchainId}/${global.accountId}`
      )
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
      .post(
        `${API_HOST}/deploy-node`,
        {
          appchain: appchainId,
          cloudVendor,
          accessKey,
          accountId: global.accountId,
          region: deployRegion,
          project: projectId
        }
      )
      .then((res) => res.data)
      .then((res) => {
        if (res) {
          setNode(res)
        }
        setIsDeploying.off()
      })
  }

  const onRefresh = () => {
    setIsRefreshing.on()
    axios
      .get(
        `${API_HOST}/node/${cloudVendor}/${accessKey}/${appchainId}/${global.accountId}`
      )
      .then((res) => res.data)
      .then((res) => {
        if (res) {
          setNode(res)
        }

        setIsRefreshing.off()
      })
  }

  const onClearCache = () => {
    window.localStorage.removeItem('OCTOPUS_DEPLOYER_CLOUD_VENDOR')
    window.localStorage.removeItem('OCTOPUS_DEPLOYER_ACCESS_KEY')
    window.localStorage.removeItem('accessKey')
    window.location.reload()
  }

  const onApplyNode = () => {

    let secretKey;

    if (cloudVendor === 'AWS') {
      secretKey = window.prompt(
        'Please enter the secret key of your server',
        ''
      )
  
      if (!secretKey) {
        return
      }
    } else {
      const { access_token } = oauthUser.getAuthResponse()
      secretKey = access_token
    }
    

    setIsApplying.on()
    axios
      .put(
        `${deployConfig.deployApiHost}/tasks/${node?.uuid}`,
        {
          action: 'apply',
          secret_key: secretKey,
        },
        {
          headers: { authorization: node?.user },
        }
      )
      .then((res) => {
        window.location.reload()
      })
  }

  const onUpgradeImage = () => {
    if (!appchainId) {
      return
    }

    const secretKey = window.prompt(
      'Please enter the secret key of your server',
      ''
    )

    if (!secretKey) {
      return
    }

    setIsUpgrading.on()
    axios
      .put(
        `${deployConfig.deployApiHost}/tasks/${node?.uuid}`,
        {
          action: 'update',
          secret_key: secretKey,
          base_image: deployConfig.baseImages[appchainId]?.image,
        },
        {
          headers: { authorization: node?.user },
        }
      )
      .then((res) => {
        window.location.reload()
      })
  }

  const onDestroyNode = () => {
    const secretKey = window.prompt(
      'Please enter the secret key of your server',
      ''
    )

    if (!secretKey) {
      return
    }

    setIsDestroying.on()
    axios
      .put(
        `${deployConfig.deployApiHost}/tasks/${node?.uuid}`,
        {
          action: 'destroy',
          secret_key: secretKey,
        },
        {
          headers: { authorization: node?.user },
        }
      )
      .then((res) => {
        window.location.reload()
      })
  }

  const onDeleteNode = () => {
    setIsDeleting.on()
    axios
      .delete(`${deployConfig.deployApiHost}/tasks/${node?.uuid}`, {
        headers: { authorization: node?.user },
      })
      .then((res) => {
        window.location.reload()
      })
  }

  const onOAuth = () => {
    authClient?.signIn();
  }

  return (
    <>
      <Box position="relative" p={6} pt={4} pb={6} borderRadius="lg" bg={bg}>
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
              {needKeys ||
              isImageNeedUpgrade ||
              nodeMetrics?.filesystem?.percentage > 0.8 ? (
                <Box
                  position="absolute"
                  top="0px"
                  right="0px"
                  boxSize={2}
                  bg="red"
                  borderRadius="full"
                />
              ) : null}
            </MenuButton>
            <MenuList>
              <MenuItem
                position="relative"
                onClick={setSetSessionKeyModalOpen.on}
                isDisabled={!appchainApi}
              >
                <Icon as={TiKey} mr={2} boxSize={4} /> Set Session Key
                {needKeys ? (
                  <Box
                    position="absolute"
                    top="10px"
                    right="10px"
                    boxSize={2}
                    bg="red"
                    borderRadius="full"
                  />
                ) : null}
              </MenuItem>
              <MenuItem
                position="relative"
                onClick={setInstanceInfoModalOpen.on}
                isDisabled={!nodeMetrics}
              >
                <Icon as={BsFillTerminalFill} mr={2} boxSize={4} /> Instance
                Info
                {nodeMetrics?.filesystem?.percentage > 0.8 ? (
                  <Box
                    position="absolute"
                    top="10px"
                    right="10px"
                    boxSize={2}
                    bg="red"
                    borderRadius="full"
                  />
                ) : null}
              </MenuItem>
              <MenuItem
                position="relative"
                isDisabled={!isImageNeedUpgrade}
                onClick={setUpgradeAlertOpen.on}
              >
                <Icon as={HiUpload} mr={2} boxSize={3} /> Upgrade Image
                {isImageNeedUpgrade ? (
                  <Box
                    position="absolute"
                    top="10px"
                    right="10px"
                    boxSize={2}
                    bg="red"
                    borderRadius="full"
                  />
                ) : null}
              </MenuItem>
              <MenuItem
                isDisabled={!accessKeyInLocalStorage}
                onClick={onClearCache}
              >
                <Icon as={DeleteIcon} mr={2} boxSize={3} /> Clear Access Key
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
        {isInitializing ? (
          <Center minH="160px">
            <Spinner
              size="md"
              thickness="4px"
              speed="1s"
              color="octo-blue.500"
            />
          </Center>
        ) : node ? (
          <Box mt={3}>
            <List spacing={3}>
              <Flex justifyContent="space-between">
                <Text variant="gray" fontSize="sm">
                  Status
                </Text>
                <Skeleton isLoaded={!isRefreshing}>
                  <Tag colorScheme={statesRecord[node.state]?.color} size="sm">
                    {statesRecord[node.state]?.label}
                  </Tag>
                </Skeleton>
              </Flex>
              <Flex justifyContent="space-between">
                <Text variant="gray" fontSize="sm">
                  Node ID
                </Text>
                <HStack>
                  <Text
                    fontSize="sm"
                    whiteSpace="nowrap"
                    w="calc(160px - 30px)"
                    overflow="hidden"
                    textOverflow="ellipsis"
                  >
                    {node.uuid}
                  </Text>
                  <IconButton
                    aria-label="copy"
                    onClick={onCopyNodeId}
                    size="xs"
                  >
                    {hasNodeIdCopied ? <CheckIcon /> : <CopyIcon />}
                  </IconButton>
                </HStack>
              </Flex>
              <Flex justifyContent="space-between">
                <Text variant="gray" fontSize="sm">
                  Instance
                </Text>
                {node.instance ? (
                  <HStack>
                    <Text
                      fontSize="sm"
                      whiteSpace="nowrap"
                      w="calc(160px - 30px)"
                      overflow="hidden"
                      textOverflow="ellipsis"
                    >
                      {node.instance.user}@{node.instance.ip}
                    </Text>
                    <IconButton
                      aria-label="copy"
                      onClick={onCopyInstance}
                      size="xs"
                    >
                      {hasInstanceCopied ? <CheckIcon /> : <CopyIcon />}
                    </IconButton>
                  </HStack>
                ) : (
                  '-'
                )}
              </Flex>
            </List>
            <Box mt={3}>
              {node?.state === '0' ? (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Button
                    colorScheme="octo-blue"
                    onClick={onApplyNode}
                    isDisabled={isApplying}
                    isLoading={isApplying}
                  >
                    Apply
                  </Button>
                  <Button
                    onClick={onDeleteNode}
                    isDisabled={isDeleting}
                    isLoading={isDeleting}
                  >
                    <Icon as={DeleteIcon} mr={2} boxSize={3} /> Delete
                  </Button>
                </SimpleGrid>
              ) : node?.state === '10' || node?.state === '20' ? (
                <SimpleGrid columns={1}>
                  <Button
                    onClick={onRefresh}
                    isDisabled={isRefreshing}
                    isLoading={isRefreshing}
                  >
                    <RepeatIcon mr={1} /> Refresh
                  </Button>
                </SimpleGrid>
              ) : node?.state === '11' || node?.state === '21' ? (
                <SimpleGrid columns={1}>
                  <Button
                    colorScheme="red"
                    onClick={onDestroyNode}
                    isDisabled={isDestroying}
                    isLoading={isDestroying}
                  >
                    <Icon as={DeleteIcon} mr={2} boxSize={3} /> Destroy
                  </Button>
                </SimpleGrid>
              ) : node?.state === '12' ? (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Button as={Link} isExternal href={node.instance.ssh_key}>
                    <Icon as={DownloadIcon} mr={2} boxSize={3} /> RSA
                  </Button>
                  <Button
                    colorScheme="red"
                    onClick={onDestroyNode}
                    isDisabled={isDestroying}
                    isLoading={isDestroying}
                  >
                    <Icon as={DeleteIcon} mr={2} boxSize={3} /> Destroy
                  </Button>
                </SimpleGrid>
              ) : node?.state === '22' ? (
                <SimpleGrid columns={1}>
                  <Button
                    onClick={onDeleteNode}
                    isDisabled={isDeleting}
                    isLoading={isDeleting}
                  >
                    <Icon as={DeleteIcon} mr={2} boxSize={3} /> Delete
                  </Button>
                </SimpleGrid>
              ) : node?.state === '30' ? (
                <SimpleGrid columns={1}>
                  <Button as={Link} isExternal href={node.instance.ssh_key}>
                    <Icon as={DownloadIcon} mr={2} boxSize={3} /> RSA
                  </Button>
                </SimpleGrid>
              ) : null}
            </Box>
          </Box>
        ) : accessKey ? (
          <>
            <Flex minH="120px" justifyContent="center" flexDirection="column">
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
            <Button
              colorScheme="octo-blue"
              width="100%"
              onClick={onDeploy}
              isLoading={isDeploying}
              isDisabled={isDeploying || (cloudVendor === 'GCP' && !projectId)}
            >
              Deploy
            </Button>
          </>
        ) : (
          <>
            <Flex minH="120px" justifyContent="center" flexDirection="column">
              <Flex bg={inputBg} p={1} borderRadius="lg">
                <Box>
                  <Select
                    variant="unstyled"
                    p={2}
                    defaultValue={cloudVendor}
                    onChange={(e) => setCloudVendor(e.target.value)}
                  >
                    <option value="AWS">AWS</option>
                    <option value="GCP">GCP</option>
                  </Select>
                </Box>
                <Flex flex={1} alignItems="center">
                  {
                    cloudVendor === 'AWS' ?
                    <Input
                      variant="unstyled"
                      placeholder="Access Key"
                      w="100%"
                      p={2}
                      onChange={(e) => setInputAccessKey(e.target.value)}
                    /> :
                    isAuthorized ?
                    <HStack>
                      <Heading fontSize="md">{oauthUser?.getBasicProfile()?.getEmail()}</Heading>
                      <IconButton size="xs" aria-label="logout" isRound onClick={authClient?.signOut} 
                        disabled={!authClient} icon={<CloseIcon boxSize="10px" />} />
                    </HStack> :
                    <Button size="sm" onClick={onOAuth} disabled={!authClient} variant="ghost" colorScheme="octo-blue">
                      <Icon as={FcGoogle} mr={1} /> Sign in with Google
                    </Button>
                  }
                </Flex>
              </Flex>
            </Flex>
            <Button
              colorScheme="octo-blue"
              width="100%"
              isDisabled={!cloudVendor || isLoadingNode || (
                cloudVendor === 'AWS' ? 
                !inputAccessKey :
                !isAuthorized
              )}
              onClick={onNextStep}
              isLoading={isLoadingNode}
            >
              Deploy A Node
            </Button>
          </>
        )}
      </Box>
      <SetSessionKeyModal
        appchainApi={appchainApi}
        isOpen={setSessionKeyModalOpen}
        onClose={setSetSessionKeyModalOpen.off}
      />

      <InstanceInfoModal
        metrics={nodeMetrics}
        isOpen={instanceInfoModalOpen}
        onClose={setInstanceInfoModalOpen.off}
      />

      <Alert
        isOpen={upgradeAlertOpen}
        onClose={setUpgradeAlertOpen.off}
        title="Upgrade Image"
        confirmButtonText="Upgrade"
        isConfirming={isUpgrading}
        message="Are you sure to upgrade your node image?"
        onConfirm={onUpgradeImage}
        confirmButtonColor="red"
      />
    </>
  )
}
