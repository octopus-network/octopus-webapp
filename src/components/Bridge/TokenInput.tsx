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
import { ApiPromise } from "@polkadot/api"

import { AmountInput } from "components/AmountInput"
import { useWalletSelector } from "components/WalletSelectorContextProvider"
import Decimal from "decimal.js"
import { providers } from "near-api-js"
import { CodeResult } from "near-api-js/lib/providers/provider"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AiFillCloseCircle } from "react-icons/ai"
import useSWR from "swr"
import {
  AppchainInfoWithAnchorStatus,
  BridgeConfig,
  Collectible,
  TokenAsset,
} from "types"
import { DecimalUtil, ZERO_DECIMAL } from "utils"
import { getTokenBalance } from "utils/bridge"
import { SelectTokenModal } from "views/Bridge/SelectTokenModal"

export default function TokenInpput({
  chain,
  appchain,
  from,
  appchainId,
  onChangeAmount,
  onChangeTokenAsset,
  appchainApi,
}: {
  chain: string
  appchain?: AppchainInfoWithAnchorStatus
  from: string
  appchainId: string
  onChangeAmount: (value: string) => void
  onChangeTokenAsset: (value: TokenAsset) => void
  appchainApi?: ApiPromise
}) {
  const { accountId, selector } = useWalletSelector()

  const bg = useColorModeValue("white", "#15172c")
  const grayBg = useColorModeValue("#f2f4f7", "#1e1f34")
  const [amount, setAmount] = useState("")
  const [tokenAsset, setTokenAsset] = useState<TokenAsset>()
  const [collectible, setCollectible] = useState<Collectible>()
  const [balance, setBalance] = useState<Decimal>()
  const [isAmountInputFocused, setIsAmountInputFocused] = useBoolean()
  const [selectTokenModalOpen, setSelectTokenModalOpen] = useBoolean()
  const [isLoadingBalance, setIsLoadingBalance] = useBoolean()

  const { data: tokens } = useSWR<TokenAsset[]>(
    appchainId ? `tokens/${appchainId}` : null
  )
  const { data: bridgeConfig } = useSWR<BridgeConfig>(
    appchainId ? `bridge-config/${appchainId}` : null
  )
  const { data: collectibleClasses } = useSWR<number[]>(
    appchainId ? `collectible-classes/${appchainId}` : null
  )

  const filteredTokens = useMemo(() => {
    if (!tokens?.length) {
      return []
    }

    if (!bridgeConfig?.whitelist) {
      return tokens
    }

    return tokens.filter(
      (t) =>
        !Object.keys(bridgeConfig.whitelist).includes(t.contractId) ||
        (Object.keys(bridgeConfig.whitelist).includes(t.contractId) &&
          accountId &&
          Object.values(bridgeConfig.whitelist)
            .flat(Infinity)
            .includes(accountId))
    )
  }, [tokens, bridgeConfig, accountId])

  const onUpdateAmount = useCallback((v: string) => {
    setAmount(v)
    onChangeAmount(v)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const isNear = chain === "NEAR"
  const onSetMax = () => {
    if (!isNear && tokenAsset?.assetId === undefined) {
      onUpdateAmount(
        balance?.sub(0.1).gt(ZERO_DECIMAL) ? balance?.sub(0.1).toString() : ""
      )
    } else {
      onUpdateAmount(balance?.toString() || "")
    }
  }

  const onUpdateTokenAsset = useCallback((t: TokenAsset) => {
    setTokenAsset(t)
    onChangeTokenAsset(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    if (filteredTokens.length) {
      onUpdateTokenAsset(filteredTokens[0])
    }
  }, [filteredTokens, onUpdateTokenAsset])

  useEffect(() => {
    if (!(tokenAsset && accountId)) {
      setBalance(ZERO_DECIMAL)
      return
    }
    if (isNear) {
      setIsLoadingBalance.on()

      getTokenBalance({
        nodeUrl: selector.options.network.nodeUrl,
        accountId,
        tokenAsset,
      }).then((bal) => {
        setBalance(bal)
        setIsLoadingBalance.off()
      })
    } else {
    }
  }, [
    tokenAsset,
    accountId,
    setIsLoadingBalance,
    selector.options.network.nodeUrl,
    isNear,
  ])

  const onSelectToken = (
    token: TokenAsset | Collectible,
    isCollectible = false
  ) => {
    if (isCollectible) {
      setCollectible(token as Collectible)
    } else {
      setCollectible(undefined)
      onUpdateTokenAsset(token as TokenAsset)
    }

    onUpdateAmount("")
    setSelectTokenModalOpen.off()
  }

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
        {!!from && !collectible ? (
          <Skeleton isLoaded={!isLoadingBalance}>
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
            onChange={onUpdateAmount}
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
      <SelectTokenModal
        isOpen={selectTokenModalOpen}
        onClose={setSelectTokenModalOpen.off}
        tokens={filteredTokens}
        isReverse={isNear}
        appchainApi={appchainApi}
        appchainId={appchainId}
        fromAccount={from}
        collectibleClasses={collectibleClasses}
        onSelectToken={onSelectToken}
        selectedToken={tokenAsset?.metadata?.symbol}
      />
    </Box>
  )
}
