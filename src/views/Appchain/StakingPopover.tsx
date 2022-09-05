import React, { useState, useMemo, useEffect } from "react"
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
  Input,
} from "@chakra-ui/react"

import { AnchorContract, AppchainInfoWithAnchorStatus, Validator } from "types"

import { COMPLEX_CALL_GAS, OCT_TOKEN_DECIMALS } from "primitives"

import { DecimalUtil, ZERO_DECIMAL } from "utils"
import Decimal from "decimal.js"
import { useWalletSelector } from "components/WalletSelectorContextProvider"
import { Toast } from "components/common/toast"
import { onTxSent } from "utils/helper"
import { getDelegateLimit, getStakeLimit } from "utils/delegate"

type StakingPopoverProps = {
  type: "increase" | "decrease"
  deposited?: Decimal
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
  deposited = ZERO_DECIMAL,
  anchor,
  validatorId,
  validator,
  appchain,
}) => {
  const initialFocusRef = React.useRef<any>()

  const inputRef = React.useRef<any>()
  const [min, setMin] = useState(0)
  const [max, setMax] = useState(0)
  const [amount, setAmount] = useState("")

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

  useEffect(() => {
    if (!anchor) return
    if (validatorId) {
      getDelegateLimit({
        type,
        validatorId,
        anchor,
        octBalance,
        deposited,
      }).then(({ min, max }) => {
        setMin(min)
        setMax(max)
      })
    } else if (validator) {
      getStakeLimit({
        type,
        validatorId: validator.validator_id,
        anchor,
        octBalance,
      }).then(({ min, max }) => {
        setMin(min)
        setMax(max)
      })
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor, validator, octBalance, type, deposited, validatorId])

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

    const octAmount = DecimalUtil.shift(octBalance, OCT_TOKEN_DECIMALS)
    let amountStr = DecimalUtil.toU64(
      amountInDecimal,
      OCT_TOKEN_DECIMALS
    ).toString()
    if (octAmount.lt(amountStr)) {
      amountStr = octAmount.toString()
    }

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

  const isDisabled = max <= min

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
          <Box mt={3} p={1}>
            {type === "increase" && (
              <Flex justify="flex-end">
                <Text
                  fontSize="sm"
                  cursor="pointer"
                  variant="gray"
                  onClick={() => {
                    if (octBalance.gte(min) && octBalance.lte(max)) {
                      setAmount(octBalance.toString())
                    }
                  }}
                >
                  Balance: {DecimalUtil.beautify(octBalance, 0)}
                </Text>
              </Flex>
            )}
            <Input
              mt={2}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
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
                  if (octBalance.gte(min) && !isDisabled) {
                    setAmount(String(min))
                  }
                }}
              >
                Min: {DecimalUtil.beautify(new Decimal(min), 0)}
              </Text>

              <Text
                fontSize="sm"
                cursor="pointer"
                onClick={() => {
                  if (isDisabled) return
                  if (type === "decrease") {
                    setAmount(String(max))
                  } else if (octBalance.gte(max)) {
                    setAmount(String(max))
                  }
                }}
              >
                Max:{" "}
                {isDisabled ? "-" : DecimalUtil.beautify(new Decimal(max), 0)}
              </Text>
            </Flex>
            <Text variant="gray" fontSize="sm" mt={2}>
              {isDisabled
                ? `According to the rule of staking ration, you can't ${type}`
                : ""}
            </Text>
          </Box>
          <Box mt={3}>
            <Button
              colorScheme="octo-blue"
              isDisabled={
                isSubmitting ||
                !(Number(amount) >= min && Number(amount) <= max)
              }
              onClick={onSubmit}
              isLoading={isSubmitting}
              width="100%"
            >
              Confirm
            </Button>
          </Box>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
}
