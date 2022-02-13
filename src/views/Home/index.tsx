import React from 'react';

import {
  Box,
  Image,
  Container
} from '@chakra-ui/react';

import { Hero } from './Hero';
import { Overview } from './Overview';

import { 
  JoinBanner, 
  RunningAppchains 
} from 'components';

export const Home: React.FC = () => {
  return (
    <>
      <Box mt="-80px">
        <Hero />
      </Box>
      <Box mt="-180px" position="relative" zIndex={1}>
        <Overview />
      </Box>
      <Box mt={16}>
        <Container>
          <RunningAppchains />
        </Container>
      </Box>
      <Box mt={16} display={{ base: 'none', md: 'block' }}>
        <Container>
          <JoinBanner />
        </Container>
      </Box>
    </>
  );
}