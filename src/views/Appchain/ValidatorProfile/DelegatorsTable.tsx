import React from "react";

import {
  Table,
  Thead,
  Tbody,
  Text,
  Tr,
  Th,
  Td,
  useColorModeValue,
} from "@chakra-ui/react";

import { Delegator } from "types";
import { DecimalUtil } from "utils";

type DelegatorsTableProps = {
  delegators: Delegator[];
};

export const DelegatorsTable: React.FC<DelegatorsTableProps> = ({
  delegators,
}) => {
  const bg = useColorModeValue("#f6f7fa", "#15172c");
  return (
    <Table>
      <Thead bg={bg}>
        <Tr>
          <Th>Delegator ID</Th>
          <Th isNumeric>Delegated</Th>
        </Tr>
      </Thead>
      <Tbody>
        {delegators.map((delegator) => (
          <Tr key={`tr-${delegator.delegator_id}`}>
            <Td maxW="180px">
              <Text
                whiteSpace="nowrap"
                textOverflow="ellipsis"
                overflow="hidden"
                w="100%"
              >
                {delegator.delegator_id}
              </Text>
            </Td>
            <Td isNumeric>
              {DecimalUtil.formatAmount(delegator.delegation_amount)}
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};
