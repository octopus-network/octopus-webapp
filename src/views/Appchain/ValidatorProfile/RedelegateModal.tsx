import {
  Box,
  Button,
  ButtonGroup,
  HStack,
  Radio,
  RadioGroup,
  Stack,
  Text,
} from "@chakra-ui/react";
import { BaseModal } from "components";
import { Toast } from "components/common/toast";
import { useWalletSelector } from "components/WalletSelectorContextProvider";
import { COMPLEX_CALL_GAS } from "primitives";
import { useEffect, useState } from "react";
import { AnchorContract, Validator } from "types";

export default function RedelegateModal({
  isOpen,
  onClose,
  currentValidatorId,
  validators = [],
  anchor,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentValidatorId: string;
  validators?: Validator[];
  anchor?: AnchorContract;
}) {
  const { selector, accountId } = useWalletSelector();
  const [newValidatorId, setNewValidatorId] = useState("");
  const [avaliableValidators, setAvaliableValidators] = useState<string[]>([]);

  useEffect(() => {
    if (validators.length > 0) {
      const avv = validators
        ?.filter((v) => {
          if (
            !v.can_be_delegated_to ||
            v.validator_id === currentValidatorId ||
            v.validator_id === accountId ||
            v.is_unbonding
          ) {
            return false;
          }
          return true;
        })
        .map((t) => t.validator_id);
      setAvaliableValidators(avv);
    }
  }, [validators, currentValidatorId, accountId]);

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
      maxW="600px"
      title={`Redelegate from ${currentValidatorId}`}
    >
      <Box p={1}>
        <Text>Avaliable Validators</Text>
        <Box maxH="40vh" overflow="scroll" mt={3}>
          <RadioGroup
            name="new_validator_id"
            value={newValidatorId}
            onChange={setNewValidatorId}
          >
            <Stack>
              {avaliableValidators?.map((v) => {
                return (
                  <Radio key={v} value={v} size="lg">
                    {v}
                  </Radio>
                );
              })}
            </Stack>
          </RadioGroup>
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
