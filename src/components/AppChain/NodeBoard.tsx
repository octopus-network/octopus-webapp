import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  IconButton,
  Link,
  List,
  SimpleGrid,
  Skeleton,
  Tag,
  Text,
  useBoolean,
  useClipboard,
} from "@chakra-ui/react"

import {
  DownloadIcon,
  DeleteIcon,
  CheckIcon,
  CopyIcon,
  RepeatIcon,
} from "@chakra-ui/icons"
import { NODE_STATE_RECORD } from "config/constants"
import axios from "axios"
import { API_HOST } from "config"
import { useWalletSelector } from "components/WalletSelectorContextProvider"
import { Toast } from "components/common/toast"
import {
  AnchorContract,
  AppchainInfo,
  CLOUD_VENDOR,
  NodeState,
  Validator,
} from "types"
import { RegisterValidatorModal } from "views/Appchain/MyStaking/RegisterValidatorModal"
import { BsArrowUpRight } from "react-icons/bs"
import NodeManager from "utils/NodeManager"

export default function NodeBoard({
  node,
  cloudVendor,
  deployConfig,
  deployAccessKey,
  appchainId,
  setNode,
  appchain,
  anchor,
  validator,
}: {
  node?: any
  cloudVendor: CLOUD_VENDOR
  deployConfig?: any
  deployAccessKey: string
  appchainId?: string
  setNode: (node: any) => void
  appchain?: AppchainInfo
  anchor?: AnchorContract
  validator?: Validator
}) {
  const [isRefreshing, setIsRefreshing] = useBoolean()
  const [isApplying, setIsApplying] = useBoolean()
  const [isDeleting, setIsDeleting] = useBoolean()
  const [isDestroying, setIsDestroying] = useBoolean()
  const [registerValidatorModalOpen, setRegisterValidatorModalOpen] =
    useBoolean(false)

  const { hasCopied: hasNodeIdCopied, onCopy: onCopyNodeId } = useClipboard(
    node?.uuid || ""
  )

  const { accountId, network } = useWalletSelector()

  const onApplyNode = async () => {
    let secretKey = ""

    if (cloudVendor === CLOUD_VENDOR.AWS) {
      secretKey =
        window.prompt("Please enter the secret key of your server", "") ?? ""

      if (!secretKey) {
        return
      }
    } else {
      // const { access_token } = oauthUser.getAuthResponse()
      // secretKey = access_token
    }

    setIsApplying.on()
    await NodeManager.applyNode({
      uuid: node?.uuid,
      network,
      secretKey,
      user: node?.user,
    })
    window.location.reload()
  }

  const onDeleteNode = async () => {
    setIsDeleting.on()
    await NodeManager.deleteNode({ uuid: node.uuid, user: node.user, network })
    window.location.reload()
  }

  const onRefresh = () => {
    setIsRefreshing.on()
    NodeManager.getNodeDetail({
      appchainId: appchainId!,
      cloudVendor,
      accessKey: deployAccessKey,
      accountId: accountId!,
      network,
    })
      .then((res) => {
        setNode(res)
        setIsRefreshing.off()
      })
      .catch((err) => {
        setIsRefreshing.off()
        Toast.error(err)
      })
  }

  const onDestroyNode = () => {
    let secretKey

    if (cloudVendor === CLOUD_VENDOR.AWS) {
      secretKey = window.prompt(
        "Please enter the secret key of your server",
        ""
      )

      if (!secretKey) {
        return
      }
    } else {
      // const { access_token } = oauthUser.getAuthResponse()
      // secretKey = access_token
    }

    setIsDestroying.on()
    axios
      .delete(`${deployConfig.deployApiHost}/tasks/${node?.uuid}`, {
        data: {
          secret_key: secretKey,
        },
        headers: { authorization: node?.user },
      })
      .then((res) => {
        window.location.reload()
      })
  }

  return (
    <Box mt={3}>
      <List spacing={3}>
        <Flex justifyContent="space-between">
          <Text variant="gray" fontSize="sm">
            Status
          </Text>
          <Skeleton isLoaded={!isRefreshing}>
            <Tag
              colorScheme={NODE_STATE_RECORD[node.state as NodeState]?.color}
              size="sm"
            >
              {NODE_STATE_RECORD[node.state as NodeState]?.label}
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
            <IconButton aria-label="copy" onClick={onCopyNodeId} size="xs">
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
                {node.instance.region}@{node.instance.id}
              </Text>
              <Link href={node.instance.url} target="_blank">
                <IconButton aria-label="link" size="xs">
                  <BsArrowUpRight color="octo-blue" />
                </IconButton>
              </Link>
            </HStack>
          ) : (
            "-"
          )}
        </Flex>
      </List>
      <Box mt={3}>
        {node?.state === "0" ? (
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
        ) : node?.state === "10" || node?.state === "20" ? (
          <SimpleGrid columns={1}>
            <Button
              onClick={onRefresh}
              isDisabled={isRefreshing}
              isLoading={isRefreshing}
            >
              <RepeatIcon mr={1} /> Refresh
            </Button>
          </SimpleGrid>
        ) : node?.state === "11" || node?.state === "21" ? (
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
        ) : node?.state === "12" ? (
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
        ) : node?.state === "22" ? (
          <SimpleGrid columns={1}>
            <Button
              onClick={onDeleteNode}
              isDisabled={isDeleting}
              isLoading={isDeleting}
            >
              <Icon as={DeleteIcon} mr={2} boxSize={3} /> Delete
            </Button>
          </SimpleGrid>
        ) : node?.state === "30" ? (
          <SimpleGrid columns={1}>
            <Button as={Link} isExternal href={node.instance.ssh_key}>
              <Icon as={DownloadIcon} mr={2} boxSize={3} /> RSA
            </Button>
          </SimpleGrid>
        ) : null}
      </Box>

      {!validator && (
        <Button
          onClick={setRegisterValidatorModalOpen.on}
          colorScheme="octo-blue"
          isDisabled={!accountId}
          width="100%"
          mt={4}
        >
          {!accountId ? "Please Login" : "Register Validator"}
        </Button>
      )}

      <RegisterValidatorModal
        isOpen={registerValidatorModalOpen}
        onClose={setRegisterValidatorModalOpen.off}
        anchor={anchor}
        appchain={appchain}
      />
    </Box>
  )
}
