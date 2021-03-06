import React, { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import FocusLock from 'react-focus-lock';

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
  useToast
} from '@chakra-ui/react';

import { EditIcon } from '@chakra-ui/icons';
import { DecimalUtil, ZERO_DECIMAL } from 'utils';
import { Formik, Form, Field } from 'formik';
import { useGlobalStore } from 'stores';
import { OCT_TOKEN_DECIMALS, COMPLEX_CALL_GAS, FAILED_TO_REDIRECT_MESSAGE } from 'primitives';
import Decimal from 'decimal.js';

export const RegisterForm: React.FC = () => {
  const bg = useColorModeValue('white', '#15172c');
  const grayBg = useColorModeValue('#f2f4f7', '#1e1f34');

  const { onOpen: onTokenInfoPopoverOpen, onClose: onTokenInfoPopoverClose, isOpen: isTokenInfoPopoverOpen } = useDisclosure();

  const [auditingFee, setAuditingFee] = useState<Decimal>();
  const [tokenInfo, setTokenInfo] = useState({
    tokenName: '',
    tokenSymbol: '',
    icon: '',
    decimals: 18
  });
  const { global } = useGlobalStore();

  const { data: balances } = useSWR(global.accountId ? `balances/${global.accountId}` : null);

  const octBalance = useMemo(() => DecimalUtil.fromString(balances?.['OCT']), [balances]);

  const initialFieldRef = React.useRef(null);
  const toast = useToast();

  useEffect(() => {
    global.registry?.get_registry_settings().then(settings => {
      setAuditingFee(DecimalUtil.fromString(settings.minimum_register_deposit, OCT_TOKEN_DECIMALS));
    });
  }, [global]);

  const validateAppchainId = (value: string) => {
    const reg = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
    if (!reg.test(value)) {
      return 'Consists of [a-z|0-9] or `-`';
    }
  }

  const validateUrl = (value: string) => {
    if (!/^https:\/\//.test(value)) {
      return 'Start with https://';
    }
  }

  const validateEmail = (value: string) => {
    const reg = /^([a-zA-Z]|[0-9])(\w)+@[a-zA-Z0-9]+\.([a-zA-Z]{2,15})$/;
    if (!reg.test(value)) {
      return 'Invalid email';
    }
  }

  const validateInitialSupply = (value: string) => {
    if (Number.isNaN(value) || Number(value) <= 0 || !Number.isSafeInteger(value)) {
      return 'Invalid number';
    }
  }

  const onTokenInfoChange = (key: string, val: string) => {
    setTokenInfo(Object.assign({}, tokenInfo, {
      [key]: val
    }));
  }

  const onSubmit = (values: any, actions: any) => {
    const {
      appchainId, 
      website, 
      functionSpec, 
      email, 
      githubAddress,
      initialSupply,
      githubRelease, 
      preminedAmount, 
      preminedBeneficiary, 
      idoAmount, 
      eraReward
    } = values;

    if (!tokenInfo.tokenName || !tokenInfo.tokenSymbol) {
      toast({
        position: 'top-right',
        title: 'Error',
        description: 'Please input the token info',
        status: 'error'
      });
      setTimeout(() => {
        actions.setSubmitting(false);
      }, 300);
      return;
    }

    global.octToken?.ft_transfer_call(
      {
        receiver_id: global.network?.octopus.registryContractId || '',
        amount: DecimalUtil.toU64(auditingFee || ZERO_DECIMAL, OCT_TOKEN_DECIMALS).toString(),
        msg: JSON.stringify({
          RegisterAppchain: {
            "appchain_id": appchainId,
            "website_url": website,
            "github_address": githubAddress,
            "github_release": githubRelease,
            "contact_email": email,
            "function_spec_url": functionSpec,
            "premined_wrapped_appchain_token_beneficiary": preminedBeneficiary,
            "premined_wrapped_appchain_token": DecimalUtil.toU64(
              DecimalUtil.fromString(preminedAmount), tokenInfo.decimals
            ).toString(),
            "initial_supply_of_wrapped_appchain_token": DecimalUtil.toU64(
              DecimalUtil.fromString(initialSupply), tokenInfo.decimals
            ).toString(),
            "ido_amount_of_wrapped_appchain_token": DecimalUtil.toU64(
              DecimalUtil.fromString(idoAmount), tokenInfo.decimals
            ).toString(),
            "initial_era_reward": DecimalUtil.toU64(
              DecimalUtil.fromString(eraReward), tokenInfo.decimals
            ).toString(),
            "fungible_token_metadata": {
              "spec": "ft-1.0.0",
              "name": tokenInfo.tokenName,
              "symbol": tokenInfo.tokenSymbol,
              "icon": tokenInfo.icon,
              "reference": null,
              "reference_hash": null,
              "decimals": tokenInfo.decimals * 1
            },
            "custom_metadata": {}
          }
        })
      },
      COMPLEX_CALL_GAS,
      1,
    ).catch((err) => {
      actions.setSubmitting(false);
      if (err.message === FAILED_TO_REDIRECT_MESSAGE) {
        return;
      }
      toast({
        position: 'top-right',
        title: 'Error',
        description: err.toString(),
        status: 'error'
      });
    });
  }

  return (
    <Box bg={bg} p={6} borderRadius="lg">
      <Heading fontSize="3xl" mb={6}>Join Octopus</Heading>
      <Box p={4} borderRadius="lg" borderWidth={1}>
        <HStack>
          <Box borderRadius="full" boxSize={10} bg={grayBg} overflow="hidden">
            <Image src={tokenInfo.icon} w="100%" />
          </Box>
          <VStack alignItems="flex-start" spacing={0}>
            <Heading fontSize="md">{tokenInfo.tokenName || 'Token Name'}</Heading>
            <HStack fontSize="sm" >
              <Text variant="gray">{tokenInfo.tokenSymbol || 'Token Symbol'}, </Text>
              <Text variant="gray">Decimals: {tokenInfo.decimals}</Text>
            </HStack>
          </VStack>
          <Popover
            isOpen={isTokenInfoPopoverOpen}
            initialFocusRef={initialFieldRef}
            onOpen={onTokenInfoPopoverOpen}
            onClose={onTokenInfoPopoverClose}
            placement='right'
            closeOnBlur={false}
          >
            <PopoverTrigger>
              <Button size="sm"><EditIcon mr={2} /> Edit</Button>
            </PopoverTrigger>
            <PopoverContent p={5}>
              <FocusLock returnFocus persistentFocus={false}>
                <PopoverArrow />
                <PopoverCloseButton />
                <List spacing={3} mt={3}>
                  <Input placeholder="Token Name" ref={initialFieldRef} value={tokenInfo.tokenName} onChange={e => onTokenInfoChange('tokenName', e.target.value)} />
                  <Input placeholder="Token Symbol" value={tokenInfo.tokenSymbol} onChange={e => onTokenInfoChange('tokenSymbol', e.target.value)} />
                  <Input placeholder="Decimals" value={tokenInfo.decimals} onChange={e => onTokenInfoChange('decimals', e.target.value)} />
                  <Input placeholder="Icon" value={tokenInfo.icon} onChange={e => onTokenInfoChange('icon', e.target.value)} />
                </List>
              </FocusLock>
            </PopoverContent>
          </Popover>

        </HStack>

      </Box>
      <Formik
        initialValues={{
          appchainId: '',
          website: ''
        }}
        onSubmit={onSubmit}>
        {(props) => (
          <Form>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={6} mt={4}>
              <Field name="appchainId" validate={validateAppchainId}>
                {({ field, form }: any) => (
                  <FormControl isInvalid={form.errors.appchainId && form.touched.appchainId} isRequired>
                    <FormLabel htmlFor="appchainId">Appchain ID</FormLabel>
                    <Input {...field} id="appchainId" placeholder="Appchain ID" />
                    <FormErrorMessage>{form.errors.appchainId}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>
              <Field name="website" validate={validateUrl}>
                {({ field, form }: any) => (
                  <FormControl isInvalid={form.errors.website && form.touched.website} isRequired>
                    <FormLabel htmlFor="website">Website</FormLabel>
                    <Input {...field} id="website" placeholder="eg: https://www.oct.network" />
                    <FormErrorMessage>{form.errors.website}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>
              <Field name="functionSpec" validate={validateUrl}>
                {({ field, form }: any) => (
                  <FormControl isInvalid={form.errors.functionSpec && form.touched.functionSpec} isRequired>
                    <FormLabel htmlFor="functionSpec">Function Spec</FormLabel>
                    <Input {...field} id="functionSpec" placeholder="eg: https://github.com/octopus-network/barnacle/blob/master/README.md" />
                    <FormErrorMessage>{form.errors.functionSpec}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>
              <Field name="email" validate={validateEmail}>
                {({ field, form }: any) => (
                  <FormControl isInvalid={form.errors.email && form.touched.email} isRequired>
                    <FormLabel htmlFor="email">Email</FormLabel>
                    <Input {...field} id="email" placeholder="Contact email" />
                    <FormErrorMessage>{form.errors.email}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>
              <Field name="githubAddress" validate={validateUrl}>
                {({ field, form }: any) => (
                  <FormControl isInvalid={form.errors.githubAddress && form.touched.githubAddress} isRequired>
                    <FormLabel htmlFor="githubAddress">Github Address</FormLabel>
                    <Input {...field} id="githubAddress" placeholder="eg: https://github.com/octopus-network/barnacle" />
                    <FormErrorMessage>{form.errors.githubAddress}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>
              <Field name="githubRelease" validate={validateUrl}>
                {({ field, form }: any) => (
                  <FormControl isInvalid={form.errors.githubRelease && form.touched.githubRelease} isRequired>
                    <FormLabel htmlFor="githubRelease">Github Release</FormLabel>
                    <Input {...field} id="githubRelease" placeholder="eg: https://github.com/octopus-network/barnacle/releases/tag/v0.2-alpha.1" />
                    <FormErrorMessage>{form.errors.githubRelease}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>
              <Field name="initialSupply" validate={validateInitialSupply}>
                {({ field, form }: any) => (
                  <FormControl isInvalid={form.errors.initialSupply && form.touched.initialSupply} isRequired>
                    <FormLabel htmlFor="initialSupply">Initial Supply</FormLabel>
                    <Input {...field} type="number" id="initialSupply" placeholder="Initial supply" />
                    <FormErrorMessage>{form.errors.initialSupply}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>
              <Field name="eraReward">
                {({ field, form }: any) => (
                  <FormControl isInvalid={form.errors.eraReward && form.touched.eraReward} isRequired>
                    <FormLabel htmlFor="eraReward">Era Reward</FormLabel>
                    <Input {...field} type="number" id="eraReward" placeholder="0" defaultValue={0} />
                    <FormErrorMessage>{form.errors.eraReward}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>
              <SimpleGrid columns={2} gap={4}>
                <Field name="preminedAmount">
                  {({ field, form }: any) => (
                    <FormControl isInvalid={form.errors.preminedAmount && form.touched.preminedAmount}>
                      <FormLabel htmlFor="preminedAmount">Premined</FormLabel>
                      <Input {...field} type="number" id="preminedAmount" placeholder="0" defaultValue={0} />
                      <FormErrorMessage>{form.errors.preminedAmount}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
                <Field name="preminedBeneficiary">
                  {({ field, form }: any) => (
                    <FormControl isInvalid={form.errors.preminedBeneficiary && form.touched.preminedBeneficiary}>
                      <FormLabel htmlFor="preminedBeneficiary">Beneficiary</FormLabel>
                      <Input {...field} id="preminedBeneficiary" placeholder="Beneficiary NEAR account" />
                      <FormErrorMessage>{form.errors.preminedBeneficiary}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
              </SimpleGrid>
              <Field name="idoAmount">
                {({ field, form }: any) => (
                  <FormControl isInvalid={form.errors.idoAmount && form.touched.idoAmount}>
                    <FormLabel htmlFor="idoAmount">IDO Amount</FormLabel>
                    <Input {...field} type="number" id="idoAmount" placeholder="0" defaultValue={0} />
                    <FormErrorMessage>{form.errors.idoAmount}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>
              
              <VStack spacing={1} alignItems="flex-start" justifyContent="center">
                <HStack>
                  <Heading fontSize="md">Auditing Fee:</Heading>
                  <Skeleton isLoaded={auditingFee !== undefined}>
                    <Heading fontSize="md" color="octo-blue.500">
                      {auditingFee !== undefined ? DecimalUtil.beautify(auditingFee) : 'loading'}
                    </Heading>
                  </Skeleton>
                  <Heading fontSize="md">OCT</Heading>
                </HStack>
                {
                  global.accountId ?
                    <Skeleton isLoaded={!!balances}>
                      <Text variant="gray" fontSize="sm">Balance: {
                        !!balances ?
                          DecimalUtil.beautify(octBalance) : 'loading'
                      } OCT</Text>
                    </Skeleton> : null
                }
              </VStack>
              <Box>
                <Button
                  colorScheme="octo-blue"
                  isLoading={props.isSubmitting}
                  type="submit"
                  disabled={
                    props.isSubmitting || !global.accountId || !auditingFee ||
                    octBalance.lt(auditingFee)
                  }>
                  {
                    !global.accountId ?
                      'Please Login' :
                      (auditingFee && balances && octBalance.lt(auditingFee)) ?
                        'Insufficient Balance' :
                        'Register'
                  }
                </Button>
              </Box>
            </SimpleGrid>
          </Form>
        )}

      </Formik>
    </Box>
  );
}