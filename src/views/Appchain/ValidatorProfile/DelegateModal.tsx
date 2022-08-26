import React, { useState, useEffect, useMemo } from "react"
import useSWR from "swr"

import {
  Text,
  Button,
  Box,
  Flex,
  useBoolean,
  Heading,
  Input,
} from "@chakra-ui/react"

import { BaseModal } from "components"

import { OCT_TOKEN_DECIMALS, COMPLEX_CALL_GAS } from "primitives"

import { AnchorContract } from "types"
import { ZERO_DECIMAL, DecimalUtil } from "utils"
import { useWalletSelector } from "components/WalletSelectorContextProvider"
import { Toast } from "components/common/toast"
import DelegateInput from "components/AppChain/DelegateInput"
import { onTxSent } from "utils/helper"
import Decimal from "decimal.js"

type DelegateModalProps = {
  isOpen: boolean
  anchor?: AnchorContract
  onClose: () => void
  validatorId: string
}

export const DelegateModal: React.FC<DelegateModalProps> = ({
  isOpen,
  onClose,
  validatorId,
  anchor,
}) => {
  const [min] = useState(0)
  const [max, setMax] = useState(0)
  const [step, setStep] = useState(1)
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
    async function initSetting() {
      if (!anchor) return
      try {
        const protocolSettings = await anchor.get_protocol_settings()

        const _step = DecimalUtil.fromString(
          protocolSettings.minimum_delegator_deposit,
          OCT_TOKEN_DECIMALS
        ).toNumber()

        setStep(_step)
        if (validatorId) {
          const validatorDeposited = await anchor.get_validator_deposit_of({
            validator_id: validatorId,
          })

          const anchorStatus = await anchor.get_anchor_status()
          const validatorSetInfo = await anchor.get_validator_set_info_of({
            era_number:
              anchorStatus.index_range_of_validator_set_history.end_index,
          })

          const maximumAllowedIncreased = new Decimal(
            validatorSetInfo.total_stake
          )
            .mul(protocolSettings.maximum_validator_stake_percent)
            .div(100)
            .minus(validatorDeposited)

          const max = Math.min(
            Math.floor(
              DecimalUtil.shift(
                maximumAllowedIncreased,
                OCT_TOKEN_DECIMALS
              ).toNumber()
            ),
            octBalance.toNumber()
          )

          setMax(max)
        }
      } catch (error) {
        Toast.error(error)
      }
    }

    initSetting()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor, validatorId, octBalance])

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
      onTxSent()
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
      <Box mt={3} p={1}>
        <Flex justify="flex-end">
          <Text
            fontSize="sm"
            cursor="pointer"
            variant="gray"
            onClick={() => {
              if (octBalance.gte(step) && octBalance.lte(max)) {
                setAmount(octBalance.toString())
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
            setAmount(e.target.value)
          }}
          type="number"
          min={min}
          max={max}
        />
        <Flex justify="space-between" pt={2}>
          <Text
            fontSize="sm"
            cursor="pointer"
            onClick={() => {
              if (octBalance.gte(step)) {
                setAmount(String(step))
              }
            }}
          >
            Min: {DecimalUtil.beautify(new Decimal(step), 0)}
          </Text>

          <Text
            fontSize="sm"
            cursor="pointer"
            onClick={() => {
              if (octBalance.gte(max)) {
                setAmount(String(max))
              }
            }}
          >
            Max: {max < step ? "-" : DecimalUtil.beautify(new Decimal(max), 0)}
          </Text>
        </Flex>
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
  )
}
