import React, { useState, useEffect } from "react";
import FocusLock from "react-focus-lock";

import {
  Box,
  Heading,
  Button,
  HStack,
  Text,
  VStack,
  Skeleton,
  SimpleGrid,
  FormControl,
  FormLabel,
  Input,
  List,
  Image,
  FormErrorMessage,
  useColorModeValue,
  useDisclosure,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  Textarea,
  GridItem,
  RadioGroup,
  Radio,
  Stack,
} from "@chakra-ui/react";

import { EditIcon } from "@chakra-ui/icons";
import { DecimalUtil, ZERO_DECIMAL } from "utils";
import { Formik, Form, Field } from "formik";
import { OCT_TOKEN_DECIMALS, COMPLEX_CALL_GAS } from "primitives";
import Decimal from "decimal.js";
import { useWalletSelector } from "components/WalletSelectorContextProvider";
import { Toast } from "components/common/toast";
import { EMAIL_REGEX } from "config/constants";
import { providers } from "near-api-js";
import { CodeResult } from "near-api-js/lib/providers/provider";
import useBalance from "hooks/useBalance";
import { NETWORK_CONFIG } from "config";

export const RegisterForm: React.FC = () => {
  const bg = useColorModeValue("white", "#15172c");
  const grayBg = useColorModeValue("#f2f4f7", "#1e1f34");

  const {
    onOpen: onTokenInfoPopoverOpen,
    onClose: onTokenInfoPopoverClose,
    isOpen: isTokenInfoPopoverOpen,
  } = useDisclosure();

  const [auditingFee, setAuditingFee] = useState<Decimal>();
  const [tokenInfo, setTokenInfo] = useState({
    tokenName: "",
    tokenSymbol: "",
    icon: "",
    decimals: 18,
  });
  const { accountId, networkConfig, selector } = useWalletSelector();

  const octBalance = useBalance(NETWORK_CONFIG.octopus.octTokenContractId);

  const initialFieldRef = React.useRef(null);

  useEffect(() => {
    const provider = new providers.JsonRpcProvider({
      url: selector.options.network.nodeUrl,
    });
    provider
      .query<CodeResult>({
        request_type: "call_function",
        account_id: networkConfig?.octopus.registryContractId,
        method_name: "get_registry_settings",
        args_base64: "",
        finality: "final",
      })
      .then((res) => {
        const result = JSON.parse(Buffer.from(res.result).toString());
        setAuditingFee(
          DecimalUtil.fromString(
            result.minimum_register_deposit,
            OCT_TOKEN_DECIMALS
          )
        );
      })
      .catch(console.log);
  }, [
    selector.options.network.nodeUrl,
    networkConfig?.octopus.registryContractId,
  ]);

  const validateAppchainId = (value: string) => {
    const reg = /^[a-z]([-a-z0-9]*[a-z0-9]){1,20}$/;
    if (!reg.test(value)) {
      return "Consists of [a-z|0-9] or `-`, and max length is 20";
    }
  };

  const validateUrl = (value: string) => {
    if (!/^https:\/\//.test(value)) {
      return "Start with https://";
    }
  };

  const validateEmail = (value: string) => {
    if (!EMAIL_REGEX.test(value)) {
      return "Invalid email";
    }
  };

  const validateInitialSupply = (value: string) => {
    if (
      Number.isNaN(value) ||
      Number(value) <= 0 ||
      !Number.isSafeInteger(value)
    ) {
      return "Invalid number";
    }
  };

  const onTokenInfoChange = (key: string, val: string | number) => {
    setTokenInfo(
      Object.assign({}, tokenInfo, {
        [key]: val,
      })
    );
  };

  const onSubmit = async (values: any, actions: any) => {
    const {
      appchainId,
      website,
      email,
      githubAddress,
      initialSupply,
      preminedAmount,
      preminedBeneficiary,
      idoAmount,
      eraReward,
      description,
      templateType,
      evmChainId,
    } = values;

    actions.setSubmitting(true);
    if (!tokenInfo.tokenName || !tokenInfo.tokenSymbol) {
      Toast.error("Please input the token info");
      setTimeout(() => {
        actions.setSubmitting(false);
      }, 300);
      return;
    }

    try {
      const wallet = await selector.wallet();
      await wallet.signAndSendTransaction({
        signerId: accountId,
        receiverId: networkConfig?.octopus.octTokenContractId,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "ft_transfer_call",
              args: {
                receiver_id: networkConfig?.octopus.registryContractId || "",
                amount: DecimalUtil.toU64(
                  auditingFee || ZERO_DECIMAL,
                  OCT_TOKEN_DECIMALS
                ).toString(),
                msg: JSON.stringify({
                  RegisterAppchain: {
                    appchain_id: appchainId,
                    website_url: website,
                    description: description || "",
                    github_address: githubAddress,
                    contact_email: email,
                    template_type: {
                      Substrate: templateType,
                    },
                    evm_chain_id:
                      templateType === "BarnacleEvm" ? evmChainId : null,
                    premined_wrapped_appchain_token_beneficiary:
                      preminedBeneficiary,
                    premined_wrapped_appchain_token: DecimalUtil.toU64(
                      DecimalUtil.fromString(preminedAmount),
                      tokenInfo.decimals
                    ).toString(),
                    initial_supply_of_wrapped_appchain_token: DecimalUtil.toU64(
                      DecimalUtil.fromString(initialSupply),
                      tokenInfo.decimals
                    ).toString(),
                    ido_amount_of_wrapped_appchain_token: DecimalUtil.toU64(
                      DecimalUtil.fromString(idoAmount),
                      tokenInfo.decimals
                    ).toString(),
                    initial_era_reward: DecimalUtil.toU64(
                      DecimalUtil.fromString(eraReward),
                      tokenInfo.decimals
                    ).toString(),
                    fungible_token_metadata: {
                      spec: "ft-1.0.0",
                      name: tokenInfo.tokenName,
                      symbol: tokenInfo.tokenSymbol,
                      icon: tokenInfo.icon,
                      reference: null,
                      reference_hash: null,
                      decimals: tokenInfo.decimals * 1,
                    },
                    custom_metadata: {},
                  },
                }),
              },
              gas: COMPLEX_CALL_GAS,
              deposit: "1",
            },
          },
        ],
        callbackUrl: window.location.origin + "/appchains",
      });
      Toast.success("Registered");
      actions.setSubmitting(false);
    } catch (error) {
      actions.setSubmitting(false);
      Toast.error(error);
    }
  };

  return (
    <Box bg={bg} p={6} borderRadius="md">
      <Heading fontSize="3xl" mb={6}>
        Join Octopus
      </Heading>
      <Box p={4} borderRadius="sm" borderWidth={1}>
        <HStack>
          <Box borderRadius="full" boxSize={10} bg={grayBg} overflow="hidden">
            <Image src={tokenInfo.icon} w="100%" />
          </Box>
          <VStack alignItems="flex-start" spacing={0}>
            <Heading fontSize="md">
              {tokenInfo.tokenName || "Token Name"}
            </Heading>
            <HStack fontSize="sm">
              <Text variant="gray">
                {tokenInfo.tokenSymbol || "Token Symbol"},{" "}
              </Text>
              <Text variant="gray">Decimals: {tokenInfo.decimals}</Text>
            </HStack>
          </VStack>
          <Popover
            isOpen={isTokenInfoPopoverOpen}
            initialFocusRef={initialFieldRef}
            onOpen={onTokenInfoPopoverOpen}
            onClose={onTokenInfoPopoverClose}
            placement="right"
            closeOnBlur={false}
          >
            <PopoverTrigger>
              <Button size="sm">
                <EditIcon mr={2} /> Edit
              </Button>
            </PopoverTrigger>
            <PopoverContent p={5}>
              <FocusLock returnFocus persistentFocus={false}>
                <PopoverArrow />
                <PopoverCloseButton />
                <List spacing={3} mt={3}>
                  <Input
                    placeholder="Token Name"
                    ref={initialFieldRef}
                    value={tokenInfo.tokenName}
                    onChange={(e) =>
                      onTokenInfoChange("tokenName", e.target.value)
                    }
                  />
                  <Input
                    placeholder="Token Symbol"
                    value={tokenInfo.tokenSymbol}
                    onChange={(e) =>
                      onTokenInfoChange("tokenSymbol", e.target.value)
                    }
                  />
                  <Input
                    placeholder="Decimals"
                    value={tokenInfo.decimals}
                    onChange={(e) =>
                      onTokenInfoChange("decimals", Number(e.target.value))
                    }
                  />
                  <Input
                    placeholder="Icon"
                    value={tokenInfo.icon}
                    onChange={(e) => onTokenInfoChange("icon", e.target.value)}
                  />
                </List>
              </FocusLock>
            </PopoverContent>
          </Popover>
        </HStack>
      </Box>
      <Formik
        initialValues={{
          appchainId: "",
          website: "",
          templateType: "Barnacle",
        }}
        onSubmit={onSubmit}
      >
        {(props) => {
          return (
            <Form>
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={6} mt={4}>
                <Field name="appchainId" validate={validateAppchainId}>
                  {({ field, form }: any) => (
                    <FormControl
                      isInvalid={
                        form.errors.appchainId && form.touched.appchainId
                      }
                      isRequired
                    >
                      <FormLabel htmlFor="appchainId">Appchain ID</FormLabel>
                      <Input
                        {...field}
                        id="appchainId"
                        placeholder="Appchain ID"
                        maxLength={20}
                      />
                      <FormErrorMessage>
                        {form.errors.appchainId}
                      </FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
                <Field name="website" validate={validateUrl}>
                  {({ field, form }: any) => (
                    <FormControl
                      isInvalid={form.errors.website && form.touched.website}
                      isRequired
                    >
                      <FormLabel htmlFor="website">Website</FormLabel>
                      <Input
                        {...field}
                        id="website"
                        placeholder="eg: https://www.oct.network"
                      />
                      <FormErrorMessage>{form.errors.website}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
                <Field name="email" validate={validateEmail}>
                  {({ field, form }: any) => (
                    <FormControl
                      isInvalid={form.errors.email && form.touched.email}
                      isRequired
                    >
                      <FormLabel htmlFor="email">Email</FormLabel>
                      <Input
                        {...field}
                        id="email"
                        placeholder="Contact email"
                      />
                      <FormErrorMessage>{form.errors.email}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
                <Field name="githubAddress" validate={validateUrl}>
                  {({ field, form }: any) => (
                    <FormControl
                      isInvalid={
                        form.errors.githubAddress && form.touched.githubAddress
                      }
                      isRequired
                    >
                      <FormLabel htmlFor="githubAddress">
                        Github Address
                      </FormLabel>
                      <Input
                        {...field}
                        id="githubAddress"
                        placeholder="eg: https://github.com/octopus-network/barnacle"
                      />
                      <FormErrorMessage>
                        {form.errors.githubAddress}
                      </FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
                <Field name="initialSupply" validate={validateInitialSupply}>
                  {({ field, form }: any) => (
                    <FormControl
                      isInvalid={
                        form.errors.initialSupply && form.touched.initialSupply
                      }
                      isRequired
                    >
                      <FormLabel htmlFor="initialSupply">
                        Initial Supply
                      </FormLabel>
                      <Input
                        {...field}
                        type="number"
                        id="initialSupply"
                        placeholder="Initial supply"
                      />
                      <FormErrorMessage>
                        {form.errors.initialSupply}
                      </FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
                <Field name="eraReward">
                  {({ field, form }: any) => (
                    <FormControl
                      isInvalid={
                        form.errors.eraReward && form.touched.eraReward
                      }
                      isRequired
                    >
                      <FormLabel htmlFor="eraReward">Daily Reward</FormLabel>
                      <Input
                        {...field}
                        type="number"
                        id="eraReward"
                        placeholder="0"
                        defaultValue={0}
                      />
                      <FormErrorMessage>
                        {form.errors.eraReward}
                      </FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
                <SimpleGrid columns={2} gap={4}>
                  <Field name="preminedAmount">
                    {({ field, form }: any) => (
                      <FormControl
                        isInvalid={
                          form.errors.preminedAmount &&
                          form.touched.preminedAmount
                        }
                      >
                        <FormLabel htmlFor="preminedAmount">Premined</FormLabel>
                        <Input
                          {...field}
                          type="number"
                          id="preminedAmount"
                          placeholder="0"
                          defaultValue={0}
                        />
                        <FormErrorMessage>
                          {form.errors.preminedAmount}
                        </FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>
                  <Field name="preminedBeneficiary">
                    {({ field, form }: any) => (
                      <FormControl
                        isInvalid={
                          form.errors.preminedBeneficiary &&
                          form.touched.preminedBeneficiary
                        }
                      >
                        <FormLabel htmlFor="preminedBeneficiary">
                          Beneficiary
                        </FormLabel>
                        <Input
                          {...field}
                          id="preminedBeneficiary"
                          placeholder="Beneficiary NEAR account"
                        />
                        <FormErrorMessage>
                          {form.errors.preminedBeneficiary}
                        </FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>
                </SimpleGrid>
                <Field name="idoAmount">
                  {({ field, form }: any) => (
                    <FormControl
                      isInvalid={
                        form.errors.idoAmount && form.touched.idoAmount
                      }
                    >
                      <FormLabel htmlFor="idoAmount">IDO Amount</FormLabel>
                      <Input
                        {...field}
                        type="number"
                        id="idoAmount"
                        placeholder="0"
                        defaultValue={0}
                      />
                      <FormErrorMessage>
                        {form.errors.idoAmount}
                      </FormErrorMessage>
                    </FormControl>
                  )}
                </Field>

                <VStack>
                  <Field name="templateType">
                    {({ field, form }: any) => (
                      <FormControl isRequired>
                        <FormLabel htmlFor="templateType">
                          Template Type
                        </FormLabel>
                        <RadioGroup {...field} defaultValue="Barnacle">
                          <Stack>
                            <Radio {...field} value="Barnacle">
                              Barnacle
                            </Radio>
                            <Radio {...field} value="BarnacleEvm">
                              BarnacleEvm
                            </Radio>
                          </Stack>
                        </RadioGroup>
                      </FormControl>
                    )}
                  </Field>

                  {props.values.templateType === "BarnacleEvm" && (
                    <Field name="evmChainId">
                      {({ field, form }: any) => (
                        <FormControl
                          isInvalid={
                            form.errors.evmChainId && form.touched.evmChainId
                          }
                          isRequired
                        >
                          <HStack alignItems="center">
                            <FormLabel
                              htmlFor="evmChainId"
                              whiteSpace="nowrap"
                              marginBottom="0"
                            >
                              Evm Chain ID
                            </FormLabel>
                            <Input
                              {...field}
                              type="number"
                              min={1}
                              id="evmChainId"
                              placeholder="0"
                              defaultValue={1}
                            />
                          </HStack>
                        </FormControl>
                      )}
                    </Field>
                  )}
                </VStack>
                <GridItem>
                  <Field name="description">
                    {({ field, form }: any) => (
                      <FormControl
                        isInvalid={
                          form.errors.description && form.touched.description
                        }
                      >
                        <FormLabel htmlFor="description">
                          Project description
                        </FormLabel>
                        <Textarea
                          {...field}
                          id="description"
                          placeholder="Description for your project"
                          maxLength={256}
                        />
                        <FormErrorMessage>
                          {form.errors.description}
                        </FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>
                </GridItem>

                <VStack
                  spacing={1}
                  alignItems="flex-start"
                  justifyContent="center"
                >
                  <HStack>
                    <Heading fontSize="md">Auditing Fee:</Heading>
                    <Skeleton isLoaded={auditingFee !== undefined}>
                      <Heading fontSize="md" color="octo-blue.500">
                        {auditingFee !== undefined
                          ? DecimalUtil.beautify(auditingFee)
                          : "loading"}
                      </Heading>
                    </Skeleton>
                    <Heading fontSize="md">OCT</Heading>
                  </HStack>
                  {accountId ? (
                    <Text variant="gray" fontSize="sm">
                      Balance: {DecimalUtil.beautify(octBalance)} OCT
                    </Text>
                  ) : null}
                </VStack>
                <Box>
                  <Button
                    colorScheme="octo-blue"
                    isLoading={props.isSubmitting}
                    type="submit"
                    disabled={
                      props.isSubmitting ||
                      !accountId ||
                      !auditingFee ||
                      octBalance.lt(auditingFee)
                    }
                  >
                    {!accountId
                      ? "Please Login"
                      : auditingFee && octBalance.lt(auditingFee)
                      ? "Insufficient Balance"
                      : "Register"}
                  </Button>
                </Box>
              </SimpleGrid>
            </Form>
          );
        }}
      </Formik>
    </Box>
  );
};
