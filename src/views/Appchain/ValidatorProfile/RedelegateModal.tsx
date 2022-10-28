import {
  Box,
  Button,
  ButtonGroup,
  HStack,
  Radio,
  RadioGroup,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { BaseModal, Empty } from "components";
import { Toast } from "components/common/toast";
import { useWalletSelector } from "components/WalletSelectorContextProvider";
import dayjs from "dayjs";
import Decimal from "decimal.js";
import _ from "lodash";
import { COMPLEX_CALL_GAS, OCT_TOKEN_DECIMALS } from "primitives";
import { useEffect, useState } from "react";
import { AnchorContract, Validator } from "types";
import { DecimalUtil } from "utils";
import { getStakeLimit } from "utils/delegate";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function RedelegateModal({
  isOpen,
  onClose,
  currentValidatorId,
  validators = [],
  anchor,
  delegatedDeposits,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentValidatorId: string;
  validators?: Validator[];
  anchor?: AnchorContract;
  delegatedDeposits: Decimal;
}) {
  const { selector, accountId } = useWalletSelector();
  const [newValidatorId, setNewValidatorId] = useState("");
  const [avaliableValidators, setAvaliableValidators] = useState<Validator[]>(
    []
  );

  useEffect(() => {
    if (validators.length > 0) {
      const avv = validators?.filter((v) => {
        if (
          !v.can_be_delegated_to ||
          v.validator_id === currentValidatorId ||
          v.is_unbonding ||
          v.validator_id === accountId
        ) {
          return false;
        }
        return true;
      });
      setAvaliableValidators(avv);

      if (anchor) {
        Promise.all(
          avv.map((t) => {
            return getStakeLimit({
              type: "increase",
              validatorId: t.validator_id,
              anchor,
              octBalance: delegatedDeposits.plus(1),
            });
          })
        )
          .then((results) => {
            const _avv = [];
            for (let i = 0; i < avv.length; i++) {
              if (results[i].max > delegatedDeposits.toNumber()) {
                _avv.push(avv[i]);
              }
            }
            setAvaliableValidators(_avv);
          })
          .catch((e) => {
            console.log("error", e);
          });
      }
    }
  }, [validators, currentValidatorId, accountId, anchor, delegatedDeposits]);

  useEffect(() => {
    if (anchor && avaliableValidators.length) {
      Promise.all(
        avaliableValidators.map((t) =>
          anchor.get_user_staking_histories_of({
            account_id: t.validator_id,
          })
        )
      )
        .then((results) => {
          const froms: string[] = [];
          results.forEach((r, i) => {
            const time = _.min(r.map((t) => Number(t.timestamp)));
            if (time) {
              froms.push(dayjs(Math.floor(time / 1e6)).fromNow());
            } else {
              froms.push("-");
            }
          });
          setAvaliableValidators(
            avaliableValidators.map((t, idx) => ({
              ...t,
              registered_from: froms[idx],
            }))
          );
        })
        .catch(() => {});
    }
  }, [anchor, avaliableValidators]);

  const onConfirm = async () => {
    try {
      const wallet = await selector.wallet();
      await wallet.signAndSendTransaction({
        receiverId: anchor?.contractId,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "change_delegated_validator",
              args: {
                old_validator_id: currentValidatorId,
                new_validator_id: newValidatorId,
              },
              gas: COMPLEX_CALL_GAS,
              deposit: "0",
            },
          },
        ],
      });
    } catch (error) {
      Toast.error(error);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxW="800px"
      title={`Redelegate from ${currentValidatorId}`}
    >
      <Box p={1}>
        <Box maxH="40vh" overflow="scroll" mt={3}>
          {avaliableValidators.length > 0 ? (
            <RadioGroup value={newValidatorId}>
              <TableContainer>
                <Table size="md">
                  <Thead>
                    <Tr>
                      <Th>Validator</Th>
                      <Th>Total Staked</Th>
                      <Th isNumeric>Delegators</Th>
                      <Th isNumeric>Registered From</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {avaliableValidators.map((v) => {
                      return (
                        <Tr key={v.validator_id}>
                          <Td>
                            <Radio
                              checked={newValidatorId === v.validator_id}
                              value={v.validator_id}
                              size="lg"
                              onChange={() => {
                                if (newValidatorId === v.validator_id) {
                                  setNewValidatorId("");
                                } else {
                                  setNewValidatorId(v.validator_id);
                                }
                              }}
                            >
                              {v.validator_id}
                            </Radio>
                          </Td>
                          <Td>
                            {DecimalUtil.beautify(
                              DecimalUtil.fromString(
                                v.total_stake,
                                OCT_TOKEN_DECIMALS
                              )
                            )}
                          </Td>
                          <Td textAlign="center">{v.delegators_count}</Td>
                          <Td textAlign="center">{v.registered_from || "-"}</Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </TableContainer>
            </RadioGroup>
          ) : (
            <Empty message="No Avaliable Validators" />
          )}
        </Box>
        <HStack justify="flex-end" pt={3}>
          <ButtonGroup>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              disabled={!newValidatorId}
              colorScheme="octo-blue"
              onClick={onConfirm}
            >
              Confirm
            </Button>
          </ButtonGroup>
        </HStack>
      </Box>
    </BaseModal>
  );
}
