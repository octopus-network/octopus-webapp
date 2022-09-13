import React, { useState, useEffect } from 'react'
import axios from 'axios'
import useSWR from 'swr'

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
} from '@chakra-ui/react'

import { DeleteIcon } from '@chakra-ui/icons'

import myStakingBg from 'assets/my-staking-bg.png'
import { BsFillTerminalFill } from 'react-icons/bs'
import { TiKey } from 'react-icons/ti'
import { BsThreeDots } from 'react-icons/bs'
import { API_HOST } from 'config'
import type { ApiPromise } from '@polkadot/api'

import { InstanceInfoModal } from './InstanceInfoModal'
import {
  AnchorContract,
  AppchainInfo,
  CLOUD_VENDOR,
  NodeDetail,
  NodeMetric,
  NodeState,
  Validator,
  ValidatorSessionKey,
} from 'types'
import { useWalletSelector } from 'components/WalletSelectorContextProvider'
import NodeBoard from 'components/AppChain/NodeBoard'
import { MyStaking } from '../MyStaking'
import NodeDeploy from 'components/AppChain/NodeDeploy'
import NodeManager from 'utils/NodeManager'
import { Toast } from 'components/common/toast'
import { web3FromSource } from '@polkadot/extension-dapp'
import useAccounts from 'hooks/useAccounts'
import { onTxSent } from 'utils/helper'
import { setSessionKey } from 'utils/bridge'
import { SetSessionKeyModal } from './SetSessionKeyModal'

type MyNodeProps = {
  appchainId: string | undefined
  appchainApi: ApiPromise | undefined
  needKeys: boolean
  appchain?: AppchainInfo
  anchor?: AnchorContract
  validator?: Validator
  validatorSessionKeys?: Record<string, ValidatorSessionKey>
}

