import {
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  useBoolean,
  Tooltip,
  Text,
  Box,
  Input,
  Flex,
} from "@chakra-ui/react"
import { Toast } from "components/common/toast"
import Decimal from "decimal.js"
import { OCT_TOKEN_DECIMALS } from "primitives"
import { useEffect, useState } from "react"
import { AnchorContract, Validator } from "types"
import { DecimalUtil } from "utils"

export default function StakeInput({
  anchor,
  type,
  validator,
  onChange,
  octBalance,
}: {
  anchor?: AnchorContract
  type: "increase" | "decrease"
  validator?: Validator
  onChange: (amount: number) => void
  octBalance: Decimal
}) {
  const [min] = useState(0)
  const [max, setMax] = useState(10000)
  const [step, setStep] = useState(1)
  const [value, setValue] = useState(0)

  useEffect(() => {
    async function initSetting() {
      console.log("anchor", anchor)

      if (!anchor) return
      try {
        const protocolSettings = await anchor.get_protocol_settings()

        const _step = DecimalUtil.fromString(
          protocolSettings.minimum_validator_deposit_changing_amount,
          OCT_TOKEN_DECIMALS
        ).toNumber()

        setStep(_step)
        setValue(_step)
        if (validator) {
          if (type === "increase") {
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
              .minus(validator.total_stake)

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
            if (max >= _step) {
              onChange(_step)
            }
          } else {
            const maximumAllowedDecreased = new Decimal(
              validator.total_stake
            ).minus(protocolSettings.minimum_validator_deposit)

            const max = Math.floor(
              DecimalUtil.shift(
                maximumAllowedDecreased,
                OCT_TOKEN_DECIMALS
              ).toNumber()
            )

            setMax(max)
            if (max >= _step) {
              onChange(_step)
            }
          }
        }
      } catch (error) {
        Toast.error(error)
      }
    }

    initSetting()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor, validator, octBalance, type])

  const onChangeValue = (v: number) => {
    setValue(v)
    onChange(v)
  }

  return (
    <Box>
      {type === "increase" && (
        <Flex justify="flex-end">
          <Text
            fontSize="sm"
            cursor="pointer"
            variant="gray"
            onClick={() => {
              if (octBalance.gte(step) && octBalance.lte(max)) {
                onChangeValue(octBalance.toNumber())
              }
            }}
          >
            Balance: {DecimalUtil.beautify(octBalance, 0)}
          </Text>
        </Flex>
      )}
      <Input
        mt={2}
        value={value}
        onChange={(e) => {
          onChangeValue(Number(e.target.value))
        }}
        type="number"
        min={min}
        max={max}
        disabled={max < step}
      />
      <Flex justify="space-between" pt={2}>
        <Text
          fontSize="sm"
          cursor="pointer"
          onClick={() => onChangeValue(step)}
        >
          Min: {DecimalUtil.beautify(new Decimal(step), 0)}
        </Text>

        <Text fontSize="sm" cursor="pointer" onClick={() => onChangeValue(max)}>
          Max: {max < step ? "-" : DecimalUtil.beautify(new Decimal(max), 0)}
        </Text>
      </Flex>
    </Box>
  )
}
