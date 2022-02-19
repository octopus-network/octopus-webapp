import React, { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';

import {
  DrawerHeader,
  DrawerBody,
  Flex,
  Box,
  Heading,
  CloseButton,
  Button,
  HStack,
  Skeleton,
  Icon,
  Text,
  Center,
  Spinner,
  Link,
  useClipboard,
  useBoolean,
  SimpleGrid,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';

import { 
  ValidatorSessionKey, 
  Validator, 
  ValidatorProfile as ValidatorPrifleType, 
  AnchorContract,
  Delegator
} from 'types';

import { CheckIcon, CopyIcon } from '@chakra-ui/icons';
import { BiDoorOpen, BiLogOut } from 'react-icons/bi';
import { Empty, Alert } from 'components';
import { AiOutlineTwitter, AiOutlineCloseCircle } from 'react-icons/ai';
import { MdEmail } from 'react-icons/md';
import { StateBadge } from 'components';
import { encodeAddress } from '@polkadot/util-crypto';
import Identicon from '@polkadot/react-identicon';

import { DelegatorsTable } from './DelegatorsTable';
import { useGlobalStore } from 'stores';
import { COMPLEX_CALL_GAS, FAILED_TO_REDIRECT_MESSAGE } from 'primitives';

type ValidatorProfileProps = {
  appchainId: string;
  anchor: AnchorContract | undefined;
  validatorId: string;
  appchainValidators: string[] | undefined;
  lastEra: string | undefined;
  validators: Validator[] | undefined;
  validatorSessionKeys: Record<string, ValidatorSessionKey> | undefined;
  onDrawerClose: () => void;
}

export const ValidatorProfile: React.FC<ValidatorProfileProps> = ({ 
  appchainId, 
  validatorId,
  anchor,
  validators,
  appchainValidators,
  validatorSessionKeys,
  lastEra,
  onDrawerClose,
}) => {

  const validator = useMemo(() => validators?.find(v => v.validator_id === validatorId), [validators, validatorId]);

  const bg = useColorModeValue('#f6f7fa', '#15172c');
  const [validatorProfile, setValidatorProfile] = useState<ValidatorPrifleType>();

  const [isTogglingDelegation, setIsTogglingDelegation] = useBoolean();

  const [unbondAlertOpen, setUnbondAlertOpen] = useBoolean();
  const [isUnbonding, setIsUnbonding] = useBoolean();

  const { global } = useGlobalStore();
  const toast = useToast();

  const { data: delegators } = useSWR<Delegator[]>(
    appchainId && validatorId && lastEra ? `${validatorId}/${appchainId}/delegators/${lastEra}` : null
  );

  useEffect(() => {
    if (!validator || !lastEra || !anchor) {
      return;
    }

    anchor.get_validator_profile({ validator_id: validator.validator_id }).then((profile) => {
      setValidatorProfile(profile);
    });
    
  }, [validator, lastEra]);

  const ss58Address = useMemo(() => {

    let address = 'loading';
    if (!validator) {
      return address;
    }
    
    try {
      address = encodeAddress(validator.validator_id_in_appchain);
    } catch(err) {}

    return address;
  }, [validator]);

  const { hasCopied: hasSS58AddressCopied, onCopy: onSS58AddressCopy } = useClipboard(ss58Address);

  const isMyself = useMemo(() => global && validator &&
    (global.accountId === validator.validator_id), [global, validator]);

  const validatorState = useMemo(() => {
    if (!validator || !appchainValidators || !validatorSessionKeys || !ss58Address) {
      return 'Unknown';
    }

    const sessionKey = validatorSessionKeys[validator.validator_id];
    if (validator?.is_unbonding) {
      return 'Unbonding';
    } else if (appchainValidators.some(s => s === ss58Address) && sessionKey) {
      return 'Validating';
    } else if (appchainValidators.some(s => s === ss58Address) && !sessionKey) {
      return 'Need Keys';
    } else if (!appchainValidators.some(s => s === ss58Address) && !sessionKey) {
      return 'Registered';
    }

    return 'Unknown';

  }, [validator, appchainValidators, validatorSessionKeys, ss58Address]);

  const toggleDelegation = () => {
    const method = validator?.can_be_delegated_to ? anchor?.disable_delegation :
      anchor?.enable_delegation;

    setIsTogglingDelegation.on();

    method?.({}, COMPLEX_CALL_GAS).catch((err: any) => {
      if (err.message === FAILED_TO_REDIRECT_MESSAGE) {
        return;
      }
      toast({
        position: 'top-right',
        title: 'Error',
        description: err.toString(),
        status: 'error'
      });
      setIsTogglingDelegation.off();
    });
  }

  const onUnbondValidator = () => {
    setIsUnbonding.on();
    anchor?.unbond_stake({}, COMPLEX_CALL_GAS)
      .catch(err => {
        toast({
          position: 'top-right',
          title: 'Error',
          description: err.toString(),
          status: 'error'
        });
        setIsUnbonding.off();
      });
  }

  return (
    <>
      <DrawerHeader borderBottomWidth="0">
        <Flex justifyContent="space-between" alignItems="center">
          <Heading fontSize="lg">Validator Profile</Heading>
          <CloseButton onClick={onDrawerClose} />
        </Flex>
      </DrawerHeader>
      <DrawerBody>
        <Box p={4} bg={bg} borderRadius="lg">
          
          <Flex justifyContent="space-between" alignItems="center">
            <HStack maxW="calc(100% - 120px)">
              <Identicon size={32} value={ss58Address} />
              <Heading 
                whiteSpace="nowrap"
                overflow="hidden"
                textOverflow="ellipsis"
                w="100%"
                fontSize="lg">{validatorId}@{appchainId}</Heading>
            </HStack>
            <Skeleton isLoaded={validatorState !== 'Unknown'}>
              <StateBadge state={validatorState} />
            </Skeleton>
          </Flex>
          <HStack w="100%" mt={3} className="octo-gray" spacing={5}>
            <Skeleton isLoaded={!(ss58Address === 'loading')}>
              <Button variant="link" onClick={onSS58AddressCopy} size="sm">
                { hasSS58AddressCopied ? <CheckIcon /> : <CopyIcon /> }
                <Text ml={2}>SS58 Address</Text>
              </Button>
            </Skeleton>
            {
              validatorProfile?.profile?.email &&
              <Link href={`mailto:${validatorProfile?.profile?.email}`}>
                <HStack>
                  <Icon as={MdEmail} boxSize={5} />
                  <Text>Email</Text>
                </HStack>
              </Link>
            }
            
            {
              validatorProfile?.profile?.socialMediaHandle &&
              <Link href={`https://www.twitter.com/${validatorProfile?.profile?.socialMediaHandle}`}>
                <HStack>
                  <Icon as={AiOutlineTwitter} boxSize={5} />
                  <Text>Twitter</Text>
                </HStack>
              </Link>
            }
            
          </HStack>
        </Box>
        <Box mt={4}>
          {
            isMyself && !validator?.is_unbonding ?
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              <Button colorScheme={validator?.can_be_delegated_to ? 'gray' : 'octo-blue'} onClick={toggleDelegation} 
                isLoading={isTogglingDelegation} isDisabled={isTogglingDelegation}>
                <Icon as={ validator?.can_be_delegated_to ? AiOutlineCloseCircle : BiDoorOpen } mr={2} /> 
                { validator?.can_be_delegated_to ? 'Close Delegation' : 'Open Delegation' }
              </Button>
              <Button colorScheme="red" onClick={setUnbondAlertOpen.on}>
                <Icon as={BiLogOut} mr={2} /> Unbond Validator
              </Button>
            </SimpleGrid> : null
          }
        </Box>
        <Heading fontSize="xl" mt={6}>Delegators</Heading>
        <Box mt={4}>
          {
            !delegators ?
            <Center minH="160px">
              <Spinner size="md" thickness="4px" speed="1s" color="octo-blue.500" />
            </Center>  :
            !delegators.length ?
            <Empty message="No Delegators" /> :
            <DelegatorsTable delegators={delegators} />
          }
        </Box>
      </DrawerBody>
      <Alert 
        isOpen={unbondAlertOpen} 
        onClose={setUnbondAlertOpen.off} 
        title="Unbond Validator"
        confirmButtonText="Unbond"
        isConfirming={isUnbonding}
        message="Your unbonded stakes will be claimable after 28 days. Are you confirm to unbond?"
        onConfirm={onUnbondValidator}
        confirmButtonColor="red" />
    </>
  )
}