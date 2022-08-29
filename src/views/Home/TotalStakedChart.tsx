import React, { useState, useMemo, useEffect, useCallback } from "react"
import { DecimalUtil } from "utils"
import useSWR from "swr"

import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"

import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Skeleton,
  Text,
} from "@chakra-ui/react"

import { OCT_TOKEN_DECIMALS } from "primitives"
import Decimal from "decimal.js"
import dayjs from "dayjs"
import { CategoricalChartState } from "recharts/types/chart/generateCategoricalChart"

const CustomTooltip = ({
  label,
  active,
  payload,
}: {
  label?: any
  active?: boolean
  payload?: any
}) => {
  if (active && payload && payload.length) {
    return (
      <Box>
        <Text>{label}</Text>
      </Box>
    )
  }
  return null
}

function toUIValue(val: number) {
  if (val > 1000000) {
    return DecimalUtil.beautify(new Decimal(val).div(1000000)) + "M"
  } else if (val > 1000) {
    return DecimalUtil.beautify(new Decimal(val).div(1000)) + "K"
  } else {
    return DecimalUtil.beautify(new Decimal(val))
  }
}

export const TotalStakedChart: React.FC = () => {
  const [days, setDays] = useState(7)

  const ticker = days
  const end = dayjs().format("YYYY-MM-DD")
  let start = ""
  if (ticker === 7) {
    start = dayjs().subtract(365, "day").format("YYYY-MM-DD")
  } else {
    start = dayjs().subtract(31, "day").format("YYYY-MM-DD")
  }
  const { data } = useSWR(
    `total-staked?start=${start}&end=${end}&ticker=${ticker}`
  )

  const [currentValue, setCurrentValue] = useState(0)

  const klineData = useMemo(() => {
    if (!data) return []

    return data.map(({ date, amount, octPrice }: any) => ({
      date,
      amount,
      uiValue: toUIValue(
        DecimalUtil.fromString(amount, OCT_TOKEN_DECIMALS).toNumber()
      ),
      value: DecimalUtil.fromString(amount, OCT_TOKEN_DECIMALS).toNumber(),
    }))
  }, [data])

  const lowestValue = useMemo(
    () =>
      klineData?.length ? Math.min(...klineData.map((k: any) => k.value)) : 0,
    [klineData]
  )

  const highestValue = useMemo(
    () =>
      klineData?.length ? Math.max(...klineData.map((k: any) => k.value)) : 0,
    [klineData]
  )

  useEffect(() => {
    if (klineData.length) {
      setCurrentValue(klineData[klineData.length - 1]?.value)
    } else {
      setCurrentValue(0)
    }
  }, [klineData])

  const onAreaMouseMove = useCallback(
    (nextState: CategoricalChartState, event: any) => {
      const { isTooltipActive, activePayload } = nextState
      if (isTooltipActive) {
        if (activePayload && activePayload.length) {
          const { value } = activePayload[0].payload
          setCurrentValue(value)
        }
      } else if (klineData.length) {
        setCurrentValue(klineData[klineData.length - 1]?.value)
      } else {
        setCurrentValue(0)
      }
    },
    [klineData]
  )

  const offset = (highestValue - lowestValue) / 4

  return (
    <Box>
      <Flex justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Skeleton isLoaded={klineData.length}>
            <Text fontSize="sm" color="gray">
              Total Staked $OCT
            </Text>
            <Heading fontSize="2xl">
              {DecimalUtil.beautify(new Decimal(currentValue), 0)}
            </Heading>
          </Skeleton>
          <HStack spacing={3} mt={8}></HStack>
        </Box>
        <HStack>
          <Button
            colorScheme={days === 7 ? "octo-blue" : "gray"}
            size="xs"
            borderRadius={2}
            onClick={() => setDays(7)}
          >
            Week
          </Button>
          <Button
            colorScheme={days === 1 ? "octo-blue" : "gray"}
            size="xs"
            borderRadius={2}
            onClick={() => setDays(1)}
          >
            Day
          </Button>
        </HStack>
      </Flex>
      <Skeleton isLoaded={klineData.length}>
        <Box height="252px" mt={0}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              width={500}
              height={300}
              data={klineData}
              onMouseMove={onAreaMouseMove}
            >
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1486ff" stopOpacity={0.5} />
                  <stop offset="90%" stopColor="#2468f2" stopOpacity={0} />
                </linearGradient>
              </defs>

              {[0, 1, 2, 3, 4].map((t) => {
                return (
                  <ReferenceLine
                    key={t}
                    y={lowestValue + offset * t}
                    stroke="rgba(0,0,0,0.1)"
                    strokeDasharray="3 3"
                  />
                )
              })}
              <XAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                dataKey="date"
                interval="preserveStartEnd"
                height={20}
              />
              <YAxis
                domain={[lowestValue, highestValue]}
                orientation="right"
                tickCount={3}
                padding={{ bottom: 20 }}
                tickFormatter={(val) => toUIValue(val)}
                tick={{ fontSize: 13 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={0}
              />
              <Tooltip position={{ y: 0 }} content={<CustomTooltip />} />
              <Area
                type="monotone"
                strokeWidth={2}
                dataKey="value"
                stroke="#2468f2"
                fill="url(#colorPrice)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </Skeleton>
    </Box>
  )
}
