import React, { useState, useMemo } from "react"
import useSWR from "swr"

import {
  Box,
  Heading,
  Text,
  Button,
  useBoolean,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Flex,
} from "@chakra-ui/react"

import { AnchorContract, AppchainInfoWithAnchorStatus, Validator } from "types"

import { COMPLEX_CALL_GAS, OCT_TOKEN_DECIMALS } from "primitives"

import { DecimalUtil, ZERO_DECIMAL } from "utils"
import Decimal from "decimal.js"
import { useWalletSelector } from "components/WalletSelectorContextProvider"
import { Toast } from "components/common/toast"
import StakeInput from "components/AppChain/StakeInput"
import DelegateInput from "components/AppChain/DelegateInput"
import { onTxSent } from "utils/helper"

type StakingPopoverProps = {
  type: "increase" | "decrease"
  deposit?: Decimal
  anchor?: AnchorContract
  validatorId?: string
  helper?: string
  trigger: any
  validator?: Validator
  appchain?: AppchainInfoWithAnchorStatus
}

export const StakingPopover: React.FC<StakingPopoverProps> = ({
  trigger,
  type,
  helper,
  deposit = ZERO_DECIMAL,
  anchor,
  validatorId,
  validator,
  appchain,
}) => {
  const initialFocusRef = React.useRef<any>()

  const inputRef = React.useRef<any>()
  const [amount, setAmount] = useState(0)

  const [isSubmitting, setIsSubmitting] = useBoolean(false)

  const { accountId, octToken, selector } = useWalletSelector()

  const { data: balances } = useSWR(accountId ? `balances/${accountId}` : null)
  const octBalance = useMemo(
    () => DecimalUtil.fromString(balances?.["OCT"]),
    [balances]
  )

  const amountInDecimal = useMemo(
    () => DecimalUtil.fromString(String(amount)),
    [amount]
  )

  const onOpen = () => {
    setTimeout(() => {
      inputRef.current?.focus()
    }, 300)
  }

  const onSubmit = async () => {
    if (!anchor) {
      return
    }

    setIsSubmitting.on()

    const amountStr = DecimalUtil.toU64(
      amountInDecimal,
      OCT_TOKEN_DECIMALS
    ).toString()

    try {
      const wallet = await selector.wallet()
      if (type === "increase") {
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
                  amount: amountStr,
                  msg: !validatorId
                    ? '"IncreaseStake"'
                    : JSON.stringify({
                        IncreaseDelegation: {
                          validator_id: validatorId || "",
                        },
                      }),
                },
                gas: COMPLEX_CALL_GAS,
                deposit: "1",
              },
            },
          ],
        })
        onTxSent()
      } else {
        await wallet.signAndSendTransaction({
          signerId: accountId,
          receiverId: anchor.contractId,
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: !!validatorId
                  ? "decrease_delegation"
                  : "decrease_stake",
                args: !!validatorId
                  ? { amount: amountStr, validator_id: validatorId || "" }
                  : { amount: amountStr },
                gas: COMPLEX_CALL_GAS,
                deposit: "0",
              },
            },
          ],
        })
      }
      Toast.success("Submitted")
      setIsSubmitting.off()
      onTxSent()
    } catch (err: any) {
      Toast.error(err)
    }

    setIsSubmitting.off()
  }

  return (
    <Popover
      placement="bottom"
      initialFocusRef={initialFocusRef}
      onOpen={onOpen}
    >
      <PopoverTrigger>{trigger}</PopoverTrigger>
      <PopoverContent w="360px">
        <PopoverBody p={4}>
          <Heading fontSize="md">
            {(type === "increase" ? "Increase" : "Decrease") +
              (validatorId ? " Delegation" : " Stake")}
          </Heading>
          {helper ? (
            <Text variant="gray" mt={3}>
              {helper}
            </Text>
          ) : null}
          <Box mt={3} p={6}>
            {type === "increase" && (
              <Flex mb={2} justifyContent="flex-end">
                <Text variant="gray" size="sm">
                  OCT balance: {DecimalUtil.beautify(octBalance, 0)}
                </Text>
              </Flex>
            )}
            <Heading textAlign="center">
              {DecimalUtil.beautify(new Decimal(amount), 0)} OCT
            </Heading>
            {validatorId ? (
              <DelegateInput
                anchor={anchor}
                validatorId={validator?.validator_id}
                type={type}
                onChange={(v) => setAmount(v)}
                octBalance={octBalance}
                deposited={deposit}
              />
            ) : (
              <StakeInput
                anchor={anchor}
                validator={validator}
                type={type}
                onChange={(v) => setAmount(v)}
                octBalance={octBalance}
              />
            )}
          </Box>
          <Box mt={3}>
            <Button
              colorScheme="octo-blue"
              isDisabled={
                isSubmitting ||
                amountInDecimal.lte(ZERO_DECIMAL) ||
                (type === "increase" && amountInDecimal.gt(octBalance)) ||
                (type === "decrease" && amountInDecimal.gt(deposit))
              }
              onClick={onSubmit}
              isLoading={isSubmitting}
              width="100%"
            >
              {(type === "increase" && amountInDecimal.gt(octBalance)) ||
              (type === "decrease" && amountInDecimal.gt(deposit))
                ? `Insufficient ${type === "increase" ? "Balance" : "Deposit"}`
                : "Confirm"}
            </Button>
          </Box>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
}
