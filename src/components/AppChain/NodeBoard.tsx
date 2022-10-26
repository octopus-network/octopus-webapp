import {
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Icon,
  IconButton,
  Link,
  List,
  SimpleGrid,
  Spinner,
  Tag,
  Text,
  useBoolean,
  useClipboard,
  Tooltip,
  Progress,
} from "@chakra-ui/react";

import {
  DownloadIcon,
  DeleteIcon,
  CheckIcon,
  CopyIcon,
} from "@chakra-ui/icons";
import { NODE_STATE_RECORD } from "config/constants";
import { useWalletSelector } from "components/WalletSelectorContextProvider";
import {
  AnchorContract,
  AppchainInfo,
  CloudVendor,
  NodeState,
  Validator,
} from "types";
import { RegisterValidatorModal } from "views/Appchain/MyStaking/RegisterValidatorModal";
import { BsArrowUpRight, BsExclamationCircle } from "react-icons/bs";
import NodeManager from "utils/NodeManager";
import { FaAws, FaDigitalOcean } from "react-icons/fa";
import { BiInfoCircle } from "react-icons/bi";
import { IoIosWarning, IoMdWarning } from "react-icons/io";

export default function NodeBoard({
  node,
  cloudVendor,
  appchain,
  anchor,
  validator,
  onOpenInstance,
  metricBadge,
}: {
  node?: any;
  cloudVendor: CloudVendor;
  appchain?: AppchainInfo;
  anchor?: AnchorContract;
  validator?: Validator;
  onOpenInstance: () => void;
  metricBadge: boolean;
}) {
  const [isApplying, setIsApplying] = useBoolean();
  const [isDeleting, setIsDeleting] = useBoolean();

  const [registerValidatorModalOpen, setRegisterValidatorModalOpen] =
    useBoolean(false);

  const { hasCopied: hasNodeIdCopied, onCopy: onCopyNodeId } = useClipboard(
    node?.uuid || ""
  );

  const { accountId, network } = useWalletSelector();

  const onApplyNode = async () => {
    let secretKey = "";

    if (cloudVendor === CloudVendor.AWS) {
      secretKey =
        window.prompt("Please enter the secret key of your server", "") ?? "";

      if (!secretKey) {
        return;
      }
    } else {
      // const { access_token } = oauthUser.getAuthResponse()
      // secretKey = access_token
    }

    setIsApplying.on();
    await NodeManager.applyNode({
      uuid: node?.uuid,
      network,
      secretKey,
      user: node?.user,
    });
    window.location.reload();
  };

  const onDeleteNode = async () => {
    setIsDeleting.on();
    await NodeManager.deleteNode({ uuid: node.uuid, user: node.user, network });
    window.location.reload();
  };

  const syncingProgress =
    node.syncState.currentBlock && node.syncState.highestBlock
      ? (node.syncState.currentBlock * 100) / node.syncState.highestBlock
      : 0;

  return (
    <Box mt={3}>
      <List spacing={3}>
        <Flex justifyContent="space-between">
          <Text variant="gray" fontSize="md">
            Cloud
          </Text>
          {node.task.cloud_vendor === CloudVendor.AWS ? (
            <Flex alignItems="center" gap={2}>
              <Text fontSize="md">AWS</Text>
              <FaAws size={18} />
            </Flex>
          ) : (
            <Flex alignItems="center" gap={2}>
              <Text fontSize="md">Digital Ocean</Text>
              <FaDigitalOcean size={18} />
            </Flex>
          )}
        </Flex>
        <Flex justifyContent="space-between">
          <Text variant="gray" fontSize="md">
            Node Status
          </Text>
          <Tag
            colorScheme={NODE_STATE_RECORD[node.state as NodeState]?.color}
            size="sm"
          >
            {node.state === NodeState.RUNNING && !node.sync
              ? "Syncing"
              : NODE_STATE_RECORD[node.state as NodeState]?.label}
          </Tag>
        </Flex>
        <Flex justifyContent="space-between">
          <Text variant="gray" fontSize="md">
            Node ID
          </Text>
          <HStack>
            <Text
              fontSize="md"
              whiteSpace="nowrap"
              w="calc(160px - 30px)"
              overflow="hidden"
              textOverflow="ellipsis"
            >
              {node.uuid}
            </Text>
            {hasNodeIdCopied ? (
              <CheckIcon onClick={onCopyNodeId} />
            ) : (
              <CopyIcon onClick={onCopyNodeId} />
            )}
          </HStack>
        </Flex>
        <Flex justifyContent="space-between">
          <Text variant="gray" fontSize="md">
            Instance Link
          </Text>
          {node.instance ? (
            <HStack>
              <Text
                fontSize="md"
                whiteSpace="nowrap"
                w="calc(160px - 30px)"
                overflow="hidden"
                textOverflow="ellipsis"
              >
                {node.instance.region}@{node.instance.id}
              </Text>
              <Link href={node.instance.url} target="_blank">
                <BsArrowUpRight color="octo-blue" />
              </Link>
            </HStack>
          ) : (
            "-"
          )}
        </Flex>
        <Flex justifyContent="space-between">
          <Text variant="gray" fontSize="md">
            Instance Status
          </Text>
          <HStack position="relative">
            {metricBadge ? (
              <BsExclamationCircle color="red" onClick={onOpenInstance} />
            ) : (
              <BiInfoCircle onClick={onOpenInstance} />
            )}
          </HStack>
        </Flex>
      </List>
      <Box mt={3}>
        {node.state === NodeState.RUNNING && !node.sync && (
          <HStack>
            <Text variant="gray" fontSize="md">
              Syncing
            </Text>
            <Progress size="sm" flex={1} value={syncingProgress} />
          </HStack>
        )}
        {node?.state === NodeState.INIT ? (
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
        ) : node?.state === NodeState.APPLYING ||
          node?.state === NodeState.DESTROYING ? (
          <SimpleGrid columns={1}>
            <Center gap={4}>
              <Spinner
                size="md"
                thickness="4px"
                speed="1s"
                color="octo-blue.500"
              />
              <Text fontSize="md" color="gray">
                {NODE_STATE_RECORD[node.state as NodeState].label}
              </Text>
            </Center>
          </SimpleGrid>
        ) : node?.state === NodeState.APPLY_FAILED ||
          node?.state === NodeState.DESTROY_FAILED ? null : node?.state ===
          NodeState.RUNNING ? (
          <SimpleGrid
            columns={{ base: 1, md: node.instance?.ssh_key ? 2 : 1 }}
            spacing={4}
          >
            {node.instance?.ssh_key && (
              <Button as={Link} isExternal href={node.instance.ssh_key}>
                <Icon as={DownloadIcon} mr={2} boxSize={3} /> RSA
              </Button>
            )}
          </SimpleGrid>
        ) : node?.state === NodeState.DESTROYED ? (
          <SimpleGrid columns={1}>
            <Button
              onClick={onDeleteNode}
              isDisabled={isDeleting}
              isLoading={isDeleting}
            >
              <Icon as={DeleteIcon} mr={2} boxSize={3} /> Delete
            </Button>
          </SimpleGrid>
        ) : node?.state === NodeState.UPGRADING ? (
          <SimpleGrid columns={1}>
            {node.instance.ssh_key && (
              <Button as={Link} isExternal href={node.instance.ssh_key}>
                <Icon as={DownloadIcon} mr={2} boxSize={3} /> RSA
              </Button>
            )}
          </SimpleGrid>
        ) : null}
      </Box>

      {!validator && (
        <Tooltip
          label={
            !node?.sync
              ? "You will be able to register validator after node synced"
              : ""
          }
          bg="gray.300"
          color="black"
          p={4}
        >
          <Button
            onClick={node?.sync ? setRegisterValidatorModalOpen.on : undefined}
            colorScheme="octo-blue"
            isDisabled={!accountId}
            width="100%"
            opacity={node?.sync ? 1 : 0.5}
            mt={4}
          >
            {!accountId ? "Please Login" : "Register Validator"}
          </Button>
        </Tooltip>
      )}

      <RegisterValidatorModal
        isOpen={registerValidatorModalOpen}
        onClose={setRegisterValidatorModalOpen.off}
        anchor={anchor}
        appchain={appchain}
      />
    </Box>
  );
}
