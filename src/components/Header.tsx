import React from 'react';

import {
  Container,
  Flex,
  Image,
  HStack,
  Heading,
  Button,
  Icon,
  Link,
  Text,
  useBoolean
} from '@chakra-ui/react';

import { 
  ColorModeSwitcher
} from 'components';

import { AiOutlineUser } from 'react-icons/ai';

import { Link as RouterLink, useLocation } from 'react-router-dom';
import logo from 'assets/logo.png';
import { useGlobalStore } from 'stores';

import { REGISTRY_CONTRACT_ID } from 'config';

type NavLinkProps = {
  path: string;
  label: string;
}

const NavLink: React.FC<NavLinkProps> = ({ path, label }) => {
  const location = useLocation();
  const locationPath = location.pathname;

  return (
    <Link 
      as={RouterLink} 
      to={path} 
      aria-selected={locationPath === path}>
      <Heading fontSize="sm" fontWeight={600}>{label}</Heading>
    </Link>
  );
} 

export const Header: React.FC = () => {

  const { global } = useGlobalStore();
  const [isLoging, setIsLoging] = useBoolean();

  const onLogin = (e: any) => {
    setIsLoging.on();
    global.wallet?.requestSignIn(REGISTRY_CONTRACT_ID, 'Octopus Webapp');
  }

  return (
    <Container pt={4} pb={4}>
      <Flex justifyContent="space-between" alignItems="center">
        <RouterLink to="/">
          <Image src={logo} w="90px" />
        </RouterLink>
        <HStack spacing={6}>
          <HStack spacing={8} display={{ base: 'none', md: 'flex' }}>
            <NavLink path="/home" label="Home" />
            <NavLink path="/appchains" label="Appchains" />
            <NavLink path="/bridge" label="Bridge" />
            <Link href="https://docs.oct.network/" isExternal>
              <Heading fontSize="sm" fontWeight={600}>Docs</Heading>
            </Link>
            <ColorModeSwitcher />
          </HStack>
          {
            global.accountId ?
            <Button variant="octo-linear-outline">
              <Text maxW="100px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                { global.accountId }
              </Text>
            </Button> :
            <Button variant="octo-linear" onClick={onLogin} 
              isLoading={isLoging} isDisabled={isLoging}>
              <Icon as={AiOutlineUser} boxSize={5} mr={2} /> Login
            </Button>
          }
        </HStack>
      </Flex>
    </Container>
  );
}