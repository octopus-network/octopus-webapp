import React, { useState, useMemo } from 'react';
import useSWR from 'swr';

import {
  Box,
  Heading,
  Text,
  Button,
  useBoolean,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  useToast
} from '@chakra-ui/react';

import { AnchorContract, AppchainInfoWithAnchorStatus, Validator } from 'types';

import {
  COMPLEX_CALL_GAS,
  OCT_TOKEN_DECIMALS,
  FAILED_TO_REDIRECT_MESSAGE
} from 'primitives';

import { useGlobalStore } from 'stores';

import { AmountInput } from 'components';
import { DecimalUtil, ZERO_DECIMAL } from 'utils';
import Decimal from 'decimal.js';
import { validateValidatorStake } from 'utils/validate';

type StakingPopoverProps = {
  type: 'increase' | 'decrease';
  deposit?: Decimal;
  anchor?: AnchorContract;
  validatorId?: string;
  helper?: string;
  trigger: any;
  validator?: Validator
  appchain?: AppchainInfoWithAnchorStatus
}

export const StakingPopover: React.FC<StakingPopoverProps> = ({ 
  trigger, 
  type, 
  helper, 
  deposit = ZERO_DECIMAL, 
  anchor, 
  validatorId,
  validator,
  appchain
}) => {
  const initialFocusRef = React.useRef<any>();

  const inputRef = React.useRef<any>();
  const [amount, setAmount] = useState('');

  const [isSubmitting, setIsSubmitting] = useBoolean(false);

  const { global } = useGlobalStore();
  const toast = useToast();

  const { data: balances } = useSWR(global.accountId ? `balances/${global.accountId}` : null);
  const octBalance = useMemo(() => DecimalUtil.fromString(balances?.['OCT']), [balances]);

  const amountInDecimal = useMemo(() => DecimalUtil.fromString(amount), [amount]);

  const onOpen = () => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
  }

  const onSubmit = async () => {
    if (!anchor) {
      return;
    }

    setIsSubmitting.on();

    const amountStr = DecimalUtil.toU64(amountInDecimal, OCT_TOKEN_DECIMALS).toString();

    try {
      if (type === 'increase') {
        await validateValidatorStake(anchor, DecimalUtil.fromString(amountStr), !validatorId ? 'IncreaseStake' : 'IncreaseDelegation', validator, appchain);
        
        await global.octToken?.ft_transfer_call(
          {
            receiver_id: anchor?.contractId || '',
            amount: amountStr,
            msg: !validatorId ? '"IncreaseStake"' : JSON.stringify({
              IncreaseDelegation: {
                validator_id: validatorId || ''
              }
            })
          },
          COMPLEX_CALL_GAS,
          1,
        );
      } else {        
        const method = validatorId ? anchor.decrease_delegation : anchor.decrease_stake;
        const params: any = validatorId ? { amount: amountStr, validator_id: validatorId || '' } : { amount: amountStr };

        await method(params, COMPLEX_CALL_GAS);
      }

    } catch (err: any) {
      
      if (err.message === FAILED_TO_REDIRECT_MESSAGE) {
        setIsSubmitting.off();
        return;
      }

      toast({
        position: 'top-right',
        title: 'Error',
        description: err.toString(),
        status: 'error'
      });

    }

    setIsSubmitting.off();
  }

  return (
    <Popover placement="bottom" initialFocusRef={initialFocusRef} onOpen={onOpen}>
      <PopoverTrigger>
        {trigger}
      </PopoverTrigger>
      <PopoverContent w="360px">
        <PopoverBody p={4}>
          <Heading fontSize="md">{(type === 'increase' ? 'Increase' : 'Decrease') + (validatorId ? ' Delegation' : ' Stake')}</Heading>
          {
            helper ? <Text variant="gray" mt={3}>{helper}</Text> : null
          }
          <Box mt={3}>
            <AmountInput placeholder="Amount of OCT" refObj={inputRef} onChange={v => setAmount(v)} value={amount} />
          </Box>
          <Box mt={3}>
            <Button
              colorScheme="octo-blue"
              isDisabled={
                isSubmitting ||
                amountInDecimal.lte(ZERO_DECIMAL) ||
                (type === 'increase' && amountInDecimal.gt(octBalance)) ||
                (type === 'decrease' && amountInDecimal.gt(deposit))
              }
              onClick={onSubmit}
              isLoading={isSubmitting}
              isFullWidth>
              {
                amountInDecimal.lte(ZERO_DECIMAL) ?
                  'Input Amount' :
                  (
                    (type === 'increase' && amountInDecimal.gt(octBalance)) ||
                    (type === 'decrease' && amountInDecimal.gt(deposit))
                  ) ?
                    `Insufficient ${type === 'increase' ? 'Balance' : 'Deposit'}` :
                    type === 'increase' ? 'Increase' : 'Decrease'
              }
            </Button>
          </Box>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}