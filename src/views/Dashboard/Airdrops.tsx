import React from "react";
import useSWR from "swr";

import {
  Heading,
  Text,
  List,
  Box,
  Link,
  Button,
  HStack,
  VStack,
  Spinner,
  Center,
  Flex,
  useColorModeValue,
} from "@chakra-ui/react";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Empty } from "components";
import { DecimalUtil } from "utils";
import Decimal from "decimal.js";
import { useWalletSelector } from "components/WalletSelectorContextProvider";

type Airdrop = {
  time: number;
  description: string;
  data: {
    amount: number;
    hash: string;
  };
};

dayjs.extend(relativeTime);

export const AirdropItem: React.FC<{
  airdrop: Airdrop;
}> = ({ airdrop }) => {
  const { networkConfig } = useWalletSelector();

  return (
    <Box>
      <Flex justifyContent="space-between" alignItems="center">
        <VStack alignItems="flex-start" spacing={0}>
          <HStack>
            <Heading fontSize="md">
              Received {DecimalUtil.beautify(new Decimal(airdrop.data.amount))}{" "}
              OCT
            </Heading>
            <Text variant="gray">in</Text>
            <Heading fontSize="md">{airdrop.description}</Heading>
          </HStack>
          <Text variant="gray">{dayjs(airdrop.time).fromNow()}</Text>
        </VStack>
        <Link
          href={`${networkConfig?.near.explorerUrl}/transactions/${airdrop.data.hash}`}
          isExternal
        >
          <Button size="sm" variant="ghost" colorScheme="octo-blue">
            {" "}
            View <ExternalLinkIcon ml={1} />
          </Button>
        </Link>
      </Flex>
    </Box>
  );
};

export const Airdrops = ({ viewingAccount }: { viewingAccount?: string }) => {
  const bg = useColorModeValue("white", "#15172c");
  const accountId = viewingAccount;
  const { data: airdrops, error: airdropsError } = useSWR<Airdrop[]>(
    accountId ? `${accountId}/airdrops` : null
  );

  if (!accountId || (airdrops && airdrops.length === 0)) {
    return null;
  }

  return (
    <Box bg={bg} p={6} borderRadius="lg" mt={6}>
      <Heading fontSize="2xl">Airdrops</Heading>
      {!airdrops && !airdropsError ? (
        <Center minH="160px">
          <Spinner size="md" thickness="4px" speed="1s" color="octo-blue.500" />
        </Center>
      ) : airdrops?.length ? (
        <List spacing={4} mt={6}>
          {airdrops.map((a, idx) => (
            <AirdropItem airdrop={a} key={`airdrop-${idx}`} />
          ))}
        </List>
      ) : (
        <Empty />
      )}
    </Box>
  );
};
