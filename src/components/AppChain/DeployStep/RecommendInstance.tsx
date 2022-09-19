import { Divider, Flex, Text } from "@chakra-ui/react"
import { CLOUD_NODE_INSTANCES } from "config/constants"
import { CloudVendor, OCTNetwork } from "types"

export default function RecommendInstance({
  appchainId,
  cloudVendor,
}: {
  appchainId?: string
  cloudVendor: CloudVendor
}) {
  if (!appchainId) {
    return null
  }
  const instance = (CLOUD_NODE_INSTANCES[appchainId] ||
    CLOUD_NODE_INSTANCES[OCTNetwork.BARNANCLE_0918])[cloudVendor]

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
