import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import dayjs from 'dayjs';
import axios from 'axios';
import { DecimalUtil } from 'utils';

import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  YAxis,
  ResponsiveContainer,
} from 'recharts';

import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  Heading,
  HStack,
  Skeleton,
  Text,
} from '@chakra-ui/react';

import {
  TriangleUpIcon,
  TriangleDownIcon
} from '@chakra-ui/icons';

import { OCT_TOKEN_DECIMALS } from 'config';
import Decimal from 'decimal.js';

type ChartProps = {
  data: any;
}

const CustomTooltip = ({
  label,
  active,
  payload
}: {
  label?: any;
  active?: boolean;
  payload?: any;
}) => {

  if (active && payload && payload.length) {
    return (
      <Box>
        <Text>{label}</Text>
      </Box>
    );
  }
  return null;
}

export const Chart: React.FC<ChartProps> = ({ data }) => {

  const [days, setDays] = useState(7);

  const [currentValue, setCurrentValue] = useState(0);
  const [lastValue, setLastValue] = useState(0);

  const [changedPercent, setChangedPercent] = useState(0);

  const [prices, setPrices] = useState([]);

  const klineData = useMemo(() => {
    if (!data) return [];
    
    return data.map(({ date, amount, octPrice }: any) => ({
      date,
      amount,
      value: DecimalUtil.fromString(amount, OCT_TOKEN_DECIMALS).mul(octPrice).toNumber()
    }));

  }, [data]);

  const lowestValue = useMemo(() => klineData?.length ? Math.min(klineData.map((k: any) => k.value)) : 0, [klineData]);

  const highestValue = useMemo(() => klineData?.length ? Math.max(klineData.map((k: any) => k.value)) : 0, [klineData]);

  useEffect(() => {
    if (klineData.length) {
      setCurrentValue(klineData[klineData.length - 1]?.value);
      setLastValue(klineData[0]?.value);
    } else {
      setCurrentValue(0);
      setLastValue(0);
    }

  }, [klineData]);

  useEffect(() => {
    if (lastValue === 0) {
      setChangedPercent(0);
    } else {
      setChangedPercent(
        (currentValue - lastValue) * 100 / lastValue
      );
    }
  }, [currentValue, lastValue]);

  const changeDays = (v: any) => {
    setPrices([]);
    setTimeout(() => {
      setDays(v);
    }, 100);
  }

  const onAreaMouseMove = useCallback(({ isTooltipActive, activePayload }) => {
    if (isTooltipActive) {
      if (activePayload && activePayload.length) {
        const { value } = activePayload[0].payload;
        setCurrentValue(value);
      }
    } else if (klineData.length) {
      setCurrentValue(klineData[klineData.length - 1]?.value);
    } else {
      setCurrentValue(0);
    }
  }, [klineData]);

  return (

    <Box>
      <Flex justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Skeleton isLoaded={klineData.length}>
            <Heading fontSize="2xl">${DecimalUtil.beautify(new Decimal(currentValue))}</Heading>
          </Skeleton>
          <HStack spacing={3} mt={2}>
            <Text variant="gray">Total Staked OCT</Text>
            {
              changedPercent !== 0 &&
              <Flex color={changedPercent < 0 ? 'red' : '#2468f2'} alignItems="center" fontSize="sm">
                {changedPercent < 0 ? <TriangleDownIcon /> : <TriangleUpIcon />}
                <Text ml="1">{changedPercent.toFixed(2)}%</Text>
              </Flex>
            }
          </HStack>
        </Box>
        <HStack>
          <Button className="octo-linear-button" size="xs">Day</Button>
          <Button size="xs">Week</Button>
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
              <YAxis hide={true} domain={[lowestValue, highestValue]} />
              <XAxis axisLine={false} tickLine={false} tick={{ fontSize: 14 }}
                dataKey="date" interval="preserveStartEnd" />
              <Tooltip position={{ y: 0 }} content={<CustomTooltip />} />
              <Area type="monotone" strokeWidth={2} dataKey="value"
                stroke="#2468f2" fill="url(#colorPrice)" />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </Skeleton>
    </Box>
  );
}
