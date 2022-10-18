import {
  Avatar,
  Box,
  Center,
  Flex,
  Heading,
  List,
  Spinner,
  useBoolean,
  useColorModeValue,
  Text,
  Button,
} from "@chakra-ui/react";
import { Transaction } from "@near-wallet-selector/core";
import { Empty } from "components";
import { Toast } from "components/common/toast";
import { useWalletSelector } from "components/WalletSelectorContextProvider";
import { ANCHOR_METHODS, TOKEN_METHODS } from "config/constants";
import Decimal from "decimal.js";
import { Account, providers } from "near-api-js";
import { CodeResult } from "near-api-js/lib/providers/provider";
import { COMPLEX_CALL_GAS, SIMPLE_CALL_GAS } from "primitives";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
  AnchorContract,
  AppchainInfo,
  RewardHistory,
  TokenContract,
} from "types";
import { DecimalUtil, ZERO_DECIMAL } from "utils";
import { calcUnwithdrawnReward, getAppchainRewards } from "utils/appchain";

interface AppChainRewards {
  appchain: AppchainInfo;
  validatorRewards: RewardHistory[];
  delegatorRewards: {
    [key: string]: RewardHistory[];
  };
}

async function claimRewardsTxForAppchain(
  appchainReward: AppChainRewards,
  accountId: string,
  nearAccount: Account,
  provider: providers.JsonRpcProvider
) {
  try {
    const { appchain, validatorRewards, delegatorRewards } = appchainReward;
    const anchor = new AnchorContract(
      nearAccount!,
      appchain.appchain_anchor,
      ANCHOR_METHODS
    );

    const wrappedToken = await anchor.get_wrapped_appchain_token();

    const tokenContract = new TokenContract(
      nearAccount!,
      wrappedToken.contract_account,
      TOKEN_METHODS
    );
    const storageBalance = await tokenContract.storage_balance_of({
      account_id: accountId,
    });
    const boundsRes = await provider.query<CodeResult>({
      request_type: "call_function",
      account_id: wrappedToken.contract_account,
      method_name: "storage_balance_bounds",
      args_base64: "",
      finality: "optimistic",
    });
    const storageBounds = JSON.parse(Buffer.from(boundsRes.result).toString());
    const txs: Transaction[] = [];
    if (
      !storageBalance ||
      new Decimal(storageBalance?.total).lessThan(storageBounds.min)
    ) {
      txs.push({
        signerId: accountId,
        receiverId: wrappedToken.contract_account,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "storage_deposit",
              args: { account_id: accountId },
              gas: SIMPLE_CALL_GAS,
              deposit: storageBounds.min,
            },
          },
        ],
      });
    }

    if (validatorRewards.length) {
      txs.push({
        signerId: accountId,
        receiverId: anchor.contractId,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "withdraw_validator_rewards",
              args: { validator_id: accountId },
              gas: COMPLEX_CALL_GAS,
              deposit: "0",
            },
          },
        ],
      });
    }

    Object.keys(delegatorRewards).forEach((key: string) => {
      if (delegatorRewards[key].length) {
        txs.push({
          signerId: accountId,
          receiverId: anchor.contractId,
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: "withdraw_delegator_rewards",
                args: {
                  validator_id: key,
                  delegator_id: accountId || "",
                },
                gas: COMPLEX_CALL_GAS,
                deposit: "0",
              },
            },
          ],
        });
      }
    });
    return txs;
  } catch (error) {
    console.log("error", error);

    return [];
  }
}

