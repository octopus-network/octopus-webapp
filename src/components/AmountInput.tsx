import React, { useMemo } from 'react';

import {
  Input,
  InputProps,
  Box,
  useColorModeValue
} from '@chakra-ui/react';

import { isNumber, beautify } from 'utils';

type AmountInputPropos = Omit<InputProps, 'onChange' | 'value' | 'ref'> & {
  onChange?: (value: string) => void;
  value?: string;
  unstyled?: boolean;
  refObj?: React.MutableRefObject<any>;
}

export const AmountInput: React.FC<AmountInputPropos> = ({ onChange, refObj, value, unstyled, ...props }) => {
  const gray = useColorModeValue('#929AA6', '#A6A0BB');
  const bg = useColorModeValue('#f5f7fa', 'whiteAlpha.100');

  const _onChange = (e: React.BaseSyntheticEvent) => {
    const targetValue = e.target.value.replaceAll(',', '');
    if (
      (targetValue !== '' && !isNumber(targetValue))
    ) {
      e.target.value = value;
      return;
    }

    onChange && onChange(targetValue);
  }

  const beautifyValue = useMemo(() => beautify(value, false), [value]);

  return (
    <Box p={ unstyled ? '' : '10px 15px' } bg={ unstyled ? '' : bg } borderRadius="lg" w="100%">
      <Input
        {...props}
        type="text"
        variant="unstyled"
        value={beautifyValue}
        inputMode="decimal"
        onChange={_onChange}
        style={{
          marginTop: 0
        }}
        ref={refObj}
        _placeholder={{
          opacity: .9,
          color: gray
        }}
        borderRadius={0}
      />
    </Box>
  );
}