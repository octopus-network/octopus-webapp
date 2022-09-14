import { Divider, Flex, Text } from "@chakra-ui/react"
import useSWR from "swr"

export default function RecommendInstance({
  appchainId,
}: {
  appchainId?: string
}) {
  const { data: instance } = useSWR(
    appchainId ? `appchain/${appchainId}/recommend-instance` : null
  )

  if (!instance) {
    return null
  }

  return (
    <Flex direction="column" gap={2}>
      <Text fontWeight="bold">Instance</Text>
      <Flex direction="row" justify="space-between" gap={2}>
        <Flex direction="row" gap={2}>
          <Text variant="gray">Type:</Text>
          <Text>{instance.type.desc}</Text>
        </Flex>
        <Text>
          ${instance.type.price}/{instance.type.unit}
        </Text>
      </Flex>

      <Flex direction="row" justify="space-between" gap={2}>
        <Flex direction="row" gap={2}>
          <Text variant="gray">Storage:</Text>
          <Text>{instance.storage.desc}</Text>
        </Flex>
        <Text>
          ${instance.storage.price}/{instance.storage.unit}
        </Text>
      </Flex>

      <Flex direction="row" justify="space-between" gap={2}>
        <Flex direction="row" gap={2}>
          <Text variant="gray">Data Transfer:</Text>
          <Text>{instance.dataTransfer.desc}</Text>
        </Flex>
        <Text>
          ${instance.dataTransfer.price}/{instance.dataTransfer.unit}
        </Text>
      </Flex>
      <Divider />
      <Flex direction="row" justify="flex-end" gap={2}>
        <Text variant="gray">Estimated cost:</Text>
        <Text>
          ${instance.total.price}/{instance.total.unit}
        </Text>
      </Flex>
    </Flex>
  )
}
