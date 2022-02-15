import React, { useEffect } from 'react';
import useSWR from 'swr';

import { 
  Container,
  Grid,
  BoxProps,
  GridItem,
  Image,
  Flex,
  Text,
  Skeleton,
  Heading,
  useColorModeValue,
  Box,
  Icon,
  useBoolean
} from '@chakra-ui/react';

import {
  useSpring,
  animated,
  config,
} from 'react-spring';

import totalAppchainsIcon from 'assets/icons/total-appchains.png';
import totalAnnualizedFeeIcon from 'assets/icons/total-annualized-fee.png';
import { HiOutlineArrowNarrowRight } from 'react-icons/hi';
import { Chart } from './Chart';
import { DecimalUtil } from 'utils';
import { useNavigate } from 'react-router-dom';

const Card: React.FC<BoxProps & {
  to?: string
}> = ({ children, to, ...restProps }) => {
 
  const bg = useColorModeValue('white', '#25263c');
  const navigate = useNavigate();

  const innerBg = useColorModeValue(
    'linear-gradient(180deg, #f4f5fb, #ffffff)', 
    'linear-gradient(180deg, #0f1025 0%, #25263c)'
  );

  return (
    <Box 
      p="1px"
      bg={bg}
      borderRadius="lg"
      boxShadow="0px 0px 30px 0px rgba(0,29,97,0.10)"
      {...restProps}
      onClick={() => to ? navigate(to) : null}>
      <Box
        p={6}
        borderRadius="lg"
        bg={innerBg}
        transition="all .3s ease"
        _hover={to ? { cursor: 'pointer', filter: 'brightness(110%)' } : {}}>
        {children}
      </Box>
    </Box>
  );
}

export const Overview: React.FC = () => {
  const { data } = useSWR('overview');
  const [isTotalAppchainsHovering, setIsTotalAppchainsHovering] = useBoolean(false);
  const [isTotalAnnualizedFeeHovering, setIsTotalAnnualizedFeeHovering] = useBoolean(false);

  const [totalAppchainsHoveringProps, totalAppchainsHoveringApi] = useSpring(() => ({
    transform: 'translateX(-10px)',
    opacity: 0
  }));

  const [totalAppchainsIconHoveringProps, totalAppchainsIconHoveringApi] = useSpring(() => ({
    transform: 'translate3d(0, 0, 0)'
  }));

  const [iconHoveringProps, iconHoveringApi] = useSpring(() => ({
    transform: 'translate3d(0, 0, 0)'
  }));

  useEffect(() => {
    if (isTotalAppchainsHovering) {
      totalAppchainsHoveringApi.start({ transform: 'translateX(0px)', opacity: 1 });
      totalAppchainsIconHoveringApi.start({ transform: 'translate3d(5px, 5px, 0)' });
    } else {
      totalAppchainsHoveringApi.start({ transform: 'translateX(-10px)', opacity: 0 });
      totalAppchainsIconHoveringApi.start({ transform: 'translate3d(0px, 0px, 0px)' });
    }

    if (isTotalAnnualizedFeeHovering) {
      iconHoveringApi.start({ transform: 'translate3d(5px, 5px, 0)' });
    } else {
      iconHoveringApi.start({ transform: 'translate3d(0px, 0px, 0px)' });
    }
  }, [isTotalAppchainsHovering, isTotalAnnualizedFeeHovering]);

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
              <Card 
                to="/appchains"
                onMouseEnter={setIsTotalAppchainsHovering.on} 
                onMouseLeave={setIsTotalAppchainsHovering.off}>
                <Flex 
                  alignItems="center">
                  <Box boxSize={12}>
                    <animated.div style={totalAppchainsIconHoveringProps}>
                      <Image src={totalAppchainsIcon} w="100%" h="100%" />
                    </animated.div>
                  </Box>
                  <Box ml={5} flex={1}>
                    <Skeleton isLoaded={!!data}>
                      <Heading fontSize="2xl">{data?.totalAppchains || 'loading'}</Heading>
                    </Skeleton>
                    <Flex alignItems="center" mt={2}
                      justifyContent="space-between" position="relative">
                      <Text variant="gray">Total Appchains</Text>
                      <animated.div style={totalAppchainsHoveringProps} className="octo-blue">
                        <Icon as={HiOutlineArrowNarrowRight} />
                      </animated.div>
                    </Flex>
                  </Box>
                </Flex>
              </Card>
            </GridItem>
            <GridItem colSpan={1}>
              <Card
                onMouseEnter={setIsTotalAnnualizedFeeHovering.on} 
                onMouseLeave={setIsTotalAnnualizedFeeHovering.off}>
                <Flex 
                  alignItems="center">
                  <Box boxSize={12}>
                    <animated.div style={iconHoveringProps}>
                      <Image src={totalAnnualizedFeeIcon} w="100%" h="100%" />
                    </animated.div>
                  </Box>
                  <Box ml={5}>
                    <Skeleton isLoaded={!!data}>
                      <Heading fontSize="2xl">
                        {
                          data?.totalAnnualizedFee ? 
                          '$' + DecimalUtil.beautify(
                            DecimalUtil.fromString(data?.totalAnnualizedFee)
                          ) : 'loading' 
                        }
                      </Heading>
                    </Skeleton>
                    <Text variant="gray" mt={2}>Total Annualized Fee</Text>
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