import React from "react"

import {
  Box,
  Flex,
  Text,
  VStack,
  Icon,
  Progress,
  Divider,
  HStack,
} from "@chakra-ui/react"

import { BaseModal } from "components"
import { FiCpu } from "react-icons/fi"
import { FaMemory } from "react-icons/fa"
import { GrStorage } from "react-icons/gr"

type Props = {
  isOpen: boolean
  onClose: VoidFunction
  metrics: any
}

export const InstanceInfoModal: React.FC<Props> = ({
  metrics,
  isOpen,
  onClose,
}) => {
  if (!metrics || metrics?.Code === "NotFoundError") {
    return null
  }
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Instance Info">
      <Box p={4}>
        <Flex justifyContent="space-between">
          <HStack>
            <Icon as={FiCpu} />
            <Text>CPU(s)</Text>
          </HStack>
          <VStack spacing={0}>
            {metrics
              ? Object.keys(metrics?.cpu).map((c: any, idx: number) => (
                  <HStack key={`cpu-${idx}`}>
                    <Box w="160px">
                      <Progress
                        value={metrics.cpu[c].percentage * 100}
                        colorScheme={
                          metrics.cpu[c].percentage > 0.9 ? "red" : "blue"
                        }
                        size="sm"
                        borderRadius="lg"
                      />
                    </Box>
                    <Text fontSize="xs" color="gray">
                      {(metrics.cpu[c].percentage * 100).toFixed(2)}%
                    </Text>
                  </HStack>
                ))
              : null}
          </VStack>
        </Flex>
        <Divider mt={4} mb={4} />
        <Flex justifyContent="space-between">
          <HStack>
            <Icon as={FaMemory} />
            <Text>RAM</Text>
          </HStack>
          <HStack>
            <Box w="160px">
              <Progress
                value={metrics?.memory.percentage * 100}
                colorScheme={metrics?.memory.percentage > 0.9 ? "red" : "blue"}
                size="sm"
                borderRadius="lg"
              />
            </Box>
            <Text fontSize="xs" color="gray">
              {(metrics?.memory.percentage * 100).toFixed(2)}%
            </Text>
          </HStack>
        </Flex>
        <Divider mt={4} mb={4} />
        <Flex justifyContent="space-between">
          <HStack>
            <Icon as={GrStorage} />
            <Text>Storage</Text>
          </HStack>
          <HStack>
            <Box w="160px">
              <Progress
                value={metrics?.filesystem.percentage * 100}
                colorScheme={
                  metrics?.filesystem.percentage > 0.9 ? "red" : "blue"
                }
                size="sm"
                borderRadius="lg"
              />
            </Box>
            <Text fontSize="xs" color="gray">
              {(metrics?.filesystem.percentage * 100).toFixed(2)}%
            </Text>
          </HStack>
        </Flex>
      </Box>
    </BaseModal>
  )
}
