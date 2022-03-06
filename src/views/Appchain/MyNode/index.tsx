import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useSWR from 'swr';

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
  Skeleton
} from '@chakra-ui/react';

import { 
  DownloadIcon, 
  DeleteIcon, 
  CheckIcon, 
  CopyIcon,
  RepeatIcon
} from '@chakra-ui/icons';

import { TiKey } from 'react-icons/ti';
import { BsThreeDots } from 'react-icons/bs';
import { API_HOST } from 'config';
import { SetSessionKeyModal } from './SetSessionKeyModal';
import type { ApiPromise } from '@polkadot/api';

type MyNodeProps = {
  appchainId: string | undefined;
  appchainApi: ApiPromise | undefined;
  needKeys: boolean;
}

const cloudVendorInLocalStorage = window.localStorage.getItem('OCTOPUS_DEPLOYER_CLOUD_VENDOR') || '';
const accessKeyInLocalStorage = window.localStorage.getItem('OCTOPUS_DEPLOYER_ACCESS_KEY') || window.localStorage.getItem('accessKey') || '';

const statesRecord: any = {
  '0': { label: 'Init', color: 'blue', state: 0 },
  '10': { label: 'Applying', color: 'teal', state: 10 },
  '11': { label: 'Apply Failed', color: 'red', state: 11 },
  '12': { label: 'Running', color: 'octo-blue', state: 12 },
  '20': { label: 'Destroying', color: 'teal', state: 20 },
  '21': { label: 'Destroy Failed', color: 'orange', state: 21 },
  '22': { label: 'Destroyed', color: 'gray', state: 22 }
}

