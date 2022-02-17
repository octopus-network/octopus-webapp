import React, { useState, useMemo, useEffect } from 'react';
import useSWR from 'swr';

import {
  List,
  FormControl,
  Flex,
  Link,
  FormLabel,
  Input,
  HStack,
  Text,
  Switch,
  FormHelperText,
  Button,
  useToast,
  Box,
  useBoolean
} from '@chakra-ui/react';

import { 
  OCT_TOKEN_DECIMALS, 
  COMPLEX_CALL_GAS, 
  FAILED_TO_REDIRECT_MESSAGE 
} from 'config';

import { decodeAddress } from '@polkadot/util-crypto';
import { u8aToHex, isHex } from '@polkadot/util';
import { BaseModal } from 'components';
import { useGlobalStore } from 'stores';
import { AnchorContract, AppchainInfoWithAnchorStatus } from 'types';
import { DecimalUtil, ZERO_DECIMAL } from 'utils';

type RegisterValidatorModalProps = {
  appchain: AppchainInfoWithAnchorStatus | undefined;
  anchor: AnchorContract | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RegisterValidatorModal: React.FC<RegisterValidatorModalProps> = ({ isOpen, onClose, anchor }) => {

  const [amount, setAmount] = useState('');
  const [appchainAccount, setAppchainAccount] = useState('');

  const { global } = useGlobalStore();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [socialMediaHandle, setSocialMediaHandle] = useState('');
  const [canBeDelegatedTo, setCanBeDelegatedTo] = useState(false);

  const [minimumDeposit, setMinimumDeposit] = useState(ZERO_DECIMAL);

  const [isSubmitting, setIsSubmitting] = useBoolean();
  const { data: balances } = useSWR(global.accountId ? `balances/${global.accountId}` : null);
  
  const amountInDecimal = useMemo(() => DecimalUtil.fromString(amount), [amount]);
  const octBalance = useMemo(() => DecimalUtil.fromString(balances?.['OCT']), [balances]);

  useEffect(() => {
    anchor?.get_protocol_settings().then(settings => {
      const minimumDepositInDecimal = DecimalUtil.fromString(settings.minimum_validator_deposit, OCT_TOKEN_DECIMALS);
      setMinimumDeposit(minimumDepositInDecimal);
      setAmount(minimumDepositInDecimal.toString());
    });
  }, [anchor]);

  const onSubmit = () => {
    let hexId = '';
    try {
      if (isHex(appchainAccount)) {
        throw new Error('Invalid appchain account');
      }
      const u8a = decodeAddress(appchainAccount);
      hexId = u8aToHex(u8a);
    } catch(err) {

      toast({
        position: 'top-right',
        title: 'Error',
        description: 'Invalid SS58 address',
        status: 'error'
      });
      return;
    }

    setIsSubmitting.on();

    global.octToken?.ft_transfer_call(
      {
        receiver_id: anchor?.contractId || '',
        amount: DecimalUtil.toU64(amountInDecimal, OCT_TOKEN_DECIMALS).toString(),
        msg: JSON.stringify({
          RegisterValidator: {
            validator_id_in_appchain: hexId,
            can_be_delegated_to: canBeDelegatedTo,
            profile: {
              socialMediaHandle: socialMediaHandle || '',
              email
            }
          }
        })
      },
      COMPLEX_CALL_GAS,
      1
    ).catch(err => {
      if (err.message === FAILED_TO_REDIRECT_MESSAGE) {
        return;
      }

      toast({
        position: 'top-right',
        title: 'Error',
        description: err.toString(),
        status: 'error'
      });

      setIsSubmitting.off();
    });
  }

  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Register Validator">
      <List spacing={4}>
        <FormControl isRequired>
          <Flex alignItems="center" justifyContent="space-between">
            <FormLabel htmlFor="appchainAccount">Apchain Account</FormLabel>
            <Link
              isExternal 
              variant="gray-hover-blue" 
              href="https://docs.oct.network/maintain/validator-generate-keys.html#generate-validator-account">
              Docs
            </Link>
          </Flex>
          <Input 
            autoFocus
            id="appchainAccount" 
            placeholder="appchain SS58 address, eg: 5CaLqqE3..." 
            onChange={e => setAppchainAccount(e.target.value)} />
        </FormControl>

        <FormControl isRequired>
          <FormLabel htmlFor="amount">Deposit Amount</FormLabel>
          <Input id="amount" placeholder="Deposit amount" onChange={e => setAmount(e.target.value)} 
              defaultValue={amount} type="number" />
          <FormHelperText>
            Minimum deposit: { DecimalUtil.beautify(minimumDeposit) } OCT
          </FormHelperText>
        </FormControl>

        <FormControl isRequired>
          <FormLabel htmlFor="email">Email</FormLabel>
          <Input id="email" placeholder="Contact email" onChange={(e) => setEmail(e.target.value)} type="text" />
        </FormControl>

        <FormControl>
          <FormLabel htmlFor="socialLink">Twitter Id</FormLabel>
          <Input id="socialMediaHandle" placeholder="Your twitter id" 
            onChange={(e) => setSocialMediaHandle(e.target.value)} type="text" />
        </FormControl>

        <HStack>
          <Text>Can be delegated to?</Text>
          <Switch onChange={e => setCanBeDelegatedTo(e.target.checked)} size="lg" defaultChecked={canBeDelegatedTo} />
        </HStack>
      </List>
      <Box mt={8}>
        <Button 
          isFullWidth 
          colorScheme="octo-blue" 
          type="submit" 
          isLoading={isSubmitting} 
          onClick={onSubmit}
          disabled={
            !appchainAccount || amountInDecimal.lt(minimumDeposit) || amountInDecimal.gt(octBalance) || 
            isSubmitting || !email
          }>
            {
              !appchainAccount ?
              'Input Account' :
              (
                amountInDecimal.lt(minimumDeposit) ? 'Minimum Limit' :
                amountInDecimal.gt(octBalance) ? 'Insufficient Balance' :
                'Register'
              )
              
            }
        </Button>
      </Box>
    </BaseModal>
  );

}