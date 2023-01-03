import React from "react";

import {
  Container,
  Divider,
  Stack,
  HStack,
  Link,
  Text,
  Icon,
} from "@chakra-ui/react";

import { AiFillTwitterCircle, AiFillGithub } from "react-icons/ai";

import { FaDiscord } from "react-icons/fa";
import { useWalletSelector } from "./WalletSelectorContextProvider";

export const Footer: React.FC = () => {
  const { networkConfig } = useWalletSelector();

  return (
    <Container pt={4} pb={4}>
      <Divider />
      <Stack
        pt={6}
        pb={6}
        fontSize="sm"
        spacing={6}
        alignItems="center"
        justifyContent="space-between"
        direction={{ base: "column", md: "row" }}
      >
        <HStack
          spacing={[2, 3]}
          w="100%"
          flex={1}
          justifyContent={{ base: "center", md: "flex-start" }}
        >
          <Link
            variant="gray-underline"
            whiteSpace="nowrap"
            href={`${networkConfig?.near.explorerUrl}/accounts/${networkConfig?.octopus.registryContractId}`}
            overflow="hidden"
            textOverflow="ellipsis"
            isExternal
          >
            Registry Contract
          </Link>
          <Text variant="gray" opacity=".5">
            |
          </Text>
          <Link
            variant="gray-underline"
            whiteSpace="nowrap"
            href={`${networkConfig?.near.explorerUrl}/accounts/${networkConfig?.octopus.octTokenContractId}`}
            overflow="hidden"
            textOverflow="ellipsis"
            isExternal
          >
            Token Contract
          </Link>
          <Text variant="gray" opacity=".5">
            |
          </Text>
          <Link
            variant="gray-underline"
            whiteSpace="nowrap"
            href={`/policy`}
            overflow="hidden"
            textOverflow="ellipsis"
          >
            Policy
          </Link>
        </HStack>
        <HStack spacing={3}>
          <Text variant="gray">&copy; 2023 Octopus Network</Text>
          <Link
            variant="gray-hover-blue"
            href="https://twitter.com/oct_network"
            isExternal
          >
            <Icon as={AiFillTwitterCircle} boxSize={5} />
          </Link>
          <Link
            variant="gray-hover-blue"
            href="https://github.com/octopus-network"
            isExternal
          >
            <Icon as={AiFillGithub} boxSize={5} />
          </Link>
          <Link
            variant="gray-hover-blue"
            href="https://discord.com/invite/6GTJBkZA9Q"
            isExternal
          >
            <Icon as={FaDiscord} boxSize={5} />
          </Link>
        </HStack>
      </Stack>
    </Container>
  );
};
