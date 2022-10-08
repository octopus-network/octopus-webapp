import React from "react";

import { HStack, Box, Heading, Flex } from "@chakra-ui/react";

import { RippleDot } from "components";

const state2color: Record<string, string> = {
  Unknown: "#718096",
  Registered: "#718096",
  Dead: "#718096",
  Unbonded: "#718096",
  Auditing: "#38A169",
  InQueue: "#319795",
  Staging: "#3182CE",
  Booting: "#DD6B20",
  Active: "#2468f2",
  "Need Keys": "#319795",
  Validating: "#2468f2",
  Unbonding: "#e53e3e",
  Frozen: "#718096",
};

const state2label: Record<string, string> = {
  Unknown: "unknown",
  Registered: "Registered",
  Dead: "Registered",
  Unbonded: "Unbonded",
  Auditing: "Auditing",
  InQueue: "Voting",
  Staging: "Staking",
  Booting: "Booting",
  Active: "Running",
  "Need Keys": "Need Keys",
  Validating: "Validating",
  Unbonding: "Unbonding",
  Frozen: "Frozen",
};

const rappleStates: string[] = ["Validating", "Running"];

type StateBadgeProps = {
  state?: string;
};

export const StateBadge: React.FC<StateBadgeProps> = ({ state }) => {
  return state ? (
    <Flex bg="rgba(56, 161, 105, .1)" p="3px 6px" borderRadius="3xl" w="auto">
      <HStack>
        {rappleStates.includes(state2label[state]) ? (
          <RippleDot size={16} color={state2color[state]} />
        ) : (
          <Box bg={state2color[state]} boxSize="8px" borderRadius="full" />
        )}
        <Heading fontSize="13px" fontWeight={600} color={state2color[state]}>
          {state2label[state]}
        </Heading>
      </HStack>
    </Flex>
  ) : null;
};
