import {
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  useBoolean,
  Tooltip,
  Text,
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
  const [showTooltip, setShowTooltip] = useBoolean()
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

  if (max < step) {
    return (
      <Text mt={2} textAlign="center">
        You can't {type} more
      </Text>
    )
  }
  return (
    <Slider
      aria-label="slider-ex-4"
      defaultValue={30}
      min={min}
      max={max}
      step={1}
      onMouseEnter={setShowTooltip.on}
      onMouseLeave={setShowTooltip.off}
      value={value}
      onChange={(v) => {
        const _v = v > step ? v : step
        setValue(_v)
        onChange(_v)
      }}
    >
      <SliderMark value={0} mt="1" ml="-2.5" fontSize="sm">
        0
      </SliderMark>
      <SliderMark value={max} mt="1" ml="-2.5" fontSize="sm">
        {DecimalUtil.beautify(new Decimal(max), 0)}
      </SliderMark>
      <SliderTrack bg="red.100">
        <SliderFilledTrack bg="tomato" />
      </SliderTrack>
      <Tooltip
        hasArrow
        bg="teal.500"
        color="white"
        placement="top"
        isOpen={showTooltip}
        label={`${value}`}
      >
        <SliderThumb />
      </Tooltip>
    </Slider>
  )
}
