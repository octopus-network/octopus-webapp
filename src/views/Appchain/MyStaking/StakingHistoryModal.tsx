import React from 'react';

import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  Text
} from '@chakra-ui/react';

import { StakingHistory } from 'types';

import { BaseModal, Empty } from 'components';
import { DecimalUtil } from 'utils';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { OCT_TOKEN_DECIMALS } from 'primitives';

type StakingHistoryModalProps = {
  histories: StakingHistory[] | undefined;
  isOpen: boolean;
  onClose: () => void;
}

dayjs.extend(relativeTime);

export const StakingHistoryModal: React.FC<StakingHistoryModalProps> = ({ isOpen, onClose, histories }) => {

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxW="640px"
      title="Staking History">
      
      {
        histories?.length ?
          <Box maxH="40vh" overflow="scroll" mt={3}>
            <Table>
              <Thead>
                <Tr>
                  <Th>Action</Th>
                  <Th>Amount</Th>
                  {/* <Th>Effected</Th> */}
                  <Th textAlign="right">Time</Th>
                </Tr>
              </Thead>
              <Tbody>
                {
                  histories?.map((h, idx) => {
                    const [action, fact] = Object.entries(h.staking_fact)[0];

                    return (
                      <Tr key={`tr-${idx}`}>
                        <Td maxW="200px">
                          <Text textOverflow="ellipsis" overflow="hidden" whiteSpace="nowrap">{action}</Text>
                        </Td>
                        <Td>
                          {DecimalUtil.beautify(DecimalUtil.fromString(fact.amount, OCT_TOKEN_DECIMALS))}
                        </Td>
                        {/* <Td>
                          {h.has_taken_effect}
                        </Td> */}
                        <Td textAlign="right">
                          <Text>{dayjs(Math.floor(h.timestamp/1e6)).fromNow()}</Text>
                        </Td>
                      </Tr>
                    )
                  })
                }
              </Tbody>
            </Table>
          </Box> : 
          <Empty />
      }
    </BaseModal>
  );
}