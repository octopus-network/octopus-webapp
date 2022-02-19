import React from 'react';

import {
  Table,
  Thead,
  Tbody,
  Text,
  Tr,
  Th,
  Td,
  useColorModeValue
} from '@chakra-ui/react';

import { Delegator } from 'types';
import { DecimalUtil } from 'utils';
import { OCT_TOKEN_DECIMALS } from 'primitives'; 

type DelegatorsTableProps = {
  delegators: Delegator[];
}

export const DelegatorsTable: React.FC<DelegatorsTableProps> = ({ delegators }) => {
  const bg = useColorModeValue('#f6f7fa', '#15172c');
  return (
    <Table>
      <Thead bg={bg}>
        <Tr>
          <Th>Delegator Id</Th>
          <Th isNumeric>Delegated</Th>
        </Tr>
      </Thead>
      <Tbody>
      {
        delegators.map(delegator => (
          <Tr key={`tr-${delegator.delegator_id}`}>
            <Td>
              <Text>{delegator.delegator_id}</Text>
            </Td>
            <Td isNumeric>
              {
                DecimalUtil.beautify(
                  DecimalUtil.fromString(delegator.delegation_amount, OCT_TOKEN_DECIMALS)
                )
              }
            </Td>
          </Tr>
        ))
      }
      </Tbody>
    </Table>
  );
}