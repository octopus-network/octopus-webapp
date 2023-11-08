import React from "react";

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
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody,
  VStack,
  useBoolean,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Text,
} from "@chakra-ui/react";

import { ColorModeSwitcher, LoginButton } from "components";

import { AiOutlinePoweroff } from "react-icons/ai";

import { Link as RouterLink, useLocation } from "react-router-dom";
import logo from "assets/logo.png";
import octoAvatar from "assets/icons/avatar.png";

import { MdMenu } from "react-icons/md";
import { useWalletSelector } from "./WalletSelectorContextProvider";
import { Toast } from "./common/toast";

type NavLinkProps = {
  path: string;
  label: string;
  fontSize?: string;
  onClick?: () => void;
};

const NavLink: React.FC<NavLinkProps> = ({
  path,
  label,
  fontSize = "sm",
  onClick,
}) => {
  const location = useLocation();
  const locationPath = location.pathname;

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
  );
};

export const Header: React.FC = () => {
  const { accountId, selector } = useWalletSelector();

  const {
    isOpen: isMenuOpen,
    onOpen: onMenuOpen,
    onClose: onMenuClose,
  } = useDisclosure();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [confirmModal, setConfirmModal] = useBoolean();

  const onLogout = async () => {
    const wallet = await selector.wallet();
    wallet
      .signOut()
      .then(() => {
        setConfirmModal.off();
        window.location.reload();
      })
      .catch((err) => {
        Toast.error(err);
      });
  };

  return (
    <Container pt={4} pb={4}>
      <Flex justifyContent="space-between" alignItems="center">
        <RouterLink to="/">
          <Image src={logo} h="45px" />
        </RouterLink>
        <HStack spacing={6}>
          <HStack spacing={8} display={{ base: "none", md: "flex" }}>
            <NavLink path="/home" label="Home" />
            <NavLink path="/appchains" label="Appchains" />
            <NavLink path="/bridge" label="Bridge" />
            <NavLink path="/dashboard" label="Dashboard" />
            <Link href="https://docs.oct.network/" isExternal>
              <Heading fontSize="sm" fontWeight={600}>
                Docs
              </Heading>
            </Link>
            <ColorModeSwitcher />
          </HStack>

          {accountId ? (
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
                <MenuGroup title={accountId}>
                  <MenuItem
                    onClick={setConfirmModal.on}
                    icon={<AiOutlinePoweroff />}
                  >
                    Logout
                  </MenuItem>
                </MenuGroup>
              </MenuList>
            </Menu>
          ) : (
            <LoginButton />
          )}
          <HStack spacing={2} display={{ base: "flex", md: "none" }}>
            <MdMenu size={30} onClick={onOpen} />
            <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
              <DrawerOverlay />
              <DrawerContent>
                <DrawerCloseButton size="30px" m={3} />

                <DrawerBody>
                  <VStack
                    spacing={8}
                    display={{ base: "flex", md: "none" }}
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
                    {/* <NavLink
                      path="/converter"
                      label="Token converter"
                      fontSize="lg"
                      onClick={onClose}
                    /> */}
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
      <Modal
        isCentered
        onClose={setConfirmModal.off}
        size="md"
        isOpen={confirmModal}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Wallet</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Confirm logout?</Text>
          </ModalBody>
          <ModalFooter>
            <Button onClick={setConfirmModal.off}>Cancel</Button>
            <Button colorScheme="octo-blue" ml={3} onClick={onLogout}>
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};
