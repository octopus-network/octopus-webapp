import React from "react";

import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  Text,
  VStack,
} from "@chakra-ui/react";

import { StakingHistory } from "types";

import { BaseModal, Empty } from "components";
import { DecimalUtil } from "utils";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import { OCT_TOKEN_DECIMALS } from "primitives";

type StakingHistoryModalProps = {
  histories: StakingHistory[] | undefined;
  isOpen: boolean;
  onClose: () => void;
};

dayjs.extend(relativeTime);

export const StakingHistoryModal: React.FC<StakingHistoryModalProps> = ({
  isOpen,
  onClose,
  histories,
}) => {
  console.log("histories", histories);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxW="800px"
      title="Staking History"
    >
      {histories?.length ? (
        <Box maxH="40vh" overflow="scroll" mt={3}>
          <Table>
            <Thead>
              <Tr>
                <Th>Action</Th>
                <Th>Validator ID</Th>
                <Th>Amount</Th>
              </Tr>
            </Thead>
            <Tbody>
              {histories
                ?.sort((a, b) => {
                  return b.timestamp - a.timestamp;
                })
                .map((h, idx) => {
                  const [action, fact] = Object.entries(h.staking_fact)[0];

                  return (
                    <Tr key={`tr-${idx}`}>
                      <Td maxW="200px">
                        <Text
                          textOverflow="ellipsis"
                          overflow="hidden"
                          whiteSpace="nowrap"
                        >
                          {action}
                        </Text>
                        <Text fontSize="xs" color="gray">
                          {dayjs(Math.floor(h.timestamp / 1e6)).fromNow()}
                        </Text>
                      </Td>
                      <Td maxW="200px">
                        {action === "DelegatedValidatorChanged" ? (
                          <VStack align="flex-start">
                            <Text
                              textOverflow="ellipsis"
                              overflow="hidden"
                              whiteSpace="nowrap"
                            >
                              From: {(fact as any).old_validator_id}
                            </Text>
                            <Text
                              textOverflow="ellipsis"
                              overflow="hidden"
                              whiteSpace="nowrap"
                            >
                              To: {(fact as any).new_validator_id}
                            </Text>
                          </VStack>
                        ) : (
                          <Text
                            textOverflow="ellipsis"
                            overflow="hidden"
                            whiteSpace="nowrap"
                          >
                            {(fact as any).validator_id}
                          </Text>
                        )}
                      </Td>
                      <Td>
                        {DecimalUtil.beautify(
                          DecimalUtil.fromString(
                            fact.amount,
                            OCT_TOKEN_DECIMALS
                          )
                        )}
                      </Td>
                    </Tr>
                  );
                })}
            </Tbody>
          </Table>
        </Box>
      ) : (
        <Empty />
      )}
    </BaseModal>
  );
};
