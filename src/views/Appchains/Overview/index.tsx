import React from "react";
import useSWR from "swr";
import dayjs from "dayjs";
import Decimal from "decimal.js";

import {
  DrawerHeader,
  DrawerBody,
  Avatar,
  Heading,
  Text,
  Box,
  CloseButton,
  Flex,
  Icon,
  HStack,
  DrawerFooter,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";

import { AppchainInfo } from "types";
import { StateBadge, LoginButton } from "components";
import { FaUser } from "react-icons/fa";

import { Links } from "./Links";
import { Descriptions } from "./Descriptions";
import { DecimalUtil } from "utils";

import octoAvatar from "assets/icons/avatar.png";
import { useWalletSelector } from "components/WalletSelectorContextProvider";

type OverviewProps = {
  appchainId: string | undefined;
  onDrawerClose: VoidFunction;
};

export const Overview: React.FC<OverviewProps> = ({
  appchainId,
  onDrawerClose,
}) => {
  const { accountId } = useWalletSelector();

  const { data: appchain } = useSWR<AppchainInfo>(`appchain/${appchainId}`);
  const footerBg = useColorModeValue("#f6f7fa", "#15172c");

  const { data: balances } = useSWR(accountId ? `balances/${accountId}` : null);

  return (
    <>
      <DrawerHeader borderBottomWidth="0">
        <Flex justifyContent="space-between" alignItems="center">
          <Heading fontSize="lg">Overview</Heading>
          <CloseButton onClick={onDrawerClose} />
        </Flex>
      </DrawerHeader>
      <DrawerBody>
        <Flex alignItems="center" justifyContent="space-between">
          <HStack>
            <Avatar
              src={
                appchain?.appchain_metadata?.fungible_token_metadata.icon as any
              }
              name={appchainId}
              boxSize={10}
            />
            <VStack alignItems="flex-start" spacing={0}>
              <Heading fontSize="xl">{appchainId}</Heading>
              {appchain ? (
                <HStack className="octo-gray" fontSize="sm">
                  <Icon as={FaUser} boxSize={3} />
                  <Text>{appchain?.appchain_owner}</Text>
                </HStack>
              ) : null}
            </VStack>
          </HStack>
          <VStack alignItems="flex-end" spacing={0}>
            <StateBadge state={appchain?.appchain_state || ""} />
            <Text variant="gray" fontSize="sm">
              {appchain
                ? dayjs(
                    Math.floor((appchain.registered_time as any) / 1e6)
                  ).format("YYYY-MM-DD")
                : "-"}
            </Text>
          </VStack>
        </Flex>
        <Box mt={6}>
          <Links data={appchain} />
        </Box>
        <Box mt={6}>
          <Descriptions data={appchain} />
        </Box>
      </DrawerBody>
      <DrawerFooter justifyContent="flex-start">
        <Box bg={footerBg} p={4} borderRadius="lg" w="100%">
          <Flex justifyContent="space-between">
            {accountId ? (
              <HStack>
                <Avatar
                  boxSize={6}
                  src={octoAvatar}
                  display={{ base: "none", md: "block" }}
                />
                <Heading fontSize="sm">{accountId}</Heading>
              </HStack>
            ) : (
              <LoginButton />
            )}
            {accountId ? (
              <HStack>
                <Text variant="gray" display={{ base: "none", md: "block" }}>
                  Balance:
                </Text>
                <Heading fontSize="md" color="octo-blue.500">
                  {DecimalUtil.beautify(new Decimal(balances?.["OCT"] || 0))}{" "}
                  OCT
                </Heading>
              </HStack>
            ) : null}
          </Flex>
        </Box>
      </DrawerFooter>
    </>
  );
};
