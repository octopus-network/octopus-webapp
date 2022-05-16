import React from 'react'

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
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody,
  VStack,
} from '@chakra-ui/react'

import { ColorModeSwitcher, LoginButton } from 'components'

import { AiOutlinePoweroff, AiOutlineDashboard } from 'react-icons/ai'

import { Link as RouterLink, useLocation } from 'react-router-dom'
import logo from 'assets/logo.png'
import octoAvatar from 'assets/icons/avatar.png'

import { useGlobalStore } from 'stores'
import { MdMenu } from 'react-icons/md'

type NavLinkProps = {
  path: string
  label: string
  fontSize?: string
  onClick?: () => void
}

const NavLink: React.FC<NavLinkProps> = ({
  path,
  label,
  fontSize = 'sm',
  onClick,
}) => {
  const location = useLocation()
  const locationPath = location.pathname

  return (
    <Link
      as={RouterLink}
      to={path}
      aria-selected={new RegExp(`^${path}`).test(locationPath)}
      onClick={onClick}
    >
      <Heading fontSize={fontSize} fontWeight={600}>
        {label}
      </Heading>
    </Link>
  )
}

export const Header: React.FC = () => {
  const { global } = useGlobalStore()

  const {
    isOpen: isMenuOpen,
    onOpen: onMenuOpen,
    onClose: onMenuClose,
  } = useDisclosure()

  const { isOpen, onOpen, onClose } = useDisclosure()

  const onLogout = () => {
    global.wallet?.signOut()
    window.location.replace(window.location.origin + window.location.pathname)
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
            <NavLink path="/converter" label="Token converter" />
            <Link href="https://docs.oct.network/" isExternal>
              <Heading fontSize="sm" fontWeight={600}>
                Docs
              </Heading>
            </Link>
            <ColorModeSwitcher />
          </HStack>

          {global.accountId ? (
            <Menu isOpen={isMenuOpen} placement="top-end">
              <MenuButton
                as={Box}
                onMouseEnter={onMenuOpen}
                onMouseLeave={onMenuClose}
              >
                <Avatar boxSize={9} src={octoAvatar} />
              </MenuButton>
              <MenuList
                onMouseEnter={onMenuOpen}
                onMouseLeave={onMenuClose}
                mt={-1}
              >
                <MenuGroup title={global.accountId}>
                  <RouterLink to="/dashboard">
                    <MenuItem icon={<AiOutlineDashboard />}>Dashboard</MenuItem>
                  </RouterLink>
                </MenuGroup>
                <MenuDivider />
                <MenuItem onClick={onLogout} icon={<AiOutlinePoweroff />}>
                  Logout
                </MenuItem>
              </MenuList>
            </Menu>
          ) : (
            <LoginButton />
          )}
          <HStack spacing={2} display={{ base: 'flex', md: 'none' }}>
            <MdMenu size={30} onClick={onOpen} />
            <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
              <DrawerOverlay />
              <DrawerContent>
                <DrawerCloseButton size="30px" m={3} />

                <DrawerBody>
                  <VStack
                    spacing={8}
                    display={{ base: 'flex', md: 'none' }}
                    alignItems="flex-end"
                    pt={16}
                  >
                    <NavLink
                      path="/home"
                      label="Home"
                      fontSize="lg"
                      onClick={onClose}
                    />
                    <NavLink
                      path="/appchains"
                      label="Appchains"
                      fontSize="lg"
                      onClick={onClose}
                    />
                    <NavLink
                      path="/bridge"
                      label="Bridge"
                      fontSize="lg"
                      onClick={onClose}
                    />
                    <NavLink
                      path="/converter"
                      label="Token converter"
                      fontSize="lg"
                      onClick={onClose}
                    />
                    <Link href="https://docs.oct.network/" isExternal>
                      <Heading fontSize="lg" fontWeight={600}>
                        Docs
                      </Heading>
                    </Link>
                    <ColorModeSwitcher />
                  </VStack>
                </DrawerBody>
              </DrawerContent>
            </Drawer>
          </HStack>
        </HStack>
      </Flex>
    </Container>
  )
}