export const MyNode: React.FC<MyNodeProps> = ({ appchainId, needKeys, appchainApi }) => {
  const bg = useColorModeValue('white', '#15172c');

  const [cloudVendor, setCloudVendor] = useState<string>(cloudVendorInLocalStorage || 'AWS');
  const [accessKey, setAccessKey] = useState<string>(accessKeyInLocalStorage);
  const [node, setNode] = useState<any>();

  const [isInitializing, setIsInitializing] = useBoolean();
  const [isLoadingNode, setIsLoadingNode] = useBoolean();
  const [isDeploying, setIsDeploying] = useBoolean();
  const [isDeleting, setIsDeleting] = useBoolean();
  const [isApplying, setIsApplying] = useBoolean();
  const [isRefreshing, setIsRefreshing] = useBoolean();
  const [isDestroying, setIsDestroying] = useBoolean();
  const[setSessionKeyModalOpen, setSetSessionKeyModalOpen] = useBoolean();

  const [deployRegion, setDeployRegion] = useState<string>('');

  const [inputAccessKey, setInputAccessKey] = useState('');

  const inputBg = useColorModeValue('#f5f7fa', 'whiteAlpha.100');

  const { data: deployConfig } = useSWR('deploy-config');

  const { hasCopied: hasInstanceCopied, onCopy: onCopyInstance } = useClipboard(
    node?.instance ? `${node.instance.user}@${node.instance.ip}` : ''
  );

  const { hasCopied: hasNodeIdCopied, onCopy: onCopyNodeId } = useClipboard(node?.uuid || '');

  useEffect(() => {
    if (!accessKeyInLocalStorage || !appchainId || !cloudVendorInLocalStorage) {
      return;
    }
    setIsInitializing.on();
    axios.get(`${API_HOST}/node/${cloudVendorInLocalStorage}/${accessKeyInLocalStorage}/${appchainId}`).then(res => res.data).then(res => {
      if (res) {
        setNode(res);
      }
      setIsInitializing.off();
    });
  }, [appchainId]);

  const onNextStep = () => {
    window.localStorage.setItem('OCTOPUS_DEPLOYER_CLOUD_VENDOR', cloudVendor);
    window.localStorage.setItem('OCTOPUS_DEPLOYER_ACCESS_KEY', inputAccessKey);

    setIsLoadingNode.on();
    axios.get(`${API_HOST}/node/${cloudVendor}/${inputAccessKey}/${appchainId}`).then(res => res.data).then(res => {
      if (res) {
        setNode(res);
      }
      setAccessKey(inputAccessKey);
      setIsLoadingNode.off();
    });
  }

  const onDeploy = () => {
    setIsDeploying.on();
    axios.post(`${API_HOST}/deploy-node/${cloudVendor}/${accessKey}/${appchainId}/${deployRegion}`).then(res => res.data).then(res => {
      if (res) {
        setNode(res);
      }
      setIsDeploying.off();
    });
  }

  const onRefresh = () => {
    setIsRefreshing.on();
    axios.get(`${API_HOST}/node/${cloudVendor}/${accessKey}/${appchainId}`).then(res => res.data).then(res => {
      if (res) {
        setNode(res);
      }
      
      setIsRefreshing.off();
    });
  }

  const onClearCache = () => {
    window.localStorage.removeItem('OCTOPUS_DEPLOYER_CLOUD_VENDOR');
    window.localStorage.removeItem('OCTOPUS_DEPLOYER_ACCESS_KEY');
    window.localStorage.removeItem('accessKey');
    window.location.reload();
  }

  const onApplyNode = () => {
    const secretKey = window.prompt('Please enter the secret key of your server', '');

    if (!secretKey) {
      return;
    }

    setIsApplying.on();
    axios.put(`${deployConfig.deployApiHost}/tasks/${node?.uuid}`, {
      action: 'apply', secret_key: secretKey
    }, {
      headers: { authorization: node?.user }
    }).then(res => {
      window.location.reload();
    });
  }

  const onDestroyNode = () => {
    const secretKey = window.prompt('Please enter the secret key of your server', '');

    if (!secretKey) {
      return;
    }

    setIsDestroying.on();
    axios.put(`${deployConfig.deployApiHost}/tasks/${node?.uuid}`, {
      action: 'destroy', secret_key: secretKey
    }, {
      headers: { authorization: node?.user }
    }).then(res => {
      window.location.reload();
    });
  }

  const onDeleteNode = () => {
    setIsDeleting.on();
    axios.delete(`${deployConfig.deployApiHost}/tasks/${node?.uuid}`, {
      headers: { authorization: node?.user }
    }).then(res => {
      window.location.reload();
    });
  }

  return (
    <>
      <Box position="relative" p={6} pt={4} pb={6} borderRadius="lg" bg={bg}>
        <Flex justifyContent="space-between" alignItems="center">
          <Heading fontSize="lg">My Node</Heading>
          <Menu>
            <MenuButton as={Button} size="sm" colorScheme="octo-blue" variant="ghost" position="relative">
              <Icon as={BsThreeDots} boxSize={5} />
              {
                needKeys ?
                  <Box position="absolute" top="0px" right="0px" boxSize={2} bg="red" borderRadius="full" /> : null
              }
            </MenuButton>
            <MenuList>
              <MenuItem position="relative" onClick={setSetSessionKeyModalOpen.on} isDisabled={!appchainApi}>
                <Icon as={TiKey} mr={2} boxSize={4} /> Set Session Key
                {
                  needKeys ?
                    <Box position="absolute" top="10px" right="10px" boxSize={2} bg="red" borderRadius="full" /> : null
                }
              </MenuItem>
              <MenuItem isDisabled={!accessKeyInLocalStorage} onClick={onClearCache}>
                <Icon as={DeleteIcon} mr={2} boxSize={3} /> Clear Access Key
              </MenuItem>
            </MenuList>
          </Menu>
          
        </Flex>
        {
          isInitializing ?
          <Center minH="160px">
            <Spinner size="md" thickness="4px" speed="1s" color="octo-blue.500" />
          </Center> :
          node ?
          <Box mt={3}>
            <List spacing={3}>
              <Flex justifyContent="space-between">
                <Text variant="gray" fontSize="sm">Status</Text>
                <Skeleton isLoaded={!isRefreshing}>
                <Tag colorScheme={statesRecord[node.state]?.color} size="sm">{statesRecord[node.state]?.label}</Tag>
                </Skeleton>
              </Flex>
              <Flex justifyContent="space-between">
                <Text variant="gray" fontSize="sm">Node ID</Text>
                <HStack>
                  <Text fontSize="sm" whiteSpace="nowrap" w="calc(160px - 30px)"
                    overflow="hidden" textOverflow="ellipsis">
                    {node.uuid}
                  </Text>
                  <IconButton aria-label="copy" onClick={onCopyNodeId} size="xs">
                    { hasNodeIdCopied ? <CheckIcon /> : <CopyIcon /> }
                  </IconButton>
                </HStack>
              </Flex>
              <Flex justifyContent="space-between">
                <Text variant="gray" fontSize="sm">Instance</Text>
                {
                  node.instance ?
                  <HStack>
                    <Text fontSize="sm" whiteSpace="nowrap" w="calc(160px - 30px)"
                      overflow="hidden" textOverflow="ellipsis">
                      {node.instance.user}@{node.instance.ip}
                    </Text>
                    <IconButton aria-label="copy" onClick={onCopyInstance} size="xs">
                      { hasInstanceCopied ? <CheckIcon /> : <CopyIcon /> }
                    </IconButton>
                  </HStack> : '-'
                }
              </Flex>
            </List>
            <Box mt={3}>
              {
                node?.state === '0' ?
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Button colorScheme="octo-blue" onClick={onApplyNode} 
                    isDisabled={isApplying} isLoading={isApplying}>Apply</Button>
                  <Button onClick={onDeleteNode} isDisabled={isDeleting} isLoading={isDeleting}>
                    <Icon as={DeleteIcon} mr={2} boxSize={3} /> Delete
                  </Button>
                </SimpleGrid> :

                node?.state === '10' ||
                node?.state === '20' ?
                <SimpleGrid columns={1}>
                  <Button onClick={onRefresh} isDisabled={isRefreshing} isLoading={isRefreshing}>
                    <RepeatIcon mr={1} /> Refresh
                  </Button>
                </SimpleGrid> :

                node?.state === '11' ||
                node?.state === '21' ?
                <SimpleGrid columns={1}>
                  <Button colorScheme="red" onClick={onDestroyNode} isDisabled={isDestroying} isLoading={isDestroying}>
                    <Icon as={DeleteIcon} mr={2} boxSize={3} /> Destroy
                  </Button>
                </SimpleGrid> :

                node?.state === '12' ?
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Button as={Link} isExternal href={node.instance.ssh_key}>
                    <Icon as={DownloadIcon} mr={2} boxSize={3} /> RSA
                  </Button>
                  <Button colorScheme="red" onClick={onDestroyNode} isDisabled={isDestroying} isLoading={isDestroying}>
                    <Icon as={DeleteIcon} mr={2} boxSize={3} /> Destroy
                  </Button>
                </SimpleGrid> :

                node?.state === '22' ?
                <SimpleGrid columns={1}>
                  <Button onClick={onDeleteNode} isDisabled={isDeleting} isLoading={isDeleting}>
                    <Icon as={DeleteIcon} mr={2} boxSize={3} /> Delete
                  </Button>
                </SimpleGrid> : null

              }
            </Box>
          </Box> :
          accessKey ?
          <>
            <Flex minH="120px" justifyContent="center" flexDirection="column">
              <Flex bg={inputBg} p={1} borderRadius="lg" alignItems="center">
                <Box p={2}>
                  <Text variant="gray">Deploy Region</Text>
                </Box>
                <Box flex={1}>
                  <Select variant="unstyled" p={2} defaultValue="" onChange={e => setDeployRegion(e.target.value)} textAlign="right">
                    {
                      deployConfig?.regions.map((region: any, idx: number) => (
                        <option value={region.value} key={`option-${idx}`}>{region.label}</option>
                      ))
                    }
                  </Select>
                </Box>
              </Flex>
            </Flex>
            <Button colorScheme="octo-blue" isFullWidth onClick={onDeploy} isLoading={isDeploying} isDisabled={isDeploying}>
              Deoply
            </Button>
          </> :
          <>
            <Flex minH="120px" justifyContent="center" flexDirection="column">
              <Flex bg={inputBg} p={1} borderRadius="lg">
                <Box>
                  <Select variant="unstyled" p={2} defaultValue={cloudVendor} onChange={e => setCloudVendor(e.target.value)}>
                    <option value="AWS">AWS</option>
                    <option value="GCP" disabled>GCP</option>
                  </Select>
                </Box>
                <Box flex={1}>
                  <Input variant="unstyled" placeholder="Access Key" w="100%" p={2} onChange={e => setInputAccessKey(e.target.value)} />
                </Box>
              </Flex>
            </Flex>
            <Button colorScheme="octo-blue" isFullWidth isDisabled={!cloudVendor || !inputAccessKey || isLoadingNode} 
              onClick={onNextStep} isLoading={isLoadingNode}>
              Deploy A Node
            </Button>
          </>
        }
      </Box>
      <SetSessionKeyModal 
        appchainApi={appchainApi}
        isOpen={setSessionKeyModalOpen} 
        onClose={setSetSessionKeyModalOpen.off} />
    </>
  );
}