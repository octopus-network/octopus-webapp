import React, { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import Decimal from "decimal.js";

import {
  DrawerHeader,
  DrawerBody,
  Flex,
  VStack,
  Box,
  Heading,
  CloseButton,
  Button,
  HStack,
  Skeleton,
  Icon,
  Avatar,
  Text,
  Center,
  Spinner,
  Link,
  useClipboard,
  useBoolean,
  SimpleGrid,
  useColorModeValue,
  IconButton,
  DrawerFooter,
  Divider,
} from "@chakra-ui/react";

import {
  ValidatorSessionKey,
  Validator,
  ValidatorProfile as ValidatorProfileType,
  AnchorContract,
  Delegator,
  AppchainInfoWithAnchorStatus,
} from "types";

import { COMPLEX_CALL_GAS, OCT_TOKEN_DECIMALS } from "primitives";

import {
  CheckIcon,
  CopyIcon,
  AddIcon,
  MinusIcon,
  EditIcon,
} from "@chakra-ui/icons";
import { BiDoorOpen, BiLogOut } from "react-icons/bi";
import { Empty, Alert } from "components";
import { AiOutlineCloseCircle } from "react-icons/ai";
import { StateBadge, LoginButton } from "components";

import { DelegatorsTable } from "./DelegatorsTable";
import { StakingPopover } from "../StakingPopover";
import { DelegateModal } from "./DelegateModal";
import { DecimalUtil, toShortAddress, ZERO_DECIMAL } from "utils";

import octoAvatar from "assets/icons/avatar.png";
import { formatAppChainAddress } from "utils/format";
import OctIdenticon from "components/common/OctIdenticon";
import { useWalletSelector } from "components/WalletSelectorContextProvider";
import { Toast } from "components/common/toast";
import { onTxSent } from "utils/helper";
import SetupEmail from "../SetupEmail";

type ValidatorProfileProps = {
  appchain?: AppchainInfoWithAnchorStatus;
  anchor?: AnchorContract;
  validatorId: string;
  appchainValidators?: string[];
  validators?: Validator[];
  validatorSessionKeys?: Record<string, ValidatorSessionKey>;
  onDrawerClose: () => void;
};

export const ValidatorProfile: React.FC<ValidatorProfileProps> = ({
  appchain,
  validatorId,
  anchor,
  validators,
  appchainValidators,
  validatorSessionKeys,
  onDrawerClose,
}) => {
  const validator = useMemo(
    () => validators?.find((v) => v.validator_id === validatorId),
    [validators, validatorId]
  );

  const bg = useColorModeValue("#f6f7fa", "#15172c");
  const footerBg = useColorModeValue("#f6f7fa", "#15172c");

  const [validatorProfile, setValidatorProfile] =
    useState<ValidatorProfileType>();
  const [delegatedDeposits, setDelegatedDeposits] = useState(ZERO_DECIMAL);

  const [isTogglingDelegation, setIsTogglingDelegation] = useBoolean();

  const [unbondAlertOpen, setUnbondAlertOpen] = useBoolean();
  const [unbondDelegationAlertOpen, setUnbondDelegationAlertOpen] =
    useBoolean();
  const [isUnbonding, setIsUnbonding] = useBoolean();
  const [isUnbondingDelegation, setIsUnbondingDelegation] = useBoolean();
  const [delegateModalOpen, setDelegateModalOpen] = useBoolean();
  const [updateEmail, setUpdateEmail] = useBoolean();

  const { accountId, selector } = useWalletSelector();

  const { data: delegators } = useSWR<Delegator[]>(
    appchain && validatorId
      ? `${validatorId}/${appchain?.appchain_id}/delegators`
      : null
  );

  const isDelegated = useMemo(
    () => accountId && !!delegators?.find((d) => d.delegator_id === accountId),
    [delegators, accountId]
  );

  const { data: balances } = useSWR(accountId ? `balances/${accountId}` : null);

  useEffect(() => {
    if (!anchor || !appchain || !accountId) {
      return;
    }
    anchor
      ?.get_delegator_deposit_of({
        delegator_id: accountId,
        validator_id: validator?.validator_id || "",
      })
      .then((deposit) => {
        setDelegatedDeposits(
          DecimalUtil.fromString(deposit, OCT_TOKEN_DECIMALS)
        );
      });
  }, [anchor, accountId, validator, appchain]);

  useEffect(() => {
    if (!validator || !anchor) {
      return;
    }

    anchor
      .get_validator_profile({ validator_id: validator.validator_id })
      .then((profile) => {
        setValidatorProfile(profile);
      });
  }, [anchor, validator]);

  const ss58Address = formatAppChainAddress(
    validator?.validator_id_in_appchain,
    appchain
  );

  const { hasCopied: hasSS58AddressCopied, onCopy: onSS58AddressCopy } =
    useClipboard(ss58Address);

  const { hasCopied: hasEmailCopied, onCopy: onEmailCopy } = useClipboard(
    validatorProfile?.profile?.email ?? ""
  );

  const isMyself = useMemo(
    () => validator && accountId === validator.validator_id,
    [accountId, validator]
  );

  const validatorState = useMemo(() => {
    if (
      !validator ||
      !appchainValidators ||
      !validatorSessionKeys ||
      !ss58Address
    ) {
      return "Unknown";
    }

    const sessionKey = validatorSessionKeys[validator.validator_id];
    if (validator?.is_unbonding) {
      return "Unbonding";
    } else if (
      appchainValidators.some(
        (s) => s.toLowerCase() === ss58Address.toLowerCase()
      ) &&
      sessionKey
    ) {
      return "Validating";
    } else if (
      appchainValidators.some(
        (s) => s.toLowerCase() === ss58Address.toLowerCase()
      ) &&
      !sessionKey
    ) {
      return "Need Keys";
    } else if (
      !appchainValidators.some(
        (s) => s.toLowerCase() === ss58Address.toLowerCase()
      )
    ) {
      return "Registered";
    }

    return "Unknown";
  }, [validator, appchainValidators, validatorSessionKeys, ss58Address]);

  const toggleDelegation = async () => {
    try {
      setIsTogglingDelegation.on();
      const wallet = await selector.wallet();
      await wallet.signAndSendTransaction({
        signerId: accountId,
        receiverId: anchor?.contractId,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: validator?.can_be_delegated_to
                ? "disable_delegation"
                : "enable_delegation",
              args: {},
              gas: COMPLEX_CALL_GAS,
              deposit: "0",
            },
          },
        ],
      });
      Toast.success(
        validator?.can_be_delegated_to
          ? "Delegation disabled"
          : "Delegation enabled"
      );
      setIsTogglingDelegation.off();
      onTxSent();
    } catch (err) {
      Toast.error(err);
      setIsTogglingDelegation.off();
    }
  };

  const onUnbondValidator = async () => {
    try {
      setIsUnbonding.on();
      const wallet = await selector.wallet();
      await wallet.signAndSendTransaction({
        signerId: accountId,
        receiverId: anchor?.contractId,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "unbond_stake",
              args: {},
              gas: COMPLEX_CALL_GAS,
              deposit: "0",
            },
          },
        ],
      });
      Toast.success("Unbonded");
      setIsUnbonding.off();
      onTxSent();
    } catch (error) {
      Toast.error(error);
      setIsUnbonding.off();
    }
  };

  const onUnbondDelegation = async () => {
    try {
      setIsUnbondingDelegation.on();
      const wallet = await selector.wallet();
      await wallet.signAndSendTransaction({
        signerId: accountId,
        receiverId: anchor?.contractId,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "unbond_delegation",
              args: { validator_id: validator?.validator_id || "" },
              gas: COMPLEX_CALL_GAS,
              deposit: "0",
            },
          },
        ],
      });
      Toast.success("Unbonded");
      setIsUnbondingDelegation.off();
      onTxSent();
    } catch (error) {
      setIsUnbondingDelegation.off();
    }
  };

  return (
    <>
      <>
        <DrawerHeader borderBottomWidth="0">
          <Flex justifyContent="space-between" alignItems="center">
            <Heading fontSize="lg">Validator Profile</Heading>
            <CloseButton onClick={onDrawerClose} />
          </Flex>
        </DrawerHeader>
        <DrawerBody>
          <Box p={4} bg={bg} borderRadius="lg">
            <Skeleton isLoaded={validatorState !== "Unknown"}>
              <Flex justifyContent="space-between" alignItems="center">
                <HStack maxW="calc(100% - 120px)">
                  <OctIdenticon size={32} value={ss58Address} />
                  <Heading
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    w="100%"
                    fontSize="lg"
                  >
                    {validatorId}@{appchain?.appchain_id}
                  </Heading>
                </HStack>
                <StateBadge state={validatorState} />
              </Flex>
            </Skeleton>
            <VStack
              w="100%"
              mt={3}
              className="octo-gray"
              spacing={1}
              justifyContent="flex-start"
            >
              <HStack justify="flex-start" width="100%">
                <Text ml={2} title={ss58Address}>
                  {toShortAddress(ss58Address)}
                </Text>
                <Button variant="link" onClick={onSS58AddressCopy} size="sm">
                  {hasSS58AddressCopied ? <CheckIcon /> : <CopyIcon />}
                </Button>
              </HStack>
              {validatorProfile?.profile?.email && (
                <HStack justify="flex-start" width="100%">
                  <Text ml={2}>{validatorProfile?.profile?.email}</Text>
                  <Button variant="link" onClick={onEmailCopy} size="sm">
                    {hasEmailCopied ? <CheckIcon /> : <CopyIcon />}
                  </Button>

                  {validator?.validator_id === accountId && (
                    <Button
                      variant="link"
                      onClick={setUpdateEmail.on}
                      size="sm"
                    >
                      <EditIcon />
                    </Button>
                  )}
                </HStack>
              )}

              {validatorProfile?.profile?.socialMediaHandle && (
                <HStack justify="flex-start" width="100%">
                  <Link
                    href={`https://www.twitter.com/${validatorProfile?.profile?.socialMediaHandle}`}
                  >
                    <HStack>
                      <Text ml={2}>
                        {validatorProfile?.profile?.socialMediaHandle}
                      </Text>
                    </HStack>
                  </Link>
                </HStack>
              )}
            </VStack>
          </Box>
          <Box mt={4}>
            {isMyself && !validator?.is_unbonding ? (
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                <Button
                  colorScheme={
                    validator?.can_be_delegated_to ? "gray" : "octo-blue"
                  }
                  onClick={toggleDelegation}
                  isLoading={isTogglingDelegation}
                  isDisabled={isTogglingDelegation}
                >
                  <Icon
                    as={
                      validator?.can_be_delegated_to
                        ? AiOutlineCloseCircle
                        : BiDoorOpen
                    }
                    mr={2}
                  />
                  {validator?.can_be_delegated_to
                    ? "Disable Delegation"
                    : "Enable Delegation"}
                </Button>
                <Button colorScheme="red" onClick={setUnbondAlertOpen.on}>
                  <Icon as={BiLogOut} mr={2} /> Unbond Validator
                </Button>
              </SimpleGrid>
            ) : null}
          </Box>
          {isDelegated ? (
            <Box mt={4} p={4} borderWidth={1} borderRadius="lg">
              <Flex alignItems="center" justifyContent="space-between">
                <Heading fontSize="md">Delegated</Heading>
                <HStack spacing={4}>
                  <StakingPopover
                    trigger={
                      <IconButton aria-label="Decrease Delegation" size="sm">
                        <Icon as={MinusIcon} boxSize={3} />
                      </IconButton>
                    }
                    type="decrease"
                    anchor={anchor}
                    deposited={delegatedDeposits}
                    validatorId={validatorId}
                    helper={`Your decreased stake will be claimable after 21 days`}
                    validator={validator}
                    appchain={appchain}
                  />

                  <Heading fontSize="md">
                    {DecimalUtil.beautify(delegatedDeposits)} OCT
                  </Heading>

                  <StakingPopover
                    trigger={
                      <IconButton
                        aria-label="Increase Delegation"
                        size="sm"
                        colorScheme="octo-blue"
                      >
                        <Icon as={AddIcon} boxSize={3} />
                      </IconButton>
                    }
                    type="increase"
                    validatorId={validatorId}
                    deposited={delegatedDeposits}
                    anchor={anchor}
                    validator={validator}
                    appchain={appchain}
                  />
                </HStack>
              </Flex>
              <Divider mt={4} mb={4} />
              <SimpleGrid columns={{ base: 1, md: 1 }} gap={4}>
                <Button
                  colorScheme="red"
                  onClick={setUnbondDelegationAlertOpen.on}
                >
                  <Icon as={BiLogOut} mr={2} /> Unbond Delegation
                </Button>
              </SimpleGrid>
            </Box>
          ) : null}

          <Box mt={4} p={4} borderWidth={1} borderRadius="lg">
            <Flex alignItems="center" justifyContent="space-between">
              <Heading fontSize="md">Delegators</Heading>
              {accountId && validator && !isDelegated ? (
                <Button
                  colorScheme="octo-blue"
                  size="sm"
                  onClick={setDelegateModalOpen.on}
                  isDisabled={
                    !validator?.can_be_delegated_to ||
                    validatorState !== "Validating"
                  }
                >
                  {validator && !validator.can_be_delegated_to ? (
                    "Delegation Disabled"
                  ) : (
                    <>
                      <Icon as={AddIcon} mr={2} boxSize={3} />
                      <Text>Delegate</Text>
                    </>
                  )}
                </Button>
              ) : null}
            </Flex>
            <Divider mt={4} mb={4} />
            <Box>
              {!delegators ? (
                <Center minH="160px">
                  <Spinner
                    size="md"
                    thickness="4px"
                    speed="1s"
                    color="octo-blue.500"
                  />
                </Center>
              ) : !delegators.length ? (
                <Empty message="No Delegators" />
              ) : (
                <DelegatorsTable delegators={delegators} />
              )}
            </Box>
          </Box>
        </DrawerBody>
        <DrawerFooter justifyContent="flex-start">
          <Box bg={footerBg} p={4} borderRadius="lg" w="100%">
            <Flex justifyContent="space-between" alignItems="center">
              {accountId ? (
                <HStack>
                  <Avatar
                    boxSize={8}
                    src={octoAvatar}
                    display={{ base: "none", md: "block" }}
                  />
                  <Heading fontSize="lg">{accountId}</Heading>
                </HStack>
              ) : (
                <LoginButton />
              )}
              {accountId ? (
                <VStack alignItems="flex-end" spacing={0}>
                  <HStack>
                    <Text
                      variant="gray"
                      display={{ base: "none", md: "block" }}
                    >
                      Balance:
                    </Text>
                    <Heading fontSize="md" color="octo-blue.500">
                      {DecimalUtil.beautify(
                        new Decimal(
                          balances?.[
                            appchain?.appchain_metadata?.fungible_token_metadata
                              ?.symbol as any
                          ] || 0
                        )
                      )}{" "}
                      {
                        appchain?.appchain_metadata?.fungible_token_metadata
                          ?.symbol
                      }
                    </Heading>
                  </HStack>
                  <Text fontSize="sm" className="octo-gray">
                    {DecimalUtil.beautify(new Decimal(balances?.["OCT"] || 0))}{" "}
                    OCT
                  </Text>
                </VStack>
              ) : null}
            </Flex>
          </Box>
        </DrawerFooter>
      </>
      {updateEmail && (
        <SetupEmail
          anchor={anchor}
          validator={validator}
          isUpdate={updateEmail}
          oldValidatorProfile={validatorProfile}
          onClose={setUpdateEmail.off}
        />
      )}
      <Alert
        isOpen={unbondAlertOpen}
        onClose={setUnbondAlertOpen.off}
        title="Unbond Validator"
        confirmButtonText="Unbond"
        isConfirming={isUnbonding}
        message={`Your unbonded stake will be claimable after 21 days. Destroy your node after next rewards claimed, or your AWS/DO will still be charged.Are you confirm to unbond?`}
        onConfirm={onUnbondValidator}
        confirmButtonColor="red"
      />

      <Alert
        isOpen={unbondDelegationAlertOpen}
        onClose={setUnbondDelegationAlertOpen.off}
        title="Unbond Delegation"
        confirmButtonText="Unbond"
        isConfirming={isUnbondingDelegation}
        message={`Are you confirm to unbond delegation? (Your unbonded stake will be claimable after 21 days)`}
        onConfirm={onUnbondDelegation}
        confirmButtonColor="red"
      />

      <DelegateModal
        isOpen={delegateModalOpen}
        anchor={anchor}
        onClose={setDelegateModalOpen.off}
        validatorId={validator?.validator_id || ""}
      />
    </>
  );
};
