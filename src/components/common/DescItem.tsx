import { VStack, Text, Skeleton, Heading, HStack } from "@chakra-ui/react"

export default function DescItem({
  title,
  value,
  isLoaded,
  titleExtra,
}: {
  title: string
  value: any
  isLoaded: boolean
  titleExtra?: any
}) {
  return (
    <VStack alignItems="flex-start">
      <HStack>
        <Text variant="gray" fontSize="sm">
          {title}
        </Text>
        {titleExtra}
      </HStack>
      <Skeleton isLoaded={isLoaded} w="100%">
        {["string", "number"].includes(typeof value) ? (
          <Heading fontSize="xl">{value}</Heading>
        ) : (
          value
        )}
      </Skeleton>
    </VStack>
  )
}
