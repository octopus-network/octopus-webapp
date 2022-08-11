import {
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Box,
  SliderMark,
  useBoolean,
  Tooltip,
} from "@chakra-ui/react"
import Decimal from "decimal.js"
import { OCT_TOKEN_DECIMALS } from "primitives"
import { useEffect, useState } from "react"
import { AnchorContract, AppchainInfoWithAnchorStatus, Validator } from "types"
import { DecimalUtil } from "utils"

export default function StakeInput({
  anchor,
  type,
  appchain,
  validator,
  onChange,
  octBalance,
}: {
  anchor?: AnchorContract
  type: "increase" | "decrease"
  appchain?: AppchainInfoWithAnchorStatus
  validator?: Validator
  onChange: (amount: number) => void
  octBalance: Decimal
}) {
  const [min, setMin] = useState(0)
  const [max, setMax] = useState(10000)
  const [step, setStep] = useState(1)
  const [showTooltip, setShowTooltip] = useBoolean()
  const [value, setValue] = useState(0)

  useEffect(() => {
    async function initSetting() {
      if (!anchor) return
      try {
        const protocolSettings = await anchor.get_protocol_settings()
        const _step = DecimalUtil.fromString(
          protocolSettings.minimum_validator_deposit_changing_amount,
          OCT_TOKEN_DECIMALS
        ).toNumber()

        setStep(_step)
        setValue(_step)
        onChange(_step)

        if (appchain && validator) {
          const maximumAllowedDeposit = DecimalUtil.fromString(
            appchain?.total_stake,
            OCT_TOKEN_DECIMALS
          )
            .mul(protocolSettings.maximum_validator_stake_percent)
            .div(100)
            .toNumber()

          const totalStale = DecimalUtil.fromString(
            validator.total_stake,
            OCT_TOKEN_DECIMALS
          ).toNumber()

          setMax(
            Math.min(
              maximumAllowedDeposit - totalStale,
              DecimalUtil.shift(octBalance, OCT_TOKEN_DECIMALS)
            )
          )
        }
      } catch (error) {}
    }

    if (anchor) {
      initSetting()
    }
  }, [anchor, appchain, validator])

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
        {max}
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
