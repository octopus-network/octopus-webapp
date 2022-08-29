import React from "react"
import useSWR from "swr"

import {
  Container,
  BoxProps,
  Flex,
  Text,
  Skeleton,
  Heading,
  useColorModeValue,
  Box,
  SimpleGrid,
} from "@chakra-ui/react"

import { TotalStakedChart } from "./TotalStakedChart"
import { DecimalUtil } from "utils"
import { useNavigate } from "react-router-dom"
import { OCT_TOKEN_DECIMALS } from "primitives"
import Decimal from "decimal.js"

const Card: React.FC<
  BoxProps & {
    to?: string
  }
> = ({ children, to, ...restProps }) => {
  const bg = useColorModeValue("white", "#25263c")
  const navigate = useNavigate()

  const innerBg = useColorModeValue(
    "linear-gradient(180deg, #f4f5fb, #ffffff)",
    "linear-gradient(180deg, #0f1025 0%, #25263c)"
  )

  return (
    <Box
      p="1px"
      bg={bg}
      borderRadius="lg"
      boxShadow="0px 0px 30px 0px rgba(0,29,97,0.10)"
      {...restProps}
      onClick={() => (to ? navigate(to) : null)}
    >
      <Box
        p={6}
        borderRadius="lg"
        bg={innerBg}
        transition="all .3s ease"
        _hover={to ? { cursor: "pointer", filter: "brightness(110%)" } : {}}
      >
        {children}
      </Box>
    </Box>
  )
}

export const Overview: React.FC = () => {
  const { data } = useSWR("overview")

  return (
    <Container>
      <SimpleGrid gap={4} mt={1} columns={{ base: 1, md: 4 }}>
        <Card to="/appchains">
          <Flex alignItems="center">
            <Box ml={5} flex={1}>
              <Skeleton isLoaded={!!data}>
                <Heading fontSize="3xl">
                  {data?.runningAppchains.length || "loading"}
                </Heading>
              </Skeleton>
              <Flex
                alignItems="center"
                mt={2}
                justifyContent="space-between"
                position="relative"
              >
                <Text variant="gray" fontSize="1xl">
                  Living Appchains
                </Text>
              </Flex>
            </Box>
          </Flex>
        </Card>
        <Card>
          <Flex alignItems="center">
            <Box ml={5}>
              <Skeleton isLoaded={!!data}>
                <Heading fontSize="3xl">
                  {data
                    ? "$" +
                      DecimalUtil.beautify(
                        DecimalUtil.fromString(data.totalAnnualizedFee),
                        0
                      )
                    : "loading"}
                </Heading>
              </Skeleton>
              <Text variant="gray" fontSize="1xl" mt={2}>
                Total Annualized Fee
              </Text>
            </Box>
          </Flex>
        </Card>

        <Card>
          <Flex alignItems="center">
            <Box ml={5} flex={1}>
              <Skeleton isLoaded={!!data}>
                <Heading fontSize="3xl">
                  {data?.validatorsCount || "loading"}
                </Heading>
              </Skeleton>
              <Flex
                alignItems="center"
                mt={2}
                justifyContent="space-between"
                position="relative"
              >
                <Text variant="gray" fontSize="1xl">
                  Total Nodes
                </Text>
              </Flex>
            </Box>
          </Flex>
        </Card>

        <Card>
          <Flex alignItems="center">
            <Box ml={5} flex={1}>
              <Skeleton isLoaded={!!data}>
                <Heading fontSize="3xl">
                  {!!data
                    ? new Decimal(data.totalAnnualizedFee)
                        .div(
                          DecimalUtil.fromString(
                            data.totalStakedAmount,
                            OCT_TOKEN_DECIMALS
                          ).mul(data.octPrice)
                        )
                        .mul(100)
                        .toFixed(1) + "%"
                    : "loading"}
                </Heading>
              </Skeleton>
              <Flex
                alignItems="center"
                mt={2}
                justifyContent="space-between"
                position="relative"
              >
                <Text variant="gray" fontSize="1xl">
                  Average Staking Return
                </Text>
              </Flex>
            </Box>
          </Flex>
        </Card>
      </SimpleGrid>
      <Card mt={4}>
        <TotalStakedChart />
      </Card>
    </Container>
  )
}
