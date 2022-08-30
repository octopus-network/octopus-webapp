import React, { useMemo, useState, useEffect } from "react"
import axios from "axios"
import useSWR from "swr"

import {
  Container,
  Box,
  Grid,
  GridItem,
  Drawer,
  Alert,
  AlertIcon,
  Button,
  HStack,
  Text,
  Heading,
  DrawerOverlay,
  DrawerContent,
  useBoolean,
} from "@chakra-ui/react"

import { AnchorContract, UserVotes, WrappedAppchainToken } from "types"

import { OCT_TOKEN_DECIMALS, COMPLEX_CALL_GAS } from "primitives"

import { API_HOST } from "config"
import { DecimalUtil, ZERO_DECIMAL } from "utils"
import { useParams, useNavigate } from "react-router-dom"
import { Breadcrumb } from "components"
import { Descriptions } from "./Descriptions"
import { ValidatorProfile } from "./ValidatorProfile"
import { MyNode } from "./MyNode"

import { Validators } from "./Validators"
import { useWalletSelector } from "components/WalletSelectorContextProvider"
import { Toast } from "components/common/toast"
import { ANCHOR_METHODS } from "config/constants"
import { getUnbondedValidators } from "utils/appchain"
import { useAppChain } from "hooks/useAppChain"
import SetupEmail from "./SetupEmail"

