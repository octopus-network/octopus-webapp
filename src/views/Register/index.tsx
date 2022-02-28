import React from 'react';

import {
  Container,
  Grid,
  GridItem
} from '@chakra-ui/react';

import { LeftBanner } from './LeftBanner';
import { RegisterForm } from './RegisterForm'; 

export const Register: React.FC = () => {

  return (
    <Container>
      <Grid templateColumns={{ base: 'repeat(6, 1fr)', md: 'repeat(9, 1fr)' }} mt={10} gap={6}>
        <GridItem colSpan={3} display={{ base: 'none', md: 'table-cell' }}>
          <LeftBanner />
        </GridItem>
        <GridItem colSpan={6}>
          <RegisterForm />
        </GridItem>
      </Grid>
    </Container>
  );
}