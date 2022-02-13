import React from 'react';
import styled from 'styled-components';

import {
  Box,
  Image,
  HStack,
  VStack,
  Heading,
  Text,
  Flex,
  Icon,
  Button
} from '@chakra-ui/react';

import {
  useSpring,
  animated,
  config
} from 'react-spring';

import { HiOutlineArrowNarrowRight } from 'react-icons/hi';
import joinBannerIcon from 'assets/icons/join-banner.png';
import joinBannerBg from 'assets/join-banner-bg.png';

const JoinButton = styled(Button)`
  background: #fff;
  color: #2468f2;
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

export const JoinBanner: React.FC = () => {

  const iconProps = useSpring({
    from: { opacity: 0, transform: 'translateX(-8px)' },
    config: config.molasses,
    opacity: 1,
    transform: 'translateX(0)'
  });

  const titleProps = useSpring({
    from: { opacity: 0, transform: 'translateY(-6px)' },
    opacity: 1,
    config: config.molasses,
    transform: 'translateY(0)'
  });

  const descriptionProps = useSpring({
    from: { opacity: 0, transform: 'translateY(6px)' },
    opacity: 1,
    config: config.molasses,
    transform: 'translateY(0)'
  });

  const buttonProps = useSpring({
    from: { opacity: 0, transform: 'translateX(-8px)' },
    config: config.molasses,
    opacity: 1,
    transform: 'translateX(0)'
  });

  return (
    <Box 
      borderRadius="lg" 
      bgColor="#1486ff" 
      p={4}
      bgImage={joinBannerBg}
      bgRepeat="no-repeat"
      bgSize="auto 100%"
      bgPosition="bottom right">
      <Flex alignItems="center" justifyContent="space-between" pl={2} pr={2}>
        <HStack>
          <Box w="128px" h="102px">
            <animated.div style={iconProps}>
              <Image src={joinBannerIcon} w="100%" />
            </animated.div>
          </Box>
          <VStack alignItems="flex-start">
            <animated.div style={titleProps}>
              <Heading fontSize="3xl" color="white">Where Web3.0 Happens</Heading>
            </animated.div>
            <animated.div style={descriptionProps}>
              <Text fontSize="sm" color="white">A cryptonetwork for launching and running Web3.0 Appchains</Text>
            </animated.div>
          </VStack>
        </HStack>
        <animated.div style={buttonProps}>
          <JoinButton>
            <Text>Join Octopus</Text>
            <Icon as={HiOutlineArrowNarrowRight} ml={2} />
          </JoinButton>
        </animated.div>
      </Flex>
    </Box>
  );
}