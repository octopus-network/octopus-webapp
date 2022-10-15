import React, { useState, useMemo, useEffect } from "react";

import {
  Flex,
  Heading,
  HStack,
  Center,
  Spinner,
  Box,
  Text,
  useColorModeValue,
  Grid,
  GridItem,
  List,
  Icon,
  useBoolean,
  VStack,
  Image,
  Link,
} from "@chakra-ui/react";

import { TriangleUpIcon, TriangleDownIcon } from "@chakra-ui/icons";

import {
  Validator,
  AnchorContract,
  AppchainInfoWithAnchorStatus,
  ValidatorSessionKey,
  RewardHistory,
} from "types";

import { ValidatorRow } from "./ValidatorRow";
import { RewardsModal } from "../RewardsModal";
import { DecimalUtil } from "utils";
import { OCT_TOKEN_DECIMALS } from "primitives";
import { Empty } from "components";
import OTTO from "../../../assets/otto.png";
import { formatAppChainAddress } from "utils/format";
import { useWalletSelector } from "components/WalletSelectorContextProvider";
import { useAppChain } from "hooks/useAppChain";

type ValidatorsProps = {
  appchain?: AppchainInfoWithAnchorStatus;
  isLoadingValidators: boolean;
  validators?: Validator[];
  appchainValidators?: string[];
  validatorSessionKeys?: Record<string, ValidatorSessionKey>;
  anchor?: AnchorContract;
};

type SortButtonProps = {
  label: string;
  sortIdx: number;
  indexArr: number[];
  onChange: (v: number) => void;
};

const SortButton: React.FC<SortButtonProps> = ({
  sortIdx,
  indexArr,
  onChange,
  label,
}) => {
  const onClick = () => {
    if (!indexArr.includes(sortIdx)) {
      onChange(indexArr[1]);
    } else if (sortIdx === indexArr[1]) {
      onChange(indexArr[0]);
    } else {
      onChange(0);
    }
  };

  return (
    <HStack
      alignItems="center"
      justifyContent="center"
      onClick={onClick}
      cursor="pointer"
    >
      <Text variant="gray">{label}</Text>
      <VStack spacing={0}>
        <Icon
          as={TriangleUpIcon}
          boxSize={2}
          opacity={sortIdx === indexArr[0] ? 1 : 0.3}
        />
        <Icon
          as={TriangleDownIcon}
          boxSize={2}
          opacity={sortIdx === indexArr[1] ? 1 : 0.3}
        />
      </VStack>
    </HStack>
  );
};

export const Validators: React.FC<ValidatorsProps> = ({
  appchain,
  anchor,
  isLoadingValidators,
  validators,
  appchainValidators,
  validatorSessionKeys,
}) => {
  const bg = useColorModeValue("white", "#15172c");

  const [sortIdx, setSortIdx] = useState(1);

  const [claimRewardsModalOpen, setClaimRewardsModalOpen] = useBoolean();
  const [unbondedDelegatorRewards, setUnbondedDelegatorRewards] =
    useState<RewardHistory[]>();
  const [unbondedRewardsValidatorId, setUnbondedRewardsValidatorId] =
    useState("");
  const [validatorsHasEraPoints, setValidatorsHasEraPoints] = useState<
    string[]
  >([]);

  const { appchainApi } = useAppChain(appchain?.appchain_id);

  useEffect(() => {
    async function fetchEraPoints() {
      if (!appchainApi) {
        return;
      }

      try {
        const activeEra = await appchainApi.query.octopusLpos.activeEra();
        const eraJson: any = activeEra.toJSON();
        if (eraJson) {
          const eraPoints =
            await appchainApi.query.octopusLpos.erasRewardPoints(eraJson.index);
          const pointsJson = eraPoints.toJSON();
          pointsJson &&
            setValidatorsHasEraPoints(
              Object.keys((pointsJson as any).individual)
            );
        }
      } catch (error) {}
    }

    fetchEraPoints();
  }, [appchainApi]);

  const sortedValidators = useMemo(() => {
    if (!sortIdx || !validators?.length) {
      return validators;
    }

    let tmpArr: Validator[] = [...validators];

    if ([1, 2, 3, 4].includes(sortIdx)) {
      tmpArr.sort((a, b) => {
        const offset = DecimalUtil.fromString(a.total_stake, OCT_TOKEN_DECIMALS)
          .sub(DecimalUtil.fromString(b.total_stake, OCT_TOKEN_DECIMALS))
          .toNumber();
        return sortIdx % 2 === 1 ? offset : -offset;
      });
    } else if ([5, 6].includes(sortIdx)) {
      tmpArr.sort((a, b) => {
        const offset = DecimalUtil.fromString(a.delegators_count)
          .sub(DecimalUtil.fromString(b.delegators_count))
          .toNumber();
        return sortIdx % 2 === 1 ? offset : -offset;
      });
    }

    return tmpArr;
  }, [validators, sortIdx]);

  const onClaimUnbondedDelegatorRewards = (
    validator: string,
    rewards: RewardHistory[]
  ) => {
    setUnbondedRewardsValidatorId(validator);
    setUnbondedDelegatorRewards(rewards);
    setClaimRewardsModalOpen.on();
  };

  const { networkConfig } = useWalletSelector();
  const isMainnet = networkConfig?.near.networkId === "mainnet";

  return (
    <>
      <Flex justifyContent="space-between" alignItems="center">
        <HStack>
          <Heading fontSize="xl">Validators</Heading>
          <Link
            href={
              isMainnet
                ? "https://discord.gg/BEQrN4Ya7C"
                : "https://discord.gg/zgcdhu5BzT"
            }
            target="_blank"
            display={{ base: "none", md: "block" }}
          >
            <HStack
              bg="#8ecafc"
              borderRadius={4}
              pr={4}
              pt={1}
              pb={1}
              pl={14}
              position="relative"
            >
              <Image
                src={OTTO}
                style={{
                  position: "absolute",
                  width: 50,
                  height: 50,
                  left: 4,
                  top: -20,
                }}
              />
              <Text fontWeight="bold">
                Join Validators/Delegators exclusive Discord
              </Text>
            </HStack>
          </Link>
        </HStack>
      </Flex>
      <Box p={2} bg={bg} mt={4} borderRadius="lg" pb={6} minH="320px">
        <Box p={6}>
          <Grid
            templateColumns={{
              base: "repeat(5, 1fr)",
              md: "repeat(8, 1fr)",
              lg: "repeat(10, 1fr)",
            }}
            gap={2}
          >
            <GridItem colSpan={3}>
              <Text variant="gray">Validator ID</Text>
            </GridItem>
            <GridItem colSpan={3}>
              <SortButton
                label="Own/Total Staked"
                sortIdx={sortIdx}
                indexArr={[1, 2]}
                onChange={(v) => setSortIdx(v)}
              />
            </GridItem>
            <GridItem
              colSpan={2}
              display={{ base: "none", lg: "table-cell" }}
              textAlign="center"
            >
              <SortButton
                label="Rewards"
                sortIdx={sortIdx}
                indexArr={[3, 4]}
                onChange={(v) => setSortIdx(v)}
              />
            </GridItem>
            <GridItem
              colSpan={1}
              display={{ base: "none", md: "table-cell" }}
              textAlign="center"
            >
              <SortButton
                label="Delegators"
                sortIdx={sortIdx}
                indexArr={[5, 6]}
                onChange={(v) => setSortIdx(v)}
              />
            </GridItem>
            <GridItem colSpan={1} textAlign="right">
              <Text variant="gray">Operation</Text>
            </GridItem>
          </Grid>
        </Box>
        {isLoadingValidators ? (
          <Center minH="260px">
            <Spinner
              size="lg"
              thickness="5px"
              speed="1s"
              color="octo-blue.500"
            />
          </Center>
        ) : validators?.length ? (
          <List spacing={3} mt={2}>
            {sortedValidators?.map((v, idx) => {
              const ss58Address = formatAppChainAddress(
                v.validator_id_in_appchain,
                appchain
              );

              const isInAppchain = !!appchainValidators?.some(
                (s) => s.toLowerCase() === ss58Address.toLowerCase()
              );
              const haveSessionKey = !!validatorSessionKeys?.[v.validator_id];

              return (
                <ValidatorRow
                  validator={v}
                  key={`validator-${idx}`}
                  anchor={anchor}
                  appchainId={appchain?.appchain_id}
                  isLoading={
                    !appchainValidators?.length ||
                    !validatorSessionKeys ||
                    !validatorsHasEraPoints.length
                  }
                  isInAppchain={isInAppchain}
                  haveSessionKey={haveSessionKey}
                  ftMetadata={
                    appchain?.appchain_metadata.fungible_token_metadata
                  }
                  validatorSetHistoryEndIndex={
                    appchain?.anchor_status
                      ?.index_range_of_validator_set_history?.end_index
                  }
                  appchain={appchain}
                  validatorsHasEraPoints={validatorsHasEraPoints}
                />
              );
            })}
          </List>
        ) : (
          <Empty />
        )}
      </Box>
      <RewardsModal
        isOpen={claimRewardsModalOpen}
        onClose={setClaimRewardsModalOpen.off}
        validatorRewards={unbondedDelegatorRewards}
        anchor={anchor}
        appchain={appchain}
        validatorId={unbondedRewardsValidatorId}
      />
    </>
  );
};