const Rewards: React.FC = () => {
  const bg = useColorModeValue("white", "#15172c");
  const { data: appchains } = useSWR("appchains/running");
  const [appchainRewards, setAppchainRewards] = useState<AppChainRewards[]>([]);
  const [isLoading, setIsLoading] = useBoolean(false);
  const [isClaiming, setIsClaiming] = useBoolean(false);
  const { accountId, networkConfig, nearAccount, selector } =
    useWalletSelector();

  useEffect(() => {
    if (appchains && networkConfig && accountId) {
      setIsLoading.on();
      Promise.all(
        appchains.map((appchain: AppchainInfo) =>
          getAppchainRewards(appchain.appchain_id, accountId, networkConfig)
        )
      )
        .then((rewards) => {
          setIsLoading.off();
          setAppchainRewards(rewards);
        })
        .catch((e) => {
          console.log("error", e);
          setIsLoading.off();
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appchains, accountId, networkConfig]);

  const claimable = useMemo(() => {
    return appchainRewards.some((t) => {
      if (!t) {
        return false;
      }
      const decimals =
        t.appchain.appchain_metadata.fungible_token_metadata.decimals;
      const vTotal = calcUnwithdrawnReward(t.validatorRewards || [], decimals);
      const dTotal = Object.values(t.delegatorRewards).reduce(
        (total, rewards) =>
          total.plus(calcUnwithdrawnReward(rewards, decimals)),
        ZERO_DECIMAL
      );
      return vTotal.plus(dTotal).isZero();
    });
  }, [appchainRewards]);

  if (!accountId) {
    return null;
  }

  const claimAll = async () => {
    try {
      setIsClaiming.on();
      const provider = new providers.JsonRpcProvider({
        url: selector.options.network.nodeUrl,
      });
      const txs = await Promise.all(
        appchainRewards
          .filter((t) => {
            if (!t) {
              return false;
            }
            const decimals =
              t.appchain.appchain_metadata.fungible_token_metadata.decimals;
            const vTotal = calcUnwithdrawnReward(
              t.validatorRewards || [],
              decimals
            );
            const dTotal = Object.values(t.delegatorRewards).reduce(
              (total, rewards) =>
                total.plus(calcUnwithdrawnReward(rewards, decimals)),
              ZERO_DECIMAL
            );
            return !vTotal.plus(dTotal).isZero();
          })
          .map((appchainReward) =>
            claimRewardsTxForAppchain(
              appchainReward,
              accountId,
              nearAccount!,
              provider
            )
          )
      );

      let transactions: Transaction[] = [];
      txs.forEach((tx) => {
        transactions = transactions.concat(tx);
      });
      const wallet = await selector.wallet();
      wallet.signAndSendTransactions({
        transactions,
      });
      setIsClaiming.off();
    } catch (error) {
      setIsClaiming.off();
      Toast.error(error);
    }
  };
  return (
    <Box bg={bg} p={6} borderRadius="lg">
      <Flex direction="row" align="center" justify="space-between">
        <Heading fontSize="2xl">Rewards</Heading>
        {claimable && (
          <Button
            colorScheme="octo-blue"
            onClick={claimAll}
            isLoading={isClaiming}
          >
            Claim All
          </Button>
        )}
      </Flex>
      <List spacing={4} mt={6}>
        {appchainRewards.map((appchainReward) => {
          if (!appchainReward) {
            return null;
          }
          const appchainId = appchainReward.appchain.appchain_id;
          const decimals =
            appchainReward.appchain.appchain_metadata.fungible_token_metadata
              .decimals;
          const symbol =
            appchainReward.appchain.appchain_metadata.fungible_token_metadata
              .symbol;
          const vTotal = calcUnwithdrawnReward(
            appchainReward.validatorRewards || [],
            decimals
          );
          const dTotal = Object.values(appchainReward.delegatorRewards).reduce(
            (total, rewards) =>
              total.plus(calcUnwithdrawnReward(rewards, decimals)),
            ZERO_DECIMAL
          );
          const total = DecimalUtil.beautify(vTotal.plus(dTotal));

          if (vTotal.plus(dTotal).isZero()) {
            return null;
          }

          return (
            <Box key={appchainId}>
              <Flex direction="row" align="center" justify="space-between">
                <Flex direction="row" align="center" gap={4}>
                  <Avatar
                    src={
                      appchainReward.appchain.appchain_metadata
                        .fungible_token_metadata.icon!
                    }
                    name={appchainId}
                    size="sm"
                  />
                  <Text fontSize="1xl">{appchainId}</Text>
                </Flex>

                <Text fontWeight="bold">
                  {total} {symbol}
                </Text>
              </Flex>
            </Box>
          );
        })}
      </List>
      {!isLoading && !appchainRewards.length && <Empty />}
      {isLoading && (
        <Center minH="160px">
          <Spinner size="md" thickness="4px" speed="1s" color="octo-blue.500" />
        </Center>
      )}
    </Box>
  );
};

export default Rewards;
