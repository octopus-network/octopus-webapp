import React, { useMemo } from "react"

import {
  Flex,
  Heading,
  HStack,
  Text,
  useBoolean,
  Table,
  Thead,
  Tbody,
  Button,
  Tr,
  Th,
  Td,
  Box,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react"

import { AnchorContract, UnbondedHistory } from "types"

import { BaseModal, Empty } from "components"
import { DecimalUtil, ZERO_DECIMAL } from "utils"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

import {
  FAILED_TO_REDIRECT_MESSAGE,
  COMPLEX_CALL_GAS,
  OCT_TOKEN_DECIMALS,
} from "primitives"
import { useWalletSelector } from "components/WalletSelectorContextProvider"

type RewardsModalProps = {
  stakes: UnbondedHistory[] | undefined
  anchor: AnchorContract | undefined
  isOpen: boolean
  onClose: () => void
}

dayjs.extend(relativeTime)

export const StakesModal: React.FC<RewardsModalProps> = ({
  isOpen,
  onClose,
  stakes,
  anchor,
}) => {
  const bg = useColorModeValue("#f6f7fa", "#15172c")

  const toast = useToast()
  const { accountId } = useWalletSelector()

  const [isWithdrawing, setIsWithdrawing] = useBoolean(false)

  const totalStakes = useMemo(
    () =>
      stakes?.length
        ? stakes?.reduce(
            (total, next) =>
              total.plus(
                DecimalUtil.fromString(next.amount, OCT_TOKEN_DECIMALS)
              ),
            ZERO_DECIMAL
          )
        : ZERO_DECIMAL,
    [stakes]
  )

  const withdrawableStakes = useMemo(() => {
    if (!stakes?.length) {
      return ZERO_DECIMAL
    }

    return stakes.reduce(
      (total, next) =>
        total.plus(
          dayjs(Math.floor((next.unlock_time as any) / 1e6)).diff() > 0
            ? 0
            : DecimalUtil.fromString(next.amount, OCT_TOKEN_DECIMALS)
        ),
      ZERO_DECIMAL
    )
  }, [stakes])

  const onWithdrawStakes = () => {
    setIsWithdrawing.on()
    anchor
      ?.withdraw_stake({ account_id: accountId! }, COMPLEX_CALL_GAS)
      .catch((err) => {
        setIsWithdrawing.off()
        if (err.message === FAILED_TO_REDIRECT_MESSAGE) {
          return
        }

        toast({
          position: "top-right",
          title: "Error",
          description: err.toString(),
          status: "error",
        })
      })
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxW="640px"
      title="Withdraw Stakes"
    >
      <Box p={4} bg={bg} borderRadius="lg">
        <Flex justifyContent="space-between" alignItems="center">
          <Text variant="gray">Total Unbonded Stakes</Text>
          <Heading fontSize="md">
            {DecimalUtil.beautify(totalStakes)} OCT
          </Heading>
        </Flex>
        <Flex justifyContent="space-between" alignItems="center" mt={3}>
          <Text variant="gray">Withdrawable Stakes</Text>
          <HStack>
            <Heading fontSize="md">
              {DecimalUtil.beautify(withdrawableStakes)} OCT
            </Heading>
            <Button
              colorScheme="octo-blue"
              size="sm"
              onClick={onWithdrawStakes}
              isLoading={isWithdrawing}
              isDisabled={withdrawableStakes.lte(ZERO_DECIMAL) || isWithdrawing}
            >
              Withdraw
            </Button>
          </HStack>
        </Flex>
      </Box>
      {stakes?.length ? (
        <Box maxH="40vh" overflow="scroll" mt={3}>
          <Table>
            <Thead>
              <Tr>
                <Th>Era</Th>
                <Th isNumeric>Amount</Th>
                <Th isNumeric>Unlock Time</Th>
              </Tr>
            </Thead>
            <Tbody>
              {stakes?.map((s, idx) => (
                <Tr
                  key={`tr-${idx}`}
                  opacity={
                    dayjs(Math.floor((s.unlock_time as any) / 1e6)).diff() > 0
                      ? 0.6
                      : 1
                  }
                >
                  <Td>{s.era_number}</Td>
                  <Td isNumeric>
                    {DecimalUtil.beautify(
                      DecimalUtil.fromString(s.amount, OCT_TOKEN_DECIMALS)
                    )}
                  </Td>
                  <Td isNumeric>
                    <Text>
                      {dayjs(
                        Math.floor((s.unlock_time as any) / 1e6)
                      ).fromNow()}
                    </Text>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      ) : (
        <Empty
          message="No Unbonded Stakes"
          helper="If you just unbonded your stakes, it will be displayed in next era."
        />
      )}
    </BaseModal>
  )
}
