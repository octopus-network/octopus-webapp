import { ChevronDownIcon } from "@chakra-ui/icons"
import {
  Avatar,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Image,
  Skeleton,
  Text,
  useBoolean,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react"
import nearLogo from "assets/near.svg"
import { AmountInput } from "components/AmountInput"
import { useEffect, useState } from "react"
import { AppchainInfoWithAnchorStatus, Collectible, TokenAsset } from "types"

export default function TokenInpput({
  chain,
  appchain,
  from,
}: {
  chain: string
  appchain?: AppchainInfoWithAnchorStatus
  from: string
}) {
  const bg = useColorModeValue("white", "#15172c")
  const grayBg = useColorModeValue("#f2f4f7", "#1e1f34")
  const [amount, setAmount] = useState("")
  const [tokenAsset, setTokenAsset] = useState<TokenAsset>()
  const [collectible, setCollectible] = useState<Collectible>()
  const [isAmountInputFocused, setIsAmountInputFocused] = useBoolean()
  const [selectTokenModalOpen, setSelectTokenModalOpen] = useBoolean()

  useEffect(() => {}, [])
  return (
    <Box
      borderWidth={1}
      p={4}
      borderColor={isAmountInputFocused ? "#2468f2" : grayBg}
      bg={isAmountInputFocused ? bg : grayBg}
      borderRadius="lg"
      pt={2}
      mt={6}
    >
      <Flex alignItems="center" justifyContent="space-between" minH="25px">
        <Heading fontSize="md" className="octo-gray">
          Bridge Asset
        </Heading>
        {fromAccount && !collectible ? (
          <Skeleton
            isLoaded={
              !isLoadingBalance &&
              ((!isReverse && !!appchainApi) || (isReverse && !!appchain))
            }
          >
            <HStack>
              <Text fontSize="sm" variant="gray">
                Balance: {balance ? DecimalUtil.beautify(balance) : "-"}
              </Text>
              {balance?.gt(ZERO_DECIMAL) ? (
                <Button
                  size="xs"
                  variant="ghost"
                  colorScheme="octo-blue"
                  onClick={onSetMax}
                >
                  Max
                </Button>
              ) : null}
            </HStack>
          </Skeleton>
        ) : null}
      </Flex>
      {collectible ? (
        <Flex
          mt={3}
          borderWidth={1}
          p={2}
          borderColor="octo-blue.500"
          borderRadius="lg"
          overflow="hidden"
          position="relative"
        >
          <Box w="20%">
            <Image src={collectible.metadata.mediaUri} w="100%" />
          </Box>
          <VStack alignItems="flex-start" ml={3}>
            <Heading fontSize="md">{collectible.metadata.name}</Heading>
          </VStack>
          <Box position="absolute" top={1} right={1}>
            <IconButton
              aria-label="clear"
              size="sm"
              isRound
              onClick={() => setCollectible(undefined)}
            >
              <Icon as={AiFillCloseCircle} boxSize={5} className="octo-gray" />
            </IconButton>
          </Box>
        </Flex>
      ) : (
        <Flex mt={3} alignItems="center">
          <AmountInput
            autoFocus
            placeholder="0.00"
            fontSize="xl"
            fontWeight={700}
            unstyled
            value={amount}
            onChange={setAmount}
            refObj={amountInputRef}
            onFocus={setIsAmountInputFocused.on}
            onBlur={setIsAmountInputFocused.off}
          />
          <Button
            ml={3}
            size="sm"
            variant="ghost"
            onClick={setSelectTokenModalOpen.on}
          >
            <HStack>
              <Avatar
                name={tokenAsset?.metadata?.symbol}
                src={tokenAsset?.metadata?.icon as any}
                boxSize={5}
                size="sm"
              />
              <Heading fontSize="md">{tokenAsset?.metadata?.symbol}</Heading>
              <Icon as={ChevronDownIcon} />
            </HStack>
          </Button>
        </Flex>
      )}
    </Box>
  )
}
