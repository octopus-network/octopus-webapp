import React from 'react';
import styled from 'styled-components';

import {
  Box,
  Heading,
  Text,
  Icon,
  Container,
  Image,
  Flex,
  Button,
  useColorModeValue
} from '@chakra-ui/react';

import {
  useSpring,
  animated,
  config
} from 'react-spring';

import { HiOutlineArrowNarrowRight } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

import heroBg from 'assets/hero-bg.png';
import heroBgDark from 'assets/hero-bg-dark.png';

import slot from 'assets/web3-slot.png';
import slotDark from 'assets/web3-slot-dark.png';

import box from 'assets/web3-box.png';

const JoinButton = styled(Button)`
  svg {
    transition: .6s ease;
    transform: translateX(0px);
  }
  &:hover {
    svg {
      transform: translateX(5px);
    }
  }
`;

export const Hero: React.FC = () => {

  const navigate = useNavigate();

  const titleProps = useSpring({
    from: { opacity: 0, transform: 'translateY(-20px)' },
    opacity: 1,
    config: config.molasses,
    transform: 'translateY(0)'
  });

  const descriptionProps = useSpring({
    from: { opacity: 0, transform: 'translateY(-20px)' },
    opacity: 1,
    config: config.molasses,
    transform: 'translateY(0)'
  });

  const buttonProps = useSpring({
    from: { opacity: 0, transform: 'translateX(-10px)' },
    opacity: 1,
    config: config.molasses,
    transform: 'translateX(0)'
  });

  const slotProps = useSpring({
    from: { opacity: 0, transform: 'translateY(10px)' },
    delay: 100,
    config: config.molasses,
    transform: 'translateY(0)',
    opacity: 1
  });

  const boxProps = useSpring({
    from: { opacity: 0 },
    delay: 250,
    config: config.molasses,
    opacity: 1
  });

  const heroBgInColorMode = useColorModeValue(heroBg, heroBgDark);
  const slotBgInColorMode = useColorModeValue(slot, slotDark);
  const bgGradient = useColorModeValue(
    'linear(to right, #eff5fd 50%, #e5edf9 50%)', 
    'linear(to right, #0b0c21 50%, #0b0c21 50%)'
  );

  return (
    <Box 
      bgGradient={bgGradient}
      pt="80px"
      pb="220px"
      position="relative"
      overflow="hidden">
      <Box 
        position="absolute" 
        left="0"
        top="0"
        w="100%"
        h="100%"
        bgImage={heroBgInColorMode}
        backgroundSize="auto 100%"
        bgRepeat="no-repeat"
        backgroundPosition="bottom center"
      />
      <Container>
        <Flex 
          alignItems="center"
          justifyContent={{ base: 'center', md: 'space-between' }}>
          <Flex 
            mt="40px" 
            maxW="520px"
            alignItems={{ base: 'center', md: 'flex-start' }} 
            flexDirection="column">
            <Box>
              <animated.div style={titleProps}>
                <Heading fontSize={['30px', '38px']}>Where Web3.0 Happens</Heading>
              </animated.div>
            </Box>
            <Box mt={4}>
              <animated.div style={descriptionProps}>
                <Text variant="gray" fontSize="xl" textAlign={{ base: 'center', md: 'left' }}>
                  A cryptonetwork for launching and running Web3.0 Appchains
                </Text>
              </animated.div>
            </Box>
            <Box mt={{ base: 10, md: 16 }}>
              <animated.div style={buttonProps}>
                <JoinButton size="lg" className="octo-linear-button" onClick={() => navigate('/register')}>
                  <Text>Join Octopus</Text>
                  <Icon as={HiOutlineArrowNarrowRight} ml={2} />
                </JoinButton>
              </animated.div>
            </Box>
          </Flex>
          <Box display={{ base: 'none', md: 'flex' }} mt="120px">
            <Box position="relative" minH="323px">
              <animated.div style={slotProps}>
                <Image src={slotBgInColorMode} w="580px" />
              </animated.div>
              <animated.div style={boxProps}>
                <Box position="absolute" top="-15%" left="50%" transform="translateX(-50%)">
                  <Image src={box} w="300px" />
                </Box>
              </animated.div>
            </Box>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}