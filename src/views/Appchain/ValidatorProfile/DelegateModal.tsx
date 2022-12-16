import React, { useState, useEffect, useMemo } from "react";
import useSWR from "swr";

import { Text, Button, Box, Flex, useBoolean, Input } from "@chakra-ui/react";

import { BaseModal } from "components";

import { OCT_TOKEN_DECIMALS, COMPLEX_CALL_GAS } from "primitives";

import { AnchorContract } from "types";
import { ZERO_DECIMAL, DecimalUtil } from "utils";
import { useWalletSelector } from "components/WalletSelectorContextProvider";
import { Toast } from "components/common/toast";
import { onTxSent } from "utils/helper";
import Decimal from "decimal.js";
import { getDelegateLimit } from "utils/delegate";

type DelegateModalProps = {
  isOpen: boolean;
  anchor?: AnchorContract;
  onClose: () => void;
  validatorId: string;
};

export const DelegateModal: React.FC<DelegateModalProps> = ({
  isOpen,
  onClose,
  validatorId,
  anchor,
}) => {
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(0);
  const [amount, setAmount] = useState("");

  const { accountId, networkConfig, selector } = useWalletSelector();

  const [isDepositing, setIsDepositing] = useBoolean(false);
  const [minimumDeposit, setMinimumDeposit] = useState(ZERO_DECIMAL);
  const inputRef = React.useRef<any>();

  const { data: balances } = useSWR(accountId ? `balances/${accountId}` : null);

  const amountInDecimal = useMemo(
    () => DecimalUtil.fromString(amount),
    [amount]
  );
  const octBalance = useMemo(
    () => DecimalUtil.fromString(balances?.["OCT"]),
    [balances]
  );

  useEffect(() => {
    if (anchor && validatorId) {
      getDelegateLimit({
        anchor,
        octBalance,
        validatorId,
        deposited: ZERO_DECIMAL,
        type: "increase",
      }).then(({ min, max }) => {
        setMin(min);
        setMax(max);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor, validatorId, octBalance]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef?.current?.focus();
      }, 300);
      anchor?.get_protocol_settings().then((settings) => {
        setMinimumDeposit(
          DecimalUtil.fromString(
            settings.minimum_delegator_deposit,
            OCT_TOKEN_DECIMALS
          )
        );
      });
    }
  }, [isOpen, anchor]);

  const onDeposit = async () => {
    try {
      setIsDepositing.on();
      const wallet = await selector.wallet();
      await wallet.signAndSendTransaction({
        signerId: accountId,
        receiverId: networkConfig?.octopus.octTokenContractId,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "ft_transfer_call",
              args: {
                receiver_id: anchor?.contractId || "",
                amount: DecimalUtil.toU64(
                  amountInDecimal,
                  OCT_TOKEN_DECIMALS
                ).toString(),
                msg: JSON.stringify({
                  RegisterDelegator: {
                    validator_id: validatorId,
                    delegator_id: null,
                  },
                }),
              },
              gas: COMPLEX_CALL_GAS,
              deposit: "1",
            },
          },
        ],
      });
      Toast.success("Deposited");
      setIsDepositing.off();
      onTxSent();
    } catch (error) {
      setIsDepositing.off();
      Toast.error(error);
    }
  };

  const isDisabled = max < min;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Delegate on ${validatorId}`}
    >
      <Box mt={3} p={1}>
        <Flex justify="flex-end">
          <Text
            fontSize="sm"
            cursor="pointer"
            variant="gray"
            onClick={() => {
              if (octBalance.gte(min) && octBalance.lte(max)) {
                setAmount(octBalance.toString());
              }
            }}
          >
            Balance: {DecimalUtil.beautify(octBalance, 0)} OCT
          </Text>
        </Flex>
        <Input
          mt={2}
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
          }}
          type="number"
          min={min}
          max={max}
          disabled={isDisabled}
        />
        <Flex justify="space-between" pt={2}>
          <Text
            fontSize="sm"
            cursor="pointer"
            onClick={() => {
              if (octBalance.gte(min)) {
                setAmount(String(min));
              }
            }}
          >
            Min: {DecimalUtil.beautify(new Decimal(min), 0)}
          </Text>

          <Text
            fontSize="sm"
            cursor="pointer"
            onClick={() => {
              if (octBalance.gte(max)) {
                setAmount(String(max));
              }
            }}
          >
            Max: {isDisabled ? "-" : DecimalUtil.beautify(new Decimal(max), 0)}
          </Text>
        </Flex>

        <Text variant="gray" fontSize="sm" mt={2}>
          {isDisabled
            ? `According to the rule of staking ration, you can't delegate`
            : ""}
        </Text>
      </Box>
      <Box mt={4}>
        <Button
          colorScheme="octo-blue"
          onClick={onDeposit}
          isLoading={isDepositing}
          isDisabled={
            !amount ||
            amountInDecimal.gt(octBalance) ||
            amountInDecimal.lt(minimumDeposit) ||
            isDepositing
          }
          width="100%"
        >
          {!amount
            ? "Input Amount"
            : amountInDecimal.lt(minimumDeposit)
            ? "Minimum Limit"
            : amountInDecimal.gt(octBalance)
            ? "Insufficient Balance"
            : "Deposit"}
        </Button>
      </Box>
    </BaseModal>
  );
};
