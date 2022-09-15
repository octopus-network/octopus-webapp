import React, { useMemo } from "react"
import useSWR from "swr"
import { DecimalUtil, ZERO_DECIMAL } from "utils"

import {
  Box,
  Grid,
  GridItem,
  Heading,
  Text,
  Flex,
  VStack,
  Skeleton,
  Icon,
  HStack,
} from "@chakra-ui/react"

import {
  Validator,
  AnchorContract,
  FungibleTokenMetadata,
  RewardHistory,
  Delegator,
  AppchainInfo,
  ValidatorStatus,
} from "types"

import { OCT_TOKEN_DECIMALS } from "primitives"
import { RippleDot } from "components"
import { ChevronRightIcon } from "@chakra-ui/icons"
import { useNavigate } from "react-router-dom"
import { formatAppChainAddress } from "utils/format"
import OctIdenticon from "components/common/OctIdenticon"
import { useWalletSelector } from "components/WalletSelectorContextProvider"
import ValidatorStatusTag from "components/Validator/Tag"

type ValidatorRowProps = {
  validator: Validator
  appchainId?: string
  ftMetadata?: FungibleTokenMetadata
  anchor?: AnchorContract
  isLoading: boolean
  isInAppchain: boolean
  haveSessionKey: boolean
  validatorSetHistoryEndIndex?: string
  appchain?: AppchainInfo
  validatorsHasEraPoints: string[]
}

export const ValidatorRow: React.FC<ValidatorRowProps> = ({
  anchor,
  appchain,
  validator,
  ftMetadata,
  isLoading,
  isInAppchain,
  haveSessionKey,
  appchainId,
  validatorSetHistoryEndIndex,
  validatorsHasEraPoints,
}) => {
  const { accountId } = useWalletSelector()

  const navigate = useNavigate()

  const isMyself = useMemo(
    () => validator && accountId === validator.validator_id,
    [accountId, validator]
  )

  const { data: rewards } = useSWR<RewardHistory[]>(
    appchainId && validatorSetHistoryEndIndex
      ? `rewards/${validator.validator_id}/${appchainId}/${validatorSetHistoryEndIndex}`
      : null
  )

  const { data: delegators } = useSWR<Delegator[]>(
    appchainId && validatorSetHistoryEndIndex
      ? `${validator.validator_id}/${appchainId}/delegators`
      : null
  )

  const isDelegated = useMemo(
    () => accountId && !!delegators?.find((d) => d.delegator_id === accountId),
    [delegators, accountId]
  )

  const { data: delegatorRewards } = useSWR<RewardHistory[]>(
    isDelegated && appchainId && validatorSetHistoryEndIndex
      ? `rewards/${validator.validator_id}/${appchainId}/${accountId}/${validatorSetHistoryEndIndex}`
      : null
  )

  const unwithdrawnDelegatorRewards = useMemo(() => {
    if (!delegatorRewards?.length || !ftMetadata) {
      return ZERO_DECIMAL
    }

    return delegatorRewards.reduce(
      (total, next) =>
        total.plus(
          DecimalUtil.fromString(next.unwithdrawn_reward, ftMetadata?.decimals)
        ),
      ZERO_DECIMAL
    )
  }, [delegatorRewards, ftMetadata])

  const ss58Address = formatAppChainAddress(
    validator.validator_id_in_appchain,
    appchain
  )

  const totalRewards = useMemo(
    () =>
      rewards?.length
        ? rewards?.reduce(
            (total, next) =>
              total.plus(
                DecimalUtil.fromString(next.total_reward, ftMetadata?.decimals)
              ),
            ZERO_DECIMAL
          )
        : ZERO_DECIMAL,
    [rewards]
  )

  let status = ValidatorStatus.Registered
  if (validator.is_unbonding) {
    status = ValidatorStatus.Unstaking
  } else if (validatorsHasEraPoints.includes(ss58Address)) {
    status = ValidatorStatus.Validating
  } else if (isInAppchain) {
    status = ValidatorStatus.Validating_N_Not_Producing
  } else if (haveSessionKey) {
    status = ValidatorStatus.New
  }
  console.log("status", status)

  return (
    <Grid
      transition="transform 0.2s ease-in-out 0s, box-shadow 0.2s ease-in-out 0s"
      borderRadius="lg"
      _hover={{
        boxShadow: "rgb(0 0 123 / 10%) 0px 0px 15px",
        transform: "scaleX(0.99)",
      }}
      templateColumns={{
        base: "repeat(5, 1fr)",
        md: "repeat(8, 1fr)",
        lg: "repeat(10, 1fr)",
      }}
      pl={6}
      pr={6}
      gap={2}
      minH="65px"
      cursor="pointer"
      alignItems="center"
      onClick={() =>
        navigate(`/appchains/${appchainId}/validator/${validator.validator_id}`)
      }
    >
      <GridItem colSpan={3} w="100%">
        <VStack spacing={1} alignItems="flex-start">
          <HStack w="100%">
            <OctIdenticon value={ss58Address} size={24} />
            <Heading
              fontSize="lg"
              whiteSpace="nowrap"
              textOverflow="ellipsis"
              overflow="hidden"
            >
              {validator.validator_id}
            </Heading>
          </HStack>

          <Flex justifyContent="center">
            {isLoading ? (
              <RippleDot size={24} color="#2468f2" />
            ) : (
              <ValidatorStatusTag status={status} />
            )}
          </Flex>
        </VStack>
      </GridItem>
      <GridItem colSpan={3} textAlign="center">
        <HStack justify="center">
          <Heading fontSize="md">
            {DecimalUtil.beautify(
              DecimalUtil.fromString(
                validator.deposit_amount,
                OCT_TOKEN_DECIMALS
              ),
              0
            )}{" "}
            /
          </Heading>
          <Heading fontSize="md">
            {DecimalUtil.beautify(
              DecimalUtil.fromString(validator.total_stake, OCT_TOKEN_DECIMALS),
              0
            )}{" "}
            OCT
          </Heading>
        </HStack>
      </GridItem>
      <GridItem
        colSpan={2}
        display={{ base: "none", lg: "table-cell" }}
        textAlign="center"
      >
        <Skeleton isLoaded={!!rewards}>
          <Heading fontSize="md">
            {DecimalUtil.beautify(totalRewards, 0)} {ftMetadata?.symbol}
          </Heading>
        </Skeleton>
      </GridItem>
      <GridItem
        colSpan={1}
        display={{ base: "none", md: "table-cell" }}
        textAlign="center"
      >
        <Heading fontSize="md">{validator.delegators_count}</Heading>
      </GridItem>
      <GridItem colSpan={1}>
        <HStack
          justifyContent="flex-end"
          alignItems="center"
          position="relative"
        >
          {isMyself && !validator?.is_unbonding ? (
            <Text variant="gray" fontSize="sm">
              Manage
            </Text>
          ) : isDelegated ? (
            <Text variant="gray" fontSize="sm">
              Delegated
            </Text>
          ) : null}
          <Icon as={ChevronRightIcon} boxSize={5} className="octo-gray" />
          {unwithdrawnDelegatorRewards.gt(ZERO_DECIMAL) ? (
            <Box
              position="absolute"
              top="-3px"
              right="15px"
              boxSize={2}
              bg="red"
              borderRadius="full"
            />
          ) : null}
        </HStack>
      </GridItem>
    </Grid>
  )
}
