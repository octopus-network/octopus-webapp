import React, { useEffect, useMemo } from 'react';
import useSWR from 'swr';

import {
  Heading,
  useColorModeValue,
  Box,
  List,
  HStack,
  Avatar,
  Flex,
  Icon,
  useBoolean,
  Center,
  Spinner
} from '@chakra-ui/react';

import {
  useSpring,
  animated,
} from 'react-spring';

import { AppchainInfoWithAnchorStatus } from 'types';
import { HiOutlineArrowNarrowRight } from 'react-icons/hi';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

type AppchainItemProps = {
  appchain: AppchainInfoWithAnchorStatus;
  isSelected?: boolean;
  isReverse?: boolean;
}

const AppchainItem: React.FC<AppchainItemProps> = ({ appchain, isSelected, isReverse }) => {

  const [isHovering, setIsHovering] = useBoolean(false);
  const navigate = useNavigate();

  const bg = useColorModeValue('#f5f7fa', '#1e1f34');
  const selectedBg = useColorModeValue('#e2f3fe', '#1a2954');

  const [arrowHoveringProps, arrowHoveringApi] = useSpring(() => ({
    transform: 'translateX(-10px)',
    opacity: 0
  }));


  useEffect(() => {
    if (isHovering || isSelected) {
      arrowHoveringApi.start({ transform: 'translateX(0px)', opacity: 1 });
    } else {
      arrowHoveringApi.start({ transform: 'translateX(-10px)', opacity: 0 });
    }

  }, [isHovering, isSelected]);

  return (
    <Box
      bg={isSelected ? selectedBg : bg}
      p={4}
      pr={6}
      borderRadius="lg"
      cursor="pointer"
      onMouseEnter={setIsHovering.on}
      onMouseLeave={setIsHovering.off}
      transition="transform 0.2s ease-in-out 0s, box-shadow 0.2s ease-in-out 0s"
      _hover={{
        transform: !isSelected ? 'scaleX(1.02)' : 'scaleX(1)'
      }}
      onClick={() => navigate(isReverse ? `/bridge/near/${appchain.appchain_id}` : `/bridge/${appchain.appchain_id}/near`)}>
      <Flex justifyContent="space-between" alignItems="center">
        <HStack spacing={4}>
          <Avatar src={appchain.appchain_metadata.fungible_token_metadata.icon as any} name={appchain.appchain_id} boxSize={8} />
          <Heading fontSize="lg">{appchain.appchain_id}</Heading>
        </HStack>
        <animated.div style={arrowHoveringProps} className="octo-blue">
          <Icon as={HiOutlineArrowNarrowRight} boxSize={5} />
        </animated.div>
      </Flex>
    </Box>
  );
}

export const Appchains: React.FC = () => {
  const bg = useColorModeValue('white', '#15172c');

  const { appchainId } = useParams();

  const { data: appchains } = useSWR<AppchainInfoWithAnchorStatus[]>('appchains/running');

  const { pathname } = useLocation();
  const isReverse = useMemo(() => !appchainId || new RegExp(`^/bridge/near/`).test(pathname), [pathname]);

  return (
    <Box bg={bg} p={6} borderRadius="lg">
      <Heading fontSize="xl">Appchains</Heading>
      {
        appchains === undefined ?
          <Center minH="240px">
            <Spinner size="md" thickness="4px" speed="1s" color="octo-blue.500" />
          </Center> :
          <List mt={6} spacing={4} h="425px" overflowY="scroll">
            {
              appchains?.map((appchain, idx) => (
                <AppchainItem appchain={appchain} key={`appchain-${idx}`} isSelected={appchainId === appchain.appchain_id} isReverse={isReverse} />
              ))
            }
          </List>
      }

    </Box>
  );
}