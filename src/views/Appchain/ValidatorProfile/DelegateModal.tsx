import React, { useState, useEffect, useMemo } from "react"
import useSWR from "swr"

import { Text, Button, Box, Flex, useBoolean } from "@chakra-ui/react"

import { BaseModal, AmountInput } from "components"

import {
  OCT_TOKEN_DECIMALS,
  COMPLEX_CALL_GAS,
  FAILED_TO_REDIRECT_MESSAGE,
} from "primitives"

import { AnchorContract } from "types"
import { ZERO_DECIMAL, DecimalUtil } from "utils"
import { useWalletSelector } from "components/WalletSelectorContextProvider"
import { Toast } from "components/common/toast"

type DelegateModalProps = {
  isOpen: boolean
  anchor: AnchorContract | undefined
  onClose: () => void
  validatorId: string
}

export const DelegateModal: React.FC<DelegateModalProps> = ({
  isOpen,
  onClose,
  validatorId,
  anchor,
}) => {
  const [amount, setAmount] = useState("")

  const { accountId, octToken, selector } = useWalletSelector()

  const [isDepositing, setIsDepositing] = useBoolean(false)
  const [minimumDeposit, setMinimumDeposit] = useState(ZERO_DECIMAL)
  const inputRef = React.useRef<any>()

  const { data: balances } = useSWR(accountId ? `balances/${accountId}` : null)

  const amountInDecimal = useMemo(
    () => DecimalUtil.fromString(amount),
    [amount]
  )
  const octBalance = useMemo(
    () => DecimalUtil.fromString(balances?.["OCT"]),
    [balances]
  )

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef?.current?.focus()
      }, 300)
      anchor?.get_protocol_settings().then((settings) => {
        setMinimumDeposit(
          DecimalUtil.fromString(
            settings.minimum_delegator_deposit,
            OCT_TOKEN_DECIMALS
          )
        )
      })
    }
  }, [isOpen])

  const onDeposit = async () => {
    try {
      setIsDepositing.on()
      const wallet = await selector.wallet()
      await wallet.signAndSendTransaction({
        signerId: accountId,
        receiverId: octToken?.contractId,
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
                  },
                }),
              },
              gas: COMPLEX_CALL_GAS,
              deposit: "1",
            },
          },
        ],
      })
      Toast.success("Deposited")
      setIsDepositing.off()
    } catch (error) {
      setIsDepositing.off()
      Toast.error(error)
    }
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Delegate on ${validatorId}`}
    >
      <Flex mb={2} justifyContent="space-between">
        <Text variant="gray" size="sm">
          Minimum deposit: {DecimalUtil.beautify(minimumDeposit, 0)}
        </Text>
        <Text variant="gray" size="sm">
          OCT balance: {octBalance.toFixed(0)}
        </Text>
      </Flex>
      <AmountInput
        placeholder="Deposit amount"
        value={amount}
        onChange={(v) => setAmount(v)}
        refObj={inputRef}
      />
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
  )
}