export const MyNode: React.FC<MyNodeProps> = ({
  appchainId,
  needKeys,
  appchainApi,
  appchain,
  anchor,
  validator,
  validatorSessionKeys,
}) => {
  const bg = useColorModeValue('white', '#15172c')
  const validatorBg = useColorModeValue(
    'linear-gradient(137deg,#1486ff 4%, #0c4df5)',
    'linear-gradient(137deg,#1486ff 4%, #0c4df5)'
  )

  const [node, setNode] = useState<NodeDetail>()

  const [isInitializing, setIsInitializing] = useBoolean()

  const [nodeMetrics, setNodeMetrics] = useState<NodeMetric>()

  const [isSubmitting, setIsSubmitting] = useBoolean()
  const [instanceInfoModalOpen, setInstanceInfoModalOpen] = useBoolean()
  const [oauthUser, setOAuthUser] = useState<any>()
  const [isManuallyDeployed, setIsManuallyDeployed] = useBoolean()
  const [setSessionKeyModalOpen, setSetSessionKeyModalOpen] = useBoolean(false)

  const { data: deployConfig } = useSWR('deploy-config')

  const { accountId, network } = useWalletSelector()

  const cloudVendorInLocalStorage = window.localStorage.getItem(
    'OCTOPUS_DEPLOYER_CLOUD_VENDOR'
  ) as CLOUD_VENDOR
  const accessKeyInLocalStorage =
    window.localStorage.getItem('OCTOPUS_DEPLOYER_ACCESS_KEY') ||
    window.localStorage.getItem('accessKey') ||
    ''

  useEffect(() => {
    if (appchainId) {
      const ismd = localStorage.getItem(`manually-deployed-${appchainId}`)
      ismd === 'true' && setIsManuallyDeployed.on()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appchainId])

  const fetchNode = async () => {
    setIsInitializing.on()
    const cloudVendor = window.localStorage.getItem(
      'OCTOPUS_DEPLOYER_CLOUD_VENDOR'
    ) as CLOUD_VENDOR
    const accessKey =
      window.localStorage.getItem('OCTOPUS_DEPLOYER_ACCESS_KEY') ||
      window.localStorage.getItem('accessKey') ||
      ''
    NodeManager.getNodeDetail({
      appchainId: appchainId!,
      cloudVendor,
      accessKey,
      accountId: accountId!,
      network,
    })
      .then((node) => {
        if (node) {
          setNode(node)
          if (
            node?.state &&
            [NodeState.APPLYING, NodeState.DESTROYING].includes(
              node?.state as NodeState
            )
          ) {
            setTimeout(() => {
              fetchNode()
            }, 3000)
          }
          fetchMetrics(node)
        }
        setIsInitializing.off()
      })
      .catch(() => {
        setIsInitializing.off()
      })
  }

  const fetchMetrics = async (node: NodeDetail | undefined) => {
    if (!node || !appchainId) {
      return
    }

    if (accountId && node.state === NodeState.RUNNING) {
      axios
        .get(
          `
        ${API_HOST}/node-metrics/${node.uuid}/${cloudVendorInLocalStorage}/${accessKeyInLocalStorage}/${appchainId}/${accountId}
      `
        )
        .then((res) => res.data)
        .then((res) => {
          if (res?.memory) {
            setNodeMetrics(res)
          }
        })
    }
  }

  useEffect(() => {
    if (
      !accessKeyInLocalStorage ||
      !appchainId ||
      !cloudVendorInLocalStorage ||
      !accountId
    ) {
      return
    }
    fetchNode()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    accessKeyInLocalStorage,
    accountId,
    appchainId,
    cloudVendorInLocalStorage,
  ])

  useEffect(() => {
    fetchMetrics(node)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    node,
    appchainId,
    accountId,
    cloudVendorInLocalStorage,
    accessKeyInLocalStorage,
  ])

  const onClearCache = () => {
    window.localStorage.removeItem('OCTOPUS_DEPLOYER_CLOUD_VENDOR')
    window.localStorage.removeItem('OCTOPUS_DEPLOYER_ACCESS_KEY')
    window.localStorage.removeItem('accessKey')
    window.location.reload()
  }

  const isEvm = appchain?.appchain_metadata?.template_type === 'BarnacleEvm'

  const { currentAccount } = useAccounts(isEvm, true)

  const onSetSessionKey = async () => {
    try {
      if (isManuallyDeployed) {
        setSetSessionKeyModalOpen.on()
        return
      }
      if (isSubmitting || !node) {
        return
      }
      setIsSubmitting.on()
      if (isEvm) {
        await setSessionKey(node.skey)
        Toast.success('Set session keys success')
        onTxSent()
      } else {
        const res = await appchainApi?.query.system.account(
          currentAccount?.address
        )
        const resJSON: any = res?.toJSON()
        if (resJSON?.data.free === 0) {
          throw new Error('Insufficient balance')
        }

        const injected = await web3FromSource(currentAccount?.meta.source || '')
        appchainApi?.setSigner(injected.signer)

        const tx = appchainApi?.tx.session.setKeys(node.skey, '0x00')
        if (!tx) {
          setIsSubmitting.off()
          return
        }

        await tx.signAndSend(currentAccount?.address as any, (res: any) => {
          if (res.isInBlock) {
            Toast.success('Set session keys success')
            onTxSent()
          }
        })
      }
      setIsSubmitting.off()
    } catch (err: any) {
      setIsSubmitting.off()
      Toast.error(err)
    }
  }

  // check NODE_STATE_RECORD for state meaning
  const isShowRegister =
    !!validator ||
    [
      NodeState.RUNNING,
      NodeState.DESTROYED,
      NodeState.DESTROYING,
      NodeState.DESTROY_FAILED,
      NodeState.UPGRADING,
    ].includes(node?.state as NodeState)

  const skeyBadge = needKeys && !!node?.skey
  const metricBadge = nodeMetrics && nodeMetrics?.filesystem?.percentage > 0.8
  let isSessionKeyAlreadySet = false
  if (validator && validatorSessionKeys && node) {
    isSessionKeyAlreadySet = !!validatorSessionKeys[validator.validator_id]
  }

  const menuItems = [
    {
      isDisabled: isManuallyDeployed
        ? false
        : !appchainApi || !node?.skey || !validator || isSessionKeyAlreadySet,
      onClick: onSetSessionKey,
      label: 'Set Session Key',
      icon: TiKey,
      hasBadge: skeyBadge,
    },
    {
      isDisabled: !nodeMetrics,
      onClick: setInstanceInfoModalOpen.on,
      label: 'Instance Info',
      icon: BsFillTerminalFill,
      hasBadge: metricBadge,
    },
    {
      isDisabled: !accessKeyInLocalStorage,
      onClick: onClearCache,
      label: 'Clear Access Key',
      icon: DeleteIcon,
      hasBadge: false,
    },
  ]

  return (
    <>
      <Box position="relative" mb={3} p={4} borderRadius="lg" bg={validatorBg}>
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
              {(skeyBadge || metricBadge) && (
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
            appchainId={appchainId}
            cloudVendor={cloudVendorInLocalStorage}
            setNode={setNode}
            deployAccessKey={accessKeyInLocalStorage}
            deployConfig={deployConfig}
            anchor={anchor}
            appchain={appchain}
            validator={validator}
            isInitializing={isInitializing}
          />
        )}
        {!node && !isInitializing && (
          <NodeDeploy
            setNode={setNode}
            validator={validator}
            appchainId={appchainId}
            myNodeSetOAuthUser={setOAuthUser}
            isShowRegister={isShowRegister}
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
      />
    </>
  )
}
