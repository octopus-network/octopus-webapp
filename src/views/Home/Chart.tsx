import React, { useState, useEffect, useRef, useCallback } from 'react';
import dayjs from 'dayjs';
import axios from 'axios';

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

export const Chart: React.FC = () => {

  const [days, setDays] = useState(7);

  let lowestPrice = useRef(999999), highestPrice = useRef(0);
  const [currentTimePrice, setCurrentTimePrice] = useState([0, 0]);
  const [lastTimePrice, setLastTimePrice] = useState([0, 0]);

  const [changedPercent, setChangedPercent] = useState(0);

  const [prices, setPrices] = useState([]);
  const [klineData, setKlineData] = useState<any[]>([]);

  const [marketChart, setMarketChart] = useState<any>();

  useEffect(() => {
    axios
      .get(`https://api.coingecko.com/api/v3/coins/octopus-network/market_chart?vs_currency=usd&days=${days}`)
      .then(res => res.data)
      .then(data => {
        setMarketChart(data);
      });
  }, [days]);

  useEffect(() => {
    if (!marketChart) {
      setKlineData([]);
      return;
    }
    const { prices } = marketChart;
    setPrices(prices);
  }, [marketChart]);

  useEffect(() => {
  
    const tmpArr = prices.map(([time, price]) => {
      if (price < lowestPrice) {
        lowestPrice = price;
      }
      if (price > highestPrice) {
        highestPrice = price;
      }
      return {
        humanTime: dayjs(time).format('HH:MM A'),
        time,
        price
      }
    });

    setKlineData(tmpArr);
    
    if (prices.length) {
      setCurrentTimePrice(prices[prices.length - 1]);
      setLastTimePrice(prices[0]);
    } else {
      setCurrentTimePrice([0, 0]);
      setLastTimePrice([0, 0]);
    }
    
  }, [prices]);

  useEffect(() => {
    if (lastTimePrice[1] === 0) {
      setChangedPercent(0);
    } else {
      setChangedPercent(
        (currentTimePrice[1]-lastTimePrice[1])*100/lastTimePrice[1]
      );
    }
    
  }, [lastTimePrice, currentTimePrice]);

  const changeDays = (v: any) => {
    setPrices([]);
    setTimeout(() => {
      setDays(v);
    }, 100);
  }

  const onAreaMouseMove = useCallback(({ isTooltipActive, activePayload }) => {
    if (isTooltipActive) {
      if (activePayload && activePayload.length) {
        const { price, time } = activePayload[0].payload;
        setCurrentTimePrice([time, price]);
      }
    } else if (prices.length) {
      setCurrentTimePrice(prices[prices.length - 1]);
    } else {
      setCurrentTimePrice([0, 0]);
    }
  }, [prices]);

  return (
    
    <Box>
      <Flex justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Heading fontSize="2xl">$73,719.20</Heading>
          <HStack spacing={3} mt={2}>
            <Text variant="gray">Total Staked OCT</Text>
            {
              changedPercent !== 0 &&
              <Flex color={changedPercent < 0 ? 'red' : '#2468f2' } alignItems="center" fontSize="sm">
                {changedPercent < 0 ? <TriangleDownIcon /> : <TriangleUpIcon /> }
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
      <Skeleton isLoaded={prices.length > 0}>
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
                <stop offset="5%" stopColor="#1486ff" stopOpacity={0.5}/>
                <stop offset="90%" stopColor="#2468f2" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <YAxis hide={true} domain={[lowestPrice.current, highestPrice.current]} />
            <XAxis axisLine={false} tickLine={false} minTickGap={150} tick={{ fontSize: 14 }}
              dataKey="humanTime" interval="preserveStartEnd" />
            <Tooltip position={{ y: 0 }} content={<CustomTooltip />} />
            <Area type="monotone" strokeWidth={2} dataKey="price"
              stroke="#2468f2" fill="url(#colorPrice)" />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
      </Skeleton>
    </Box>
  );
}
