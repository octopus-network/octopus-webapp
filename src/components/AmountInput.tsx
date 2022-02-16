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
  refObj?: React.MutableRefObject<any>;
}

export const AmountInput: React.FC<AmountInputPropos> = ({ onChange, refObj, value, ...props }) => {
  const gray = useColorModeValue('#929AA6', '#A6A0BB');
  const bg = useColorModeValue('blackAlpha.100', 'whiteAlpha.100');

  const _onChange = (e: React.BaseSyntheticEvent) => {
    const targetValue = e.target.value.replaceAll(',', '');
    if (
      (targetValue !== '' && !isNumber(targetValue)) ||
      targetValue * 1 > 1_000_000_000_000
    ) {
      e.target.value = value;
      return;
    }

    onChange && onChange(targetValue);
  }

  const beautifyValue = useMemo(() => beautify(value), [value]);

  return (
    <Box p={2} bg={bg} borderRadius="lg">
      <Input
        {...props}
        fontWeight={600}
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