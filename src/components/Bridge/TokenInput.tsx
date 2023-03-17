import { ChevronDownIcon } from "@chakra-ui/icons";
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
} from "@chakra-ui/react";
import { ApiPromise } from "@polkadot/api";

import { AmountInput } from "components/AmountInput";
import { useWalletSelector } from "components/WalletSelectorContextProvider";
import { BRIDGE_CONFIG, COLLECTIBLE_CLASSES } from "config";
import Decimal from "decimal.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AiFillCloseCircle } from "react-icons/ai";
import useSWR from "swr";
import { AppchainInfo, Collectible, TokenAsset } from "types";
import { DecimalUtil, ZERO_DECIMAL } from "utils";
import { getNearTokenBalance, getPolkaTokenBalance } from "utils/bridge";
import { SelectTokenModal } from "views/Bridge/SelectTokenModal";

export default function TokenInpput({
  chain,
  from,
  appchainId,
  onChangeAmount,
  onChangeTokenAsset,
  amount,
  appchainApi,
  nativeToken,
  crosschainFee,
  appchain,
  collectible,
  setCollectible,
  setBalanceNotEngough,
}: {
  chain: string;
  from: string;
  appchainId: string;
  amount: string;
  onChangeAmount: (value: string) => void;
  onChangeTokenAsset: (value: any, isCollectible: boolean) => void;
  appchainApi?: ApiPromise;
  nativeToken?: TokenAsset;
  crosschainFee: { fungible: string; nonfungible: string };
  appchain: AppchainInfo;
  collectible?: Collectible;
  setCollectible: (value: Collectible | undefined) => void;
  setBalanceNotEngough: (value: boolean) => void;
}) {
  const { accountId, selector } = useWalletSelector();

  const bg = useColorModeValue("white", "#15172c");
  const grayBg = useColorModeValue("#f2f4f7", "#1e1f34");
  const [tokenAsset, setTokenAsset] = useState<TokenAsset>();
  const [balance, setBalance] = useState<Decimal>();
  const [isAmountInputFocused, setIsAmountInputFocused] = useBoolean();
  const [selectTokenModalOpen, setSelectTokenModalOpen] = useBoolean();
  const [isLoadingBalance, setIsLoadingBalance] = useBoolean();

  const { data: tokens } = useSWR<TokenAsset[]>(
    appchainId ? `tokens/${appchainId}` : null
  );
  const bridgeConfig = useMemo(() => {
    return BRIDGE_CONFIG(appchainId);
  }, [appchainId]);

  const collectibleClasses = COLLECTIBLE_CLASSES(appchainId);

  const isNear = chain === "NEAR";

  let decimals = 0;

  if (tokenAsset) {
    decimals = Array.isArray(tokenAsset.metadata.decimals)
      ? isNear
        ? tokenAsset.metadata.decimals[0]
        : tokenAsset.metadata.decimals[1]
      : tokenAsset.metadata.decimals;
  }

  const filteredTokens = useMemo(() => {
    if (!tokens?.length) {
      return [];
    }

    if (!bridgeConfig?.whitelist) {
      return tokens;
    }

    return tokens.filter(
      (t) =>
        !Object.keys(bridgeConfig.whitelist).includes(t.contractId) ||
        (Object.keys(bridgeConfig.whitelist).includes(t.contractId) &&
          accountId &&
          Object.values(bridgeConfig.whitelist)
            .flat(Infinity)
            .includes(accountId))
    );
  }, [tokens, bridgeConfig, accountId]);

  const onUpdateAmount = useCallback(
    (v: string) => {
      onChangeAmount(v);
      if (bridgeConfig?.crosschainFee && !isNear && !tokenAsset?.assetId) {
        setBalanceNotEngough(
          !DecimalUtil.power(v, decimals)
            .plus(new Decimal(crosschainFee.fungible))
            .lte(balance!)
        );
      } else {
        setBalanceNotEngough(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [balance]
  );

  const onSetMax = () => {
    if (bridgeConfig?.crosschainFee && !isNear && !tokenAsset?.assetId) {
      onUpdateAmount(
        DecimalUtil.shift(
          balance?.minus(crosschainFee.fungible),
          decimals
        ).toString() || ""
      );
    } else {
      onUpdateAmount(DecimalUtil.formatAmount(balance, decimals, decimals));
    }
  };

  const onUpdateTokenAsset = useCallback((t: TokenAsset) => {
    setTokenAsset(t);
    onChangeTokenAsset(t, false);
    localStorage.setItem(`bridge-token-${chain}`, String(t.assetId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (filteredTokens.length) {
      const prevTokenId = localStorage.getItem(`bridge-token-${chain}`);

      if (prevTokenId) {
        const token = filteredTokens.find(
          (t) => t.assetId === Number(prevTokenId)
        );
        if (token) {
          return onUpdateTokenAsset(token);
        }
      }
      onUpdateTokenAsset(filteredTokens[0]);
    }
  }, [filteredTokens, onUpdateTokenAsset, chain]);

  useEffect(() => {
    setIsLoadingBalance.on();
    if (!(tokenAsset && from)) {
      return;
    }
    if (isNear) {
      getNearTokenBalance({
        nodeUrl: selector.options.network.nodeUrl,
        accountId: from,
        tokenAsset,
      }).then((bal) => {
        setBalance(bal);
        setIsLoadingBalance.off();
      });
    } else if (appchainApi && bridgeConfig) {
      getPolkaTokenBalance({
        account: from,
        appchainApi: appchainApi,
        tokenAsset,
        bridgeConfig,
      }).then((bal) => {
        setBalance(bal);
        setIsLoadingBalance.off();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    chain,
    tokenAsset,
    from,
    selector.options.network.nodeUrl,
    isNear,
    appchainApi,
    bridgeConfig,
  ]);

  const onSelectToken = (
    token: TokenAsset | Collectible,
    isCollectible = false
  ) => {
    if (isCollectible) {
      setCollectible(token as Collectible);
      onChangeTokenAsset(token as Collectible, true);
      setTokenAsset(undefined);
    } else {
      setCollectible(undefined);
      onUpdateTokenAsset(token as TokenAsset);
    }

    onChangeAmount("");
    setSelectTokenModalOpen.off();
  };

  return (
    <Box
      borderWidth={1}
      p={4}
      borderColor={isAmountInputFocused ? "#2468f2" : grayBg}
      bg={isAmountInputFocused ? bg : grayBg}
      borderRadius="md"
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
                Balance:{" "}
                {balance ? DecimalUtil.formatAmount(balance, decimals, 2) : "-"}
              </Text>
              {(
                tokenAsset && tokenAsset.assetId === undefined
                  ? balance?.gt(crosschainFee.fungible || ZERO_DECIMAL)
                  : true
              ) ? (
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
      <VStack width="100%">
        {collectible ? (
          <Flex
            mt={3}
            borderWidth={1}
            p={2}
            borderColor="octo-blue.500"
            borderRadius="md"
            overflow="hidden"
            position="relative"
            width="100%"
          >
            <Box w="20%">
              <Image
                src={
                  collectible.metadata.mediaUri || collectible.metadata.image
                }
                w="100%"
              />
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
                <Icon
                  as={AiFillCloseCircle}
                  boxSize={5}
                  className="octo-gray"
                />
              </IconButton>
            </Box>
          </Flex>
        ) : (
          <Flex mt={3} alignItems="center" width="100%">
            <AmountInput
              autoFocus
              placeholder="0.00"
              fontSize="xl"
              fontWeight={700}
              unstyled
              min={0}
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
        {nativeToken && crosschainFee.fungible !== "0" && chain !== "NEAR" && (
          <HStack justify="flex-start" width="100%" gap={1}>
            <Text fontSize="xs" color="gray">
              Fee
            </Text>
            <Text fontSize="xs" color="gray">
              {DecimalUtil.formatAmount(
                tokenAsset ? crosschainFee.fungible : crosschainFee.nonfungible,
                appchain.appchain_metadata.fungible_token_metadata.decimals,
                0
              )}{" "}
              {appchain.appchain_metadata.fungible_token_metadata.symbol}
            </Text>
          </HStack>
        )}
      </VStack>
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
        appchain={appchain}
      />
    </Box>
  );
}