export const Appchain: React.FC = () => {
  const { id = "", validatorId = "" } = useParams()

  const {
    appchain,
    appchainSettings,
    validators,
    validatorsError,
    appchainApi,
    validatorSessionKeys,
    appchainValidators,
  } = useAppChain(id)

  const { accountId, networkConfig, registry, nearAccount } =
    useWalletSelector()

  const { data: userVotes } = useSWR<UserVotes>(
    accountId ? `votes/${accountId}/${id}` : null
  )
  const userDownvotes = useMemo(
    () => DecimalUtil.fromString(userVotes?.downvotes, OCT_TOKEN_DECIMALS),
    [userVotes]
  )
  const userUpvotes = useMemo(
    () => DecimalUtil.fromString(userVotes?.upvotes, OCT_TOKEN_DECIMALS),
    [userVotes]
  )

  const [isWithdrawingUpvotes, setIsWithdrawingUpvotes] = useBoolean()
  const [isWithdrawingDownvotes, setIsWithdrawingDownvotes] = useBoolean()

  const navigate = useNavigate()

  const [anchor, setAnchor] = useState<AnchorContract>()
  const [wrappedAppchainToken, setWrappedAppchainToken] =
    useState<WrappedAppchainToken>()

  const [unbondedValidators, setUnbondedValidators] = useState<any[]>()

  const drawerOpen = useMemo(() => !!id && !!validatorId, [id, validatorId])

  useEffect(() => {
    if (drawerOpen) {
      ;(document.getElementById("root") as any).style =
        "transition: all .3s ease-in-out; transform: translateX(-5%)"
    } else {
      ;(document.getElementById("root") as any).style =
        "transition: all .15s ease-in-out; transform: translateX(0)"
    }
  }, [drawerOpen])

  useEffect(() => {
    if (!appchain) {
      return
    }

    const anchorContract = new AnchorContract(
      nearAccount!,
      appchain.appchain_anchor,
      ANCHOR_METHODS
    )

    setAnchor(anchorContract)

    if (networkConfig?.near) {
      getUnbondedValidators(networkConfig, appchain.appchain_anchor).then(
        (uvs) => setUnbondedValidators(uvs)
      )
    }
  }, [appchain, nearAccount, networkConfig, networkConfig?.near])

  useEffect(() => {
    if (!anchor) {
      return
    }
    anchor.get_wrapped_appchain_token().then((wrappedToken) => {
      setWrappedAppchainToken(wrappedToken)
    })
  }, [anchor])

  const validator = validators?.find((v) => v.validator_id === accountId)
  const isValidator = !!(validator && !validator?.is_unbonding)

  const needKeys = useMemo(() => {
    if (!validatorSessionKeys || !accountId) {
      return false
    }
    return isValidator && !validatorSessionKeys[accountId]
  }, [validatorSessionKeys, accountId, isValidator])

  const onDrawerClose = () => {
    navigate(`/appchains/${id}`)
  }

  const onWithdrawVotes = (voteType: "upvote" | "downvote") => {
    const method =
      voteType === "upvote"
        ? registry?.withdraw_upvote_deposit_of
        : registry?.withdraw_downvote_deposit_of

    ;(voteType === "upvote"
      ? setIsWithdrawingUpvotes
      : setIsWithdrawingDownvotes
    ).on()

    method?.(
      {
        appchain_id: id,
        amount:
          (voteType === "upvote" ? userVotes?.upvotes : userVotes?.downvotes) ||
          "0",
      },
      COMPLEX_CALL_GAS
    )
      .then(() => {
        axios
          .post(`${API_HOST}/update-appchains`)
          .then(() => window.location.reload())
      })
      .catch((err) => {
        Toast.error(err)
      })
  }

  return (
    <>
      <Container>
        <Box mt={5}>
          <Breadcrumb
            links={[
              { to: "/home", label: "Home" },
              { to: "/appchains", label: "Appchains" },
              { label: id },
            ]}
          />
        </Box>
        <Box>
          {userUpvotes.gt(ZERO_DECIMAL) || userDownvotes.gt(ZERO_DECIMAL) ? (
            <Alert mt={5} borderRadius="lg" status="warning">
              <AlertIcon />
              <HStack>
                <Text>You have</Text>
                {userUpvotes.gt(ZERO_DECIMAL) ? (
                  <HStack>
                    <Heading fontSize="md">
                      {DecimalUtil.beautify(userUpvotes)}
                    </Heading>
                    <Text>upvotes</Text>
                    <Button
                      size="xs"
                      colorScheme="octo-blue"
                      variant="ghost"
                      onClick={() => onWithdrawVotes("upvote")}
                      isDisabled={isWithdrawingUpvotes}
                      isLoading={isWithdrawingUpvotes}
                    >
                      Withdraw
                    </Button>
                  </HStack>
                ) : null}
                {userDownvotes.gt(ZERO_DECIMAL) ? (
                  <HStack>
                    <Heading fontSize="md">
                      {DecimalUtil.beautify(userDownvotes)}
                    </Heading>
                    <Text>downvotes</Text>
                    <Button
                      size="xs"
                      colorScheme="octo-blue"
                      variant="ghost"
                      onClick={() => onWithdrawVotes("downvote")}
                      isDisabled={isWithdrawingDownvotes}
                      isLoading={isWithdrawingDownvotes}
                    >
                      Withdraw
                    </Button>
                  </HStack>
                ) : null}
              </HStack>
            </Alert>
          ) : null}
        </Box>
        <Grid
          templateColumns={{ base: "repeat(3, 1fr)", lg: "repeat(5, 1fr)" }}
          gap={5}
          mt={5}
        >
          <GridItem colSpan={3}>
            <Descriptions
              appchain={appchain}
              appchainApi={appchainApi}
              appchainSettings={appchainSettings}
              wrappedAppchainToken={wrappedAppchainToken}
            />
          </GridItem>
          <GridItem colSpan={{ base: 3, lg: 2 }} borderRadius="lg">
            <MyNode
              appchain={appchain}
              appchainId={id}
              needKeys={needKeys}
              appchainApi={appchainApi}
              anchor={anchor}
              validator={validator}
            />
          </GridItem>
        </Grid>
        <Box mt={8}>
          <Validators
            appchain={appchain}
            isLoadingValidators={!validators && !validatorsError}
            validators={validators}
            unbondedValidators={unbondedValidators}
            appchainValidators={appchainValidators}
            validatorSessionKeys={validatorSessionKeys}
            anchor={anchor}
          />
        </Box>
        <SetupEmail anchor={anchor} validator={validator} />
      </Container>
      <Drawer
        placement="right"
        isOpen={drawerOpen}
        onClose={onDrawerClose}
        size="lg"
      >
        <DrawerOverlay />
        <DrawerContent>
          <ValidatorProfile
            appchain={appchain}
            anchor={anchor}
            validatorId={validatorId}
            appchainValidators={appchainValidators}
            validators={validators}
            validatorSessionKeys={validatorSessionKeys}
            onDrawerClose={onDrawerClose}
          />
        </DrawerContent>
      </Drawer>
    </>
  )
}
