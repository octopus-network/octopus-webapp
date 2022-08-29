import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types"
import { Box, Heading, HStack, Text, VStack } from "@chakra-ui/react"
import OctIdenticon from "./OctIdenticon"

export default function AccountItem({
  account,
}: {
  account: InjectedAccountWithMeta
}) {
  return (
    <HStack w="calc(100% - 100px)">
      <Box width={"40px"} height={"40px"}>
        <OctIdenticon value={account.address} size={40} />
      </Box>
      <VStack spacing={1} alignItems="flex-start" w="100%">
        <Heading fontSize="lg">{account.meta?.name || "No Name"}</Heading>
        <Text
          variant="gray"
          fontSize="sm"
          w="100%"
          whiteSpace="nowrap"
          overflow="hidden"
          textOverflow="ellipsis"
        >
          {account.address}
        </Text>
      </VStack>
    </HStack>
  )
}
