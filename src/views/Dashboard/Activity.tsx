import React from "react";
import useSWR from "swr";

import {
  Heading,
  Text,
  List,
  Box,
  HStack,
  VStack,
  Spinner,
  Button,
  Link,
  Center,
  Flex,
  useColorModeValue,
} from "@chakra-ui/react";

import { Empty } from "components";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { useWalletSelector } from "components/WalletSelectorContextProvider";

type ActivityType = {
  action_kind: string;
  block_timestamp: string;
  hash: string;
  args: any;
  receiver_id: string;
};

class ActivityTranslator {
  private data: ActivityType;
  private account: string;

  constructor(data: ActivityType, account: string) {
    this.data = data;
    this.account = account;
  }

  getActionKind(): string {
    return (
      {
        TRANSFER:
          this.data?.receiver_id === this.account
            ? "Received NEAR"
            : "Sent NEAR",
        CREATE_ACCOUNT: "New account created",
        ADD_KEY: "Access Key added",
        FUNCTION_CALL: "Method called",
      }[this.data.action_kind] || "Unknown"
    );
  }

  getActionConnect() {
    return (
      {
        TRANSFER: this.data?.receiver_id === this.account ? "from" : "to",
        CREATE_ACCOUNT: "account",
        ADD_KEY: "for",
        FUNCTION_CALL: `${this.data.args?.method_name} in `,
      }[this.data.action_kind] || "Unknown"
    );
  }

  getActionTarget() {
    const { receiver_id, args, action_kind } = this.data;

    switch (action_kind) {
      case "TRANSFER":
      case "CREATE_ACCOUNT":
        return receiver_id;
      case "ADD_KEY":
        return args.access_key.permission.permission_kind === "FULL_ACCESS"
          ? receiver_id
          : args.access_key.permission.permission_details?.receiver_id;
      case "FUNCTION_CALL":
        return args.args_json?.receiver_id || receiver_id;
    }
  }
}

dayjs.extend(relativeTime);

const ActivityItem: React.FC<{
  activity: ActivityType;
}> = ({ activity }) => {
  const { accountId, networkConfig } = useWalletSelector();

  const activityTranslator = new ActivityTranslator(activity, accountId || "");

  return (
    <Box>
      <Flex alignItems="center" justifyContent="space-between">
        <VStack alignItems="flex-start" spacing={0}>
          <HStack>
            <Heading fontSize="md">
              {activityTranslator.getActionKind()}
            </Heading>
            <Text
              variant="gray"
              whiteSpace="nowrap"
              overflow="hidden"
              textOverflow="ellipsis"
              maxW="160px"
              fontFamily="monospace"
            >
              {activityTranslator.getActionConnect()}
            </Text>
            <Link
              isExternal
              href={`${
                networkConfig?.near.explorerUrl
              }/address/${activityTranslator.getActionTarget()}`}
            >
              <Text
                whiteSpace="nowrap"
                overflow="hidden"
                textOverflow="ellipsis"
                maxW="160px"
              >
                {activityTranslator.getActionTarget()}
              </Text>
            </Link>
          </HStack>
          <Text variant="gray">
            {dayjs(
              (activity.block_timestamp.substr(0, 13) as any) * 1
            ).fromNow()}
          </Text>
        </VStack>
        <Link
          href={`${networkConfig?.near.explorerUrl}/txns/${activity.hash}`}
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

export const Activity = ({ viewingAccount }: { viewingAccount?: string }) => {
  const bg = useColorModeValue("white", "#15172c");

  const accountId = viewingAccount;
  const { data: activity, error: activityError } = useSWR<any[]>(
    accountId ? `${accountId}/activity` : null
  );

  return (
    <Box minH="320px" bg={bg} p={6} borderRadius="md" mt={6}>
      <Heading fontSize="2xl">Recent Activity</Heading>
      {accountId ? (
        !activity && !activityError ? (
          <Center minH="160px">
            <Spinner
              size="md"
              thickness="4px"
              speed="1s"
              color="octo-blue.500"
            />
          </Center>
        ) : activity?.length ? (
          <List spacing={4} mt={6}>
            {activity.map((a, idx) => (
              <ActivityItem activity={a} key={`activity-${idx}`} />
            ))}
          </List>
        ) : (
          <Empty />
        )
      ) : (
        <Empty />
      )}
    </Box>
  );
};
