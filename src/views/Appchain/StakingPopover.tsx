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

import { AmountInput } from "components"
import { DecimalUtil, ZERO_DECIMAL } from "utils"
import Decimal from "decimal.js"
import { validateValidatorStake } from "utils/validate"
import { useWalletSelector } from "components/WalletSelectorContextProvider"
import { Toast } from "components/common/toast"
import StakeInput from "components/common/StakeInput"
import { parseNearAmount } from "near-api-js/lib/utils/format"

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
    () => DecimalUtil.fromNumber(amount),
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
        const type = !validatorId ? "IncreaseStake" : "IncreaseDelegation"
        await validateValidatorStake(
          anchor,
          DecimalUtil.fromString(amountStr),
          type,
          validator,
          appchain
        )
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
      } else {
        const type = !validatorId ? "DecreaseStake" : "DecreaseDelegation"
        await validateValidatorStake(
          anchor,
          DecimalUtil.fromString(amountStr),
          type,
          validator,
          appchain
        )
        await wallet.signAndSendTransaction({
          signerId: accountId,
          receiverId: octToken?.contractId,
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
                deposit: "1",
              },
            },
          ],
        })
      }
      Toast.success("Submitted")
      setIsSubmitting.off()
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
          <Box mt={3} gap={3} p={3}>
            {type === "increase" && (
              <Flex mb={2} justifyContent="flex-end">
                <Text variant="gray" size="sm">
                  OCT balance: {octBalance.toFixed(0)}
                </Text>
              </Flex>
            )}
            <AmountInput
              placeholder="Amount of OCT"
              refObj={inputRef}
              value={`${amount}`}
              type="number"
            />
            <StakeInput
              anchor={anchor}
              appchain={appchain}
              validator={validator}
              type={type}
              onChange={(v) => setAmount(v)}
              octBalance={octBalance}
            />
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
              {amountInDecimal.lte(ZERO_DECIMAL)
                ? "Input Amount"
                : (type === "increase" && amountInDecimal.gt(octBalance)) ||
                  (type === "decrease" && amountInDecimal.gt(deposit))
                ? `Insufficient ${type === "increase" ? "Balance" : "Deposit"}`
                : type === "increase"
                ? "Increase"
                : "Decrease"}
            </Button>
          </Box>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
}
