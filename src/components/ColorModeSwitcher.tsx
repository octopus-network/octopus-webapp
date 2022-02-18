import React from 'react';

import {
  useColorMode,
  useColorModeValue,
  HStack,
  Box
} from '@chakra-ui/react';

import { FaMoon, FaSun } from 'react-icons/fa'

export const ColorModeSwitcher: React.FC = () => {

  const { setColorMode, colorMode } = useColorMode();
  const bg = useColorModeValue('gray.200', 'whiteAlpha.200');

  return (
    <Box bg={bg} p="4px" borderRadius="lg">
      <HStack spacing={0}>
        <Box 
          p="8px 12px"
          borderRadius="lg"
          cursor="pointer"
          bg={colorMode === 'light' ? 'white' : 'transparent'}
          onClick={() => setColorMode('light')}>
          <FaSun />
        </Box>
        <Box 
          p="8px 12px"
          borderRadius="lg"
          cursor="pointer"
          bg={colorMode === 'dark' ? 'white' : 'transparent'}
          color="black"
          onClick={() => setColorMode('dark')}>
          <FaMoon />
        </Box>
      </HStack>
    </Box>
  );
}
