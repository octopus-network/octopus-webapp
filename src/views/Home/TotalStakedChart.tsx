import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { DecimalUtil } from 'utils'
import useSWR from 'swr'

import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  YAxis,
  ResponsiveContainer,
} from 'recharts'

import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Skeleton,
  Text,
} from '@chakra-ui/react'

import { TriangleUpIcon, TriangleDownIcon } from '@chakra-ui/icons'

import { OCT_TOKEN_DECIMALS } from 'primitives'
import Decimal from 'decimal.js'

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
    return DecimalUtil.beautify(new Decimal(val).div(1000000)) + 'M'
  } else if (val > 1000) {
    return DecimalUtil.beautify(new Decimal(val).div(1000)) + 'K'
  } else {
    return DecimalUtil.beautify(new Decimal(val))
  }
}

export const TotalStakedChart: React.FC = () => {
  const [days, setDays] = useState(1)

  const { data } = useSWR(`total-staked/${days}`)

  const [currentValue, setCurrentValue] = useState(0)
  const [lastValue, setLastValue] = useState(0)

  const [changedPercent, setChangedPercent] = useState(0)

  const klineData = useMemo(() => {
    if (!data) return []

    console.log(data)
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
      setLastValue(klineData[0]?.value)
    } else {
      setCurrentValue(0)
      setLastValue(0)
    }
  }, [klineData])

  useEffect(() => {
    if (lastValue === 0) {
      setChangedPercent(0)
    } else {
      setChangedPercent(((currentValue - lastValue) * 100) / lastValue)
    }
  }, [currentValue, lastValue])

  const onAreaMouseMove = useCallback(
    ({ isTooltipActive, activePayload }) => {
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

  return (
    <Box>
      <Flex justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Skeleton isLoaded={klineData.length}>
            <Heading fontSize="2xl">
              {DecimalUtil.beautify(new Decimal(currentValue))}
            </Heading>
          </Skeleton>
          <HStack spacing={3} mt={8}></HStack>
        </Box>
        <HStack>
          <Button
            colorScheme={days === 1 ? 'octo-blue' : 'gray'}
            size="xs"
            onClick={() => setDays(1)}
          >
            Day
          </Button>
          <Button
            colorScheme={days === 7 ? 'octo-blue' : 'gray'}
            size="xs"
            onClick={() => setDays(7)}
          >
            Week
          </Button>
        </HStack>
      </Flex>
      <Skeleton isLoaded={klineData.length}>
        <Box height="120px" mt={4}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              width={500}
              height={120}
              data={klineData}
              onMouseMove={onAreaMouseMove}
            >
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1486ff" stopOpacity={0.5} />
                  <stop offset="90%" stopColor="#2468f2" stopOpacity={0} />
                </linearGradient>
              </defs>

              <XAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 13 }}
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
