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
} from 'react-spring';

import dotIcon from 'assets/icons/dot.png';
import dotIcon2 from 'assets/icons/dot2.png';

import squareIcon from 'assets/icons/square.png';
import squareIcon2 from 'assets/icons/square2.png';

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
      totalAppchainsIconHoveringApi.start({ transform: 'translate3d(3px, 3px, 0)' });
    } else {
      totalAppchainsHoveringApi.start({ transform: 'translateX(-10px)', opacity: 0 });
      totalAppchainsIconHoveringApi.start({ transform: 'translate3d(0px, 0px, 0px)' });
    }

    if (isTotalAnnualizedFeeHovering) {
      iconHoveringApi.start({ transform: 'translate3d(3px, 3px, 0)' });
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
                  <Box boxSize={10} position="relative">
                    <Box boxSize={6} position="absolute" top="-3px" left="-5px" zIndex={0}>
                      <Image src={dotIcon} w="100%" h="100%" />
                    </Box>
                    <animated.div style={totalAppchainsIconHoveringProps}>
                      <Image src={dotIcon2} w="100%" h="100%" />
                    </animated.div>
                  </Box>
                  <Box ml={5} flex={1}>
                    <Skeleton isLoaded={!!data}>
                      <Heading fontSize="2xl">{data?.appchainsCount || 'loading'}</Heading>
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
                  <Box boxSize={10} position="relative">
                    <Box boxSize={6} position="absolute" top="-3px" left="-5px" zIndex={0}>
                      <Image src={squareIcon} w="100%" h="100%" />
                    </Box>
                    <animated.div style={iconHoveringProps}>
                      <Image src={squareIcon2} w="100%" h="100%" />
                    </animated.div>
                  </Box>
                  <Box ml={5}>
                    <Skeleton isLoaded={!!data}>
                      <Heading fontSize="2xl">
                        {
                          data ? 
                          '$' + DecimalUtil.beautify(
                            DecimalUtil.fromString(data.totalAnnualizedFee)
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
            <Chart data={data?.totalStaked} />
          </Card>
        </GridItem>
      </Grid>
    </Container>
  );
}