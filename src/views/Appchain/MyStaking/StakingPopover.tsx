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

import { AnchorContract } from 'types';

import {
  COMPLEX_CALL_GAS,
  OCT_TOKEN_DECIMALS,
  FAILED_TO_REDIRECT_MESSAGE
} from 'primitives';

import { useGlobalStore } from 'stores';

import { AmountInput } from 'components';
import { DecimalUtil, ZERO_DECIMAL } from 'utils';

type StakingPopoverProps = {
  type: 'increase' | 'decrease';
  anchor: AnchorContract | undefined;
  helper?: string;
  trigger: any;
}

export const StakingPopover: React.FC<StakingPopoverProps> = ({ trigger, type, helper, anchor }) => {
  const initialFocusRef = React.useRef<any>();

  const inputRef = React.useRef<any>();
  const [amount, setAmount] = useState('');

  const [isSubmiting, setIsSubmiting] = useBoolean(false);

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
    setIsSubmiting.on();

    const amountStr = DecimalUtil.toU64(amountInDecimal, OCT_TOKEN_DECIMALS).toString();

    try {
      if (type === 'increase') {
        await global.octToken?.ft_transfer_call(
          {
            receiver_id: anchor?.contractId || '',
            amount: amountStr,
            msg: '"IncreaseStake"'
          },
          COMPLEX_CALL_GAS,
          1,
        );
      } else {
        await anchor?.decrease_stake(
          { amount: DecimalUtil.toU64(amountInDecimal, OCT_TOKEN_DECIMALS).toString() },
          COMPLEX_CALL_GAS
        );
      }

    } catch (err: any) {

      if (err.message === FAILED_TO_REDIRECT_MESSAGE) {
        return;
      }

      toast({
        position: 'top-right',
        title: 'Error',
        description: err.toString(),
        status: 'error'
      });

    }

    setIsSubmiting.off();
  }

  return (
    <Popover placement="bottom" initialFocusRef={initialFocusRef} onOpen={onOpen}>
      <PopoverTrigger>
        {trigger}
      </PopoverTrigger>
      <PopoverContent w="360px">
        <PopoverBody p={4}>
          <Heading fontSize="md">{type === 'increase' ? 'Increase Stake' : 'Decrease Stake'}</Heading>
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
                isSubmiting ||
                amountInDecimal.lte(ZERO_DECIMAL) ||
                amountInDecimal.gt(octBalance)
              }
              onClick={onSubmit}
              isLoading={isSubmiting}
              isFullWidth>
              {
                amountInDecimal.lte(ZERO_DECIMAL) ?
                  'Input Amount' :
                  amountInDecimal.gt(octBalance) ?
                    'Insufficient Balance' :
                    type === 'increase' ? 'Increase' : 'Decrease'
              }
            </Button>
          </Box>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}