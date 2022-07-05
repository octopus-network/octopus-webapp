import React, { useMemo, useState, useEffect } from "react"
import { ApiPromise, WsProvider } from "@polkadot/api"
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
  useToast,
} from "@chakra-ui/react"

import {
  AppchainInfoWithAnchorStatus,
  AnchorContract,
  AppchainSettings,
  ValidatorSessionKey,
  TokenContract,
  Validator,
  UserVotes,
  WrappedAppchainToken,
} from "types"

import {
  OCT_TOKEN_DECIMALS,
  COMPLEX_CALL_GAS,
  FAILED_TO_REDIRECT_MESSAGE,
} from "primitives"

import { API_HOST } from "config"
import { DecimalUtil, ZERO_DECIMAL } from "utils"
import { useParams, useNavigate } from "react-router-dom"
import { Breadcrumb } from "components"
import { Descriptions } from "./Descriptions"
import { MyStaking } from "./MyStaking"
import { ValidatorProfile } from "./ValidatorProfile"
import { MyNode } from "./MyNode"

import { Validators } from "./Validators"
import { useGlobalStore } from "stores"

export const Appchain: React.FC = () => {
  const { id = "", validatorId = "" } = useParams()

  const toast = useToast()
  const { global } = useGlobalStore()
  const { data: appchain } = useSWR<AppchainInfoWithAnchorStatus>(
    id ? `appchain/${id}` : null
  )
  const { data: appchainSettings } = useSWR<AppchainSettings>(
    id ? `appchain-settings/${id}` : null
  )
  const { data: validators, error: validatorsError } = useSWR<Validator[]>(
    appchain ? `validators/${appchain.appchain_id}` : null
  )

  const { data: userVotes } = useSWR<UserVotes>(
    global.accountId ? `votes/${global.accountId}/${id}` : null
  )
  const userDownvotes = useMemo(
    () => DecimalUtil.fromString(userVotes?.downvotes, OCT_TOKEN_DECIMALS),
    [userVotes]
  )
  const userUpvotes = useMemo(
    () => DecimalUtil.fromString(userVotes?.upvotes, OCT_TOKEN_DECIMALS),
    [userVotes]
  )

  const [appchainValidators, setAppchainValidators] = useState<string[]>()
  const [validatorSessionKeys, setValidatorSessionKeys] =
    useState<Record<string, ValidatorSessionKey>>()

  const [isWithdrawingUpvotes, setIsWithdrawingUpvotes] = useBoolean()
  const [isWithdrawingDownvotes, setIsWithdrawingDownvotes] = useBoolean()

  const [appchainApi, setAppchainApi] = useState<ApiPromise>()
  const navigate = useNavigate()

  const [anchor, setAnchor] = useState<AnchorContract>()
  const [wrappedAppchainToken, setWrappedAppchainToken] =
    useState<WrappedAppchainToken>()
  const [wrappedAppchainTokenContract, setWrappedAppchainTokenContract] =
    useState<TokenContract>()

  const [unbondedValidators, setUnbondedValidators] = useState<any[]>()

  const drawerOpen = useMemo(() => !!id && !!validatorId, [validatorId])

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
      global.wallet?.account() as any,
      appchain.appchain_anchor,
      {
        viewMethods: [
          "get_protocol_settings",
          "get_validator_deposit_of",
          "get_wrapped_appchain_token",
          "get_delegator_deposit_of",
          "get_validator_profile",
          "get_unbonded_stakes_of",
          "get_delegator_rewards_of",
          "get_anchor_status",
          "get_user_staking_histories_of",
        ],
        changeMethods: [
          "enable_delegation",
          "disable_delegation",
          "decrease_stake",
          "withdraw_validator_rewards",
          "unbond_stake",
          "withdraw_stake",
          "unbond_delegation",
          "withdraw_delegator_rewards",
          "decrease_delegation",
        ],
      }
    )

    setAnchor(anchorContract)

    if (global.network?.near) {
      axios
        .post(`${global.network?.near.restApiUrl}/explorer`, {
          user: "public_readonly",
          host: `${global.network?.near.networkId}.db.explorer.indexer.near.dev`,
          database: `${global.network?.near.networkId}_explorer`,
          password: "nearprotocol",
          port: 5432,
          parameters: [appchain.appchain_anchor],
          query: `
          SELECT * FROM public.action_receipt_actions 
          WHERE receipt_receiver_account_id = $1
          AND args->>'method_name' = 'unbond_stake'
          LIMIT 100;
        `,
        })
        .then((res) => {
          const tmpArr = res.data.map(
            (r: any) => r.receipt_predecessor_account_id
          )
          setUnbondedValidators(Array.from(new Set(tmpArr)))
        })
    }
  }, [appchain, global])

  useEffect(() => {
    if (!anchor) {
      return
    }
    anchor.get_wrapped_appchain_token().then((wrappedToken) => {
      setWrappedAppchainToken(wrappedToken)
    })
  }, [anchor])

  useEffect(() => {
    if (!global.accountId || !wrappedAppchainToken) {
      return
    }

    setWrappedAppchainTokenContract(
      new TokenContract(
        global.wallet?.account() as any,
        wrappedAppchainToken.contract_account,
        {
          viewMethods: ["storage_balance_of", "ft_balance_of"],
          changeMethods: [],
        }
      )
    )
  }, [wrappedAppchainToken, global])

  useEffect(() => {
    if (!appchainSettings) {
      return
    }

    const provider = new WsProvider(appchainSettings.rpc_endpoint)
    const api = new ApiPromise({ provider })

    api.isReady.then((api) => setAppchainApi(api))
  }, [appchainSettings])

  useEffect(() => {
    appchainApi?.query?.session?.validators().then((vs: any) => {
      setAppchainValidators(vs.map((v: any) => v.toString()))
    })

    if (validators) {
      appchainApi?.query?.session?.nextKeys
        .multi(validators.map((v) => v.validator_id_in_appchain))
        .then((keys) => {
          let tmpObj: Record<string, ValidatorSessionKey> = {}
          keys.forEach(
            (key, idx) =>
              (tmpObj[validators[idx].validator_id] =
                key.toJSON() as ValidatorSessionKey)
          )

          setValidatorSessionKeys(tmpObj)
        })
    }
  }, [appchainApi, validators])

  useEffect(() => {
    if (!appchainApi) {
      return
    }
    appchainApi.query.octopusLpos.activeEra().then((era) => {
      const eraJSON: any = era.toJSON()
      appchainApi.query.octopusLpos
        .erasRewardPoints(eraJSON.index)
        .then((points) => {
          const pointsJSON: any = points.toJSON()
          console.log(pointsJSON)
        })
    })
  }, [appchainApi])

  const isValidator = useMemo(
    () =>
      validators?.some(
        (v) => v.validator_id === global.accountId && !v.is_unbonding
      ) || false,
    [validators, global]
  )
  const isUnbonding = useMemo(
    () =>
      validators?.some(
        (v) => v.validator_id === global.accountId && v.is_unbonding
      ) || false,
    [validators, global]
  )
  const validator = validators?.find((v) => v.validator_id === global.accountId)

  const needKeys = useMemo(() => {
    if (!validatorSessionKeys || !global.accountId) {
      return false
    }
    return isValidator && !validatorSessionKeys[global.accountId]
  }, [isValidator, global, validatorSessionKeys])

  const onDrawerClose = () => {
    navigate(`/appchains/${id}`)
  }

  const onWithdrawVotes = (voteType: "upvote" | "downvote") => {
    const method =
      voteType === "upvote"
        ? global.registry?.withdraw_upvote_deposit_of
        : global.registry?.withdraw_downvote_deposit_of

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
        if (err.message === FAILED_TO_REDIRECT_MESSAGE) {
          return
        }
        toast({
          position: "top-right",
          title: "Error",
          description: err.toString(),
          status: "error",
        })
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
          <GridItem colSpan={{ base: 3, lg: 2 }}>
            <MyStaking
              appchain={appchain}
              anchor={anchor}
              isUnbonding={isUnbonding}
              isValidator={isValidator}
              wrappedAppchainTokenContract={wrappedAppchainTokenContract}
              validator={validator}
            />

            <Box mt={5}>
              <MyNode
                appchainId={id}
                needKeys={needKeys}
                appchainApi={appchainApi}
              />
            </Box>
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
            wrappedAppchainTokenContract={wrappedAppchainTokenContract}
            anchor={anchor}
          />
        </Box>
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
            wrappedAppchainTokenContract={wrappedAppchainTokenContract}
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
