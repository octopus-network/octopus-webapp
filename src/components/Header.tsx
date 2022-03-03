import React from 'react';

import {
  Container,
  Flex,
  Image,
  HStack,
  Heading,
  Link,
  Menu,
  MenuItem,
  MenuList,
  Avatar,
  Box,
  MenuButton,
  MenuGroup,
  MenuDivider,
  useDisclosure
} from '@chakra-ui/react';

import { 
  ColorModeSwitcher,
  LoginButton
} from 'components';

import { 
  AiOutlinePoweroff, 
  AiOutlineDashboard 
} from 'react-icons/ai';

import { Link as RouterLink, useLocation } from 'react-router-dom';
import logo from 'assets/logo.png';
import octoAvatar from 'assets/icons/avatar.png';

import { useGlobalStore } from 'stores';

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
      aria-selected={new RegExp(`^${path}`).test(locationPath)}>
      <Heading fontSize="sm" fontWeight={600}>{label}</Heading>
    </Link>
  );
} 

export const Header: React.FC = () => {

  const { global } = useGlobalStore();

  const { isOpen: isMenuOpen, onOpen: onMenuOpen, onClose: onMenuClose } = useDisclosure();

  const onLogout = () => {
    global.wallet?.signOut();
    window.location.replace(window.location.origin + window.location.pathname);
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
            <Menu isOpen={isMenuOpen} placement="top-end">
              <MenuButton as={Box} onMouseEnter={onMenuOpen} onMouseLeave={onMenuClose}>
                <Avatar boxSize={9} src={octoAvatar} />
              </MenuButton>
              <MenuList onMouseEnter={onMenuOpen} onMouseLeave={onMenuClose} mt={-1}>
                <MenuGroup title={global.accountId}>
                  <RouterLink to="/dashboard">
                    <MenuItem icon={<AiOutlineDashboard />}>Dashboard</MenuItem>
                  </RouterLink>
                </MenuGroup>
                <MenuDivider />
                <MenuItem onClick={onLogout} icon={<AiOutlinePoweroff />}>Logout</MenuItem>
              </MenuList>
            </Menu> :
            <LoginButton />
          }
        </HStack>
      </Flex>
    </Container>
  );
}