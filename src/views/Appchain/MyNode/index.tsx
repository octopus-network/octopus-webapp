import React, { useState, useEffect } from "react"
import axios from "axios"
import useSWR from "swr"

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
} from "@chakra-ui/react"

import { DeleteIcon } from "@chakra-ui/icons"

import { BsFillTerminalFill } from "react-icons/bs"
import { HiUpload } from "react-icons/hi"
import { TiKey } from "react-icons/ti"
import { BsThreeDots } from "react-icons/bs"
import { API_HOST } from "config"
import { Alert } from "components"
import { SetSessionKeyModal } from "./SetSessionKeyModal"
import type { ApiPromise } from "@polkadot/api"

import { InstanceInfoModal } from "./InstanceInfoModal"
import { AnchorContract, AppchainInfo, CLOUD_VENDOR, Validator } from "types"
import { useWalletSelector } from "components/WalletSelectorContextProvider"
import NodeBoard from "components/AppChain/NodeBoard"
import { MyStaking } from "../MyStaking"
import NodeForm from "components/AppChain/NodeForm"

type MyNodeProps = {
  appchainId: string | undefined
  appchainApi: ApiPromise | undefined
  needKeys: boolean
  appchain?: AppchainInfo
  anchor?: AnchorContract
  validator?: Validator
}

export const MyNode: React.FC<MyNodeProps> = ({
  appchainId,
  needKeys,
  appchainApi,
  appchain,
  anchor,
  validator,
}) => {
  const bg = useColorModeValue("white", "#15172c")

  const [node, setNode] = useState<any>()

  const [isInitializing, setIsInitializing] = useBoolean()
  const [isUpgrading, setIsUpgrading] = useBoolean()

  const [nodeMetrics, setNodeMetrics] = useState<any>()

  const [upgradeAlertOpen, setUpgradeAlertOpen] = useBoolean()
  const [setSessionKeyModalOpen, setSetSessionKeyModalOpen] = useBoolean()
  const [instanceInfoModalOpen, setInstanceInfoModalOpen] = useBoolean()

  const [isImageNeedUpgrade, setIsImageNeedUpgrade] = useBoolean()
  const [oauthUser, setOAuthUser] = useState<any>()

  const { data: deployConfig } = useSWR("deploy-config")

  const { accountId } = useWalletSelector()

  const cloudVendorInLocalStorage = window.localStorage.getItem(
    "OCTOPUS_DEPLOYER_CLOUD_VENDOR"
  ) as CLOUD_VENDOR
  const accessKeyInLocalStorage =
    window.localStorage.getItem("OCTOPUS_DEPLOYER_ACCESS_KEY") ||
    window.localStorage.getItem("accessKey") ||
    ""

  useEffect(() => {
    if (
      !accessKeyInLocalStorage ||
      !appchainId ||
      !cloudVendorInLocalStorage ||
      !accountId
    ) {
      return
    }
    setIsInitializing.on()
    axios
      .get(
        `
      ${API_HOST}/node/${cloudVendorInLocalStorage}/${accessKeyInLocalStorage}/${appchainId}/${accountId}
    `
      )
      .then((res) => res.data)
      .then((res) => {
        if (res) {
          setNode(res)
        }
        setIsInitializing.off()
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    accessKeyInLocalStorage,
    accountId,
    appchainId,
    cloudVendorInLocalStorage,
  ])

  useEffect(() => {
    if (!node || !deployConfig || !appchainId) {
      return
    }

    if (accountId && node?.state === "12") {
      axios
        .get(
          `
        ${API_HOST}/node-metrics/${node.uuid}/${cloudVendorInLocalStorage}/${accessKeyInLocalStorage}/${appchainId}/${accountId}
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
        deployConfig.upgradeWhitelist.includes(accountId))
    ) {
      setIsImageNeedUpgrade.on()
    } else {
      setIsImageNeedUpgrade.off()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    node,
    deployConfig,
    appchainId,
    accountId,
    cloudVendorInLocalStorage,
    accessKeyInLocalStorage,
  ])

  const onClearCache = () => {
    window.localStorage.removeItem("OCTOPUS_DEPLOYER_CLOUD_VENDOR")
    window.localStorage.removeItem("OCTOPUS_DEPLOYER_ACCESS_KEY")
    window.localStorage.removeItem("accessKey")
    window.location.reload()
  }

  const onUpgradeImage = () => {
    if (!appchainId) {
      return
    }

    let secretKey

    if (cloudVendorInLocalStorage === "AWS") {
      secretKey = window.prompt(
        "Please enter the secret key of your server",
        ""
      )

      if (!secretKey) {
        return
      }
    } else {
      const { access_token } = oauthUser?.getAuthResponse()
      secretKey = access_token
    }

    setIsUpgrading.on()
    axios.put(
      `${deployConfig.deployApiHost}/tasks/${node?.uuid}`,
      {
        action: "update",
        secret_key: secretKey,
        base_image: deployConfig.baseImages[appchainId]?.image,
      },
      {
        headers: { authorization: node?.user },
      }
    )

    if (!secretKey) {
      return
    }
  }
  // check NODE_STATE_RECORD for state meaning
  const isShowRegister =
    !!validator || ["12", "20", "21", "22", "30"].includes(node?.state)

  return (
    <>
      <Box mb={3} p={4} borderRadius="lg" bg={bg}>
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
          <NodeBoard
            node={node}
            appchainId={appchainId}
            cloudVendor={cloudVendorInLocalStorage}
            setNode={setNode}
            deployAccessKey={accessKeyInLocalStorage}
            deployConfig={deployConfig}
            anchor={anchor}
            appchain={appchain}
          />
        ) : (
          <NodeForm
            setNode={setNode}
            validator={validator}
            appchainId={appchainId}
            myNodeSetOAuthUser={setOAuthUser}
            isShowRegister={isShowRegister}
            anchor={anchor}
            appchain={appchain}
          />
        )}
      </Box>
      <SetSessionKeyModal
        appchain={appchain}
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
