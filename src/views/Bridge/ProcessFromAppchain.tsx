import React, { useMemo } from "react";
import dayjs from "dayjs";

import {
  Flex,
  Center,
  Box,
  Heading,
  Tag,
  Text,
  List,
  Link,
  HStack,
  Icon,
} from "@chakra-ui/react";

import { NetworkConfig } from "types";
import { BeatLoader } from "react-spinners";
import { CheckIcon, CloseIcon, ExternalLinkIcon } from "@chakra-ui/icons";

type Props = {
  data: {
    details: {
      msg_in_appchain: any;
      processing_msgs_in_near: any[];
      staging_msgs_in_near: any[];
    };
    summary: any;
  };
  network: NetworkConfig | null;
};

export const ProcessFromAppchain: React.FC<Props> = ({ data, network }) => {
  const { details, summary } = data || {};

  const appchainId = useMemo(() => summary?.appchain_id, [summary]);
  return (
    <>
      <Flex alignItems="center">
        <Center boxSize={10}>
          <Center
            boxSize={8}
            borderRadius="full"
            borderWidth="2px"
            borderColor="green"
          >
            <Icon as={CheckIcon} color="green" />
          </Center>
        </Center>
        <Box flex={1} ml={3}>
          <Flex alignItems="center" justifyContent="space-between">
            <HStack>
              <Heading fontSize="lg">{appchainId}</Heading>
              <Tag
                colorScheme={summary?.event === "Burnt" ? "green" : "blue"}
                size="sm"
              >
                {summary?.event}
              </Tag>
            </HStack>
            <Text color="gray">
              {dayjs(details?.msg_in_appchain.timestamp).format(
                "YYYY-MM-DD HH:mm:ss"
              )}
            </Text>
          </Flex>
          <Flex
            alignItems="center"
            justifyContent="space-between"
            fontSize="sm"
          >
            <Text color="gray">Extrinsic</Text>
            <Link
              maxW="320px"
              isExternal
              href={`${network?.octopus.explorerUrl}/${appchainId}/extrinsics/${details?.msg_in_appchain.extrinsic_id}`}
              _hover={{ textDecoration: "underline" }}
              color="#2468f2"
            >
              <HStack spacing={1}>
                <Text
                  whiteSpace="nowrap"
                  overflow="hidden"
                  textOverflow="ellipsis"
                >
                  {details?.msg_in_appchain.extrinsic_id || "-"}
                </Text>
                <Icon as={ExternalLinkIcon} boxSize={3} color="gray" />
              </HStack>
            </Link>
          </Flex>
        </Box>
      </Flex>
      <Flex>
        <Center boxSize={10}>
          <Box
            w="2px"
            h={8}
            bg={
              summary?.status === "Success"
                ? "green"
                : summary?.status === "Failed"
                ? "red"
                : "gray.400"
            }
          />
        </Center>
      </Flex>
      <Flex alignItems="flex-start">
        <Center boxSize={10}>
          <Center
            boxSize={8}
            borderRadius="full"
            borderWidth="2px"
            borderColor={
              summary?.status === "Success"
                ? "green"
                : summary?.status === "Failed"
                ? "red"
                : "gray.400"
            }
          >
            <Box mt="-5px">
              {summary?.status === "Success" ? (
                <Icon as={CheckIcon} color="green" />
              ) : summary?.status === "Failed" ? (
                <Icon as={CloseIcon} color="red" />
              ) : (
                <BeatLoader size={4} margin={1} color="gray" />
              )}
            </Box>
          </Center>
        </Center>
        <Box flex={1} ml={3}>
          <Flex alignItems="center" justifyContent="space-between" mt={2}>
            <Heading fontSize="md">NEAR</Heading>
          </Flex>
          <List mt={3} spacing={3}>
            {details?.processing_msgs_in_near
              .concat(details?.staging_msgs_in_near)
              .filter((i) => !!i)
              .map((item) => (
                <List borderWidth={1} borderRadius="md" spacing={1} p={1}>
                  <Flex
                    fontSize="sm"
                    alignItems="center"
                    p={1}
                    borderBottomWidth={1}
                  >
                    <Box w="120px">
                      <Text color="gray">Transaction</Text>
                    </Box>
                    <Link
                      isExternal
                      maxW="220px"
                      _hover={{ textDecoration: "underline" }}
                      color="#2468f2"
                      href={`${network?.near.explorerUrl}/transactions/${item.transaction_hash}`}
                    >
                      <HStack spacing={1}>
                        <Text
                          whiteSpace="nowrap"
                          overflow="hidden"
                          textOverflow="ellipsis"
                        >
                          {item.transaction_hash || "-"}
                        </Text>
                        <Icon as={ExternalLinkIcon} boxSize={3} color="gray" />
                      </HStack>
                    </Link>
                  </Flex>
                  <Flex
                    fontSize="sm"
                    alignItems="center"
                    p={1}
                    borderBottomWidth={1}
                  >
                    <Box w="120px">
                      <Text color="gray">Timestamp</Text>
                    </Box>
                    <Text>
                      {dayjs(item.timestamp).format("YYYY-MM-DD HH:mm:ss")}
                    </Text>
                  </Flex>
                  <Flex fontSize="sm" alignItems="center" p={1}>
                    <Box w="120px">
                      <Text color="gray">Status</Text>
                    </Box>
                    <Tag
                      colorScheme={item.status === "Success" ? "green" : "red"}
                      size="sm"
                    >
                      {item.status}
                    </Tag>
                  </Flex>
                </List>
              ))}
          </List>
        </Box>
      </Flex>
    </>
  );
};
