import React from 'react';

import { 
  Container,
  Grid,
  GridItem,
  Image,
  Flex,
  Text,
  HStack,
  Heading,
  Button,
  useColorModeValue,
  Box
} from '@chakra-ui/react';

import totalAppchainsIcon from 'assets/icons/total-appchains.png';
import totalAnnualizedFeeIcon from 'assets/icons/total-annualized-fee.png';
import { Chart } from './Chart';

const Card: React.FC = ({ children }) => {
 
  const bg = useColorModeValue('white', '#25263c');

  const bgGradient = useColorModeValue(
    'linear(180deg, #f4f5fb, #ffffff)', 
    'linear(180deg, #0f1025 0%, #25263c)'
  );

  return (
    <Box 
      p="1px"
      bg={bg}
      borderRadius="lg"
      boxShadow="0px 0px 30px 0px rgba(0,29,97,0.10)">
      <Box
        p={6}
        borderRadius="lg"
        bgGradient={bgGradient}>
        {children}
      </Box>
    </Box>
  );
}

export const Overview: React.FC = () => {
  return (
    <Container>
      <Grid 
        templateColumns={{ base: 'repeat(3, 1fr)', md: 'repeat(9, 1fr)' }}
        gap={6}>
        <GridItem colSpan={3}>
          <Grid
            templateColumns="repeat(1, 1fr)" 
            gap={6}>
            <GridItem colSpan={1}>
              <Card>
                <Flex 
                  alignItems="center" 
                  justifyContent={{ base: 'space-between', md: 'flex-start' }}>
                  <Box boxSize={12}>
                    <Image src={totalAppchainsIcon} w="100%" h="100%" />
                  </Box>
                  <Box ml={5} textAlign={{ base: 'right', md: 'left' }}>
                    <Heading fontSize="2xl">480</Heading>
                    <Text variant="gray" mt={3}>Total Appchains</Text>
                  </Box>
                </Flex>
              </Card>
            </GridItem>
            <GridItem colSpan={1}>
              <Card>
                <Flex 
                  alignItems="center"
                  justifyContent={{ base: 'space-between', md: 'flex-start' }}>
                  <Box boxSize={12}>
                    <Image src={totalAnnualizedFeeIcon} w="100%" h="100%" />
                  </Box>
                  <Box ml={5} textAlign={{ base: 'right', md: 'left' }}>
                    <Heading fontSize="2xl">$73,719.20</Heading>
                    <Text variant="gray" mt={3}>Total Annualized Fee</Text>
                  </Box>
                </Flex>
              </Card>
            </GridItem>
          </Grid>
        </GridItem>
        <GridItem colSpan={{ base: 3, md: 6 }}>
          <Card>
            <Chart />
          </Card>
        </GridItem>
      </Grid>
    </Container>
  );
}