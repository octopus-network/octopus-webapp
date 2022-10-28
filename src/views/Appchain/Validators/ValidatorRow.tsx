import React, { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { DecimalUtil, ZERO_DECIMAL } from "utils";

import {
  Grid,
  GridItem,
  Heading,
  Text,
  Flex,
  VStack,
  Skeleton,
  Icon,
  HStack,
  Tag,
} from "@chakra-ui/react";

import {
  Validator,
  AnchorContract,
  FungibleTokenMetadata,
  RewardHistory,
  Delegator,
  AppchainInfo,
  ValidatorStatus,
} from "types";
import dayjs from "dayjs";
import { OCT_TOKEN_DECIMALS } from "primitives";
import { RippleDot } from "components";
import { ChevronRightIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import { formatAppChainAddress } from "utils/format";
import OctIdenticon from "components/common/OctIdenticon";
import { useWalletSelector } from "components/WalletSelectorContextProvider";
import ValidatorStatusTag from "components/Validator/Tag";
import _ from "lodash";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

type ValidatorRowProps = {
  validator: Validator;
  appchainId?: string;
  ftMetadata?: FungibleTokenMetadata;
  anchor?: AnchorContract;
  isLoading: boolean;
  isInAppchain: boolean;
  haveSessionKey: boolean;
  validatorSetHistoryEndIndex?: string;
  appchain?: AppchainInfo;
  validatorsHasEraPoints: string[];
};

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
  const { accountId } = useWalletSelector();
  const [registeredDays, setRegisteredDays] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    if (anchor) {
      anchor
        .get_user_staking_histories_of({ account_id: validator.validator_id })
        .then((result) => {
          const time = _.min(result.map((t) => Number(t.timestamp)));
          if (time) {
            setRegisteredDays(dayjs(Math.floor(time / 1e6)).fromNow());
          }
        })
        .catch(() => {});
    }
  }, [anchor, validator.validator_id]);

  const isMyself = useMemo(
    () => validator && accountId === validator.validator_id,
    [accountId, validator]
  );

  const { data: rewards } = useSWR<RewardHistory[]>(
    appchainId && validatorSetHistoryEndIndex
      ? `rewards/${validator.validator_id}/${appchainId}/${validatorSetHistoryEndIndex}`
      : null
  );

  const { data: delegators } = useSWR<Delegator[]>(
    appchainId && validatorSetHistoryEndIndex
      ? `${validator.validator_id}/${appchainId}/delegators`
      : null
  );

  const isDelegated = useMemo(
    () => accountId && !!delegators?.find((d) => d.delegator_id === accountId),
    [delegators, accountId]
  );

  const ss58Address = formatAppChainAddress(
    validator.validator_id_in_appchain,
    appchain
  );

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
    [ftMetadata?.decimals, rewards]
  );

  let status = ValidatorStatus.Registered;

  if (validator.is_unbonding) {
    status = ValidatorStatus.Unstaking;
  } else if (
    validatorsHasEraPoints.some(
      (t) => t.toLowerCase() === ss58Address.toLowerCase()
    )
  ) {
    status = ValidatorStatus.Validating;
  } else if (isInAppchain) {
    status = ValidatorStatus.Validating_N_Not_Producing;
  } else if (haveSessionKey) {
    status = ValidatorStatus.New;
  }

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
          <HStack w="100%" gap={2}>
            <OctIdenticon value={ss58Address} size={24} />
            <VStack spacing={0} align="flex-start">
              <Heading
                fontSize="lg"
                whiteSpace="nowrap"
                textOverflow="ellipsis"
                overflow="hidden"
              >
                {validator.validator_id}
              </Heading>
              <Text fontSize="small">{registeredDays}</Text>
            </VStack>
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
      <GridItem colSpan={2} textAlign="center">
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
      <GridItem colSpan={2}>
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
          ) : validator.can_be_delegated_to ? (
            <Tag>Delegatable</Tag>
          ) : null}
          <Icon as={ChevronRightIcon} boxSize={5} className="octo-gray" />
        </HStack>
      </GridItem>
    </Grid>
  );
};
