import React, { useEffect, useMemo, useState } from "react";

import {
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Flex,
  Button,
  Heading,
  useBoolean,
  Box,
  HStack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";

import {
  AppchainInfoWithAnchorStatus,
  RewardHistory,
  AnchorContract,
  WrappedAppchainToken,
} from "types";

import { BaseModal, Empty } from "components";
import { DecimalUtil, ZERO_DECIMAL } from "utils";

import RewardList from "components/AppChain/RewardList";
import { calcUnwithdrawnReward } from "utils/appchain";
import { Toast } from "components/common/toast";
import { useTokenContract } from "hooks/useTokenContract";
import { useWalletSelector } from "components/WalletSelectorContextProvider";
import { providers } from "near-api-js";
import { CodeResult } from "near-api-js/lib/providers/provider";
import { Action, Transaction } from "@near-wallet-selector/core";
import Decimal from "decimal.js";
import { COMPLEX_CALL_GAS, SIMPLE_CALL_GAS } from "primitives";
import { WarningTwoIcon } from "@chakra-ui/icons";

type RewardsModalProps = {
  validatorRewards?: RewardHistory[];
  delegatorRewards?: {
    [key: string]: RewardHistory[];
  };
  appchain?: AppchainInfoWithAnchorStatus;
  anchor?: AnchorContract;
  validatorId?: string;
  isOpen: boolean;
  onClose: () => void;
};

export const RewardsModal: React.FC<RewardsModalProps> = ({
  isOpen,
  onClose,
  validatorRewards,
  appchain,
  anchor,
  validatorId,
  delegatorRewards = {},
}) => {
  const decimals =
    appchain?.appchain_metadata?.fungible_token_metadata?.decimals;

  const bg = useColorModeValue("#f6f7fa", "#15172c");

  const [index, setIndex] = useState(0);
  const [wrappedAppchainToken, setWrappedAppchainToken] =
    useState<WrappedAppchainToken>();
  const [isClaiming, setIsClaiming] = useBoolean(false);

  const { accountId, selector } = useWalletSelector();
  const tokenContract = useTokenContract(
    wrappedAppchainToken?.contract_account
  );

  useEffect(() => {
    if (!anchor) {
      setIsClaiming.on();
      return;
    }
    setIsClaiming.off();
    anchor.get_anchor_status().then(({ rewards_withdrawal_is_paused }) => {
      rewards_withdrawal_is_paused && setIsClaiming.on();
    });
    anchor.get_wrapped_appchain_token().then((wrappedToken) => {
      setWrappedAppchainToken(wrappedToken);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor]);

  useEffect(() => {
    setIndex(!!validatorRewards?.length ? 0 : 1);
  }, [validatorRewards]);

  const total = useMemo(() => {
    const vTotal = calcUnwithdrawnReward(validatorRewards || [], decimals);
    const dTotal = Object.values(delegatorRewards).reduce(
      (total, rewards) => total.plus(calcUnwithdrawnReward(rewards, decimals)),
      ZERO_DECIMAL
    );
    return DecimalUtil.beautify(vTotal.plus(dTotal));
  }, [validatorRewards, delegatorRewards, decimals]);

  const onClaimRewards = async (action: Action | undefined) => {
    if (!anchor || !tokenContract || !accountId) {
      return;
    }
    try {
      const storageBalance = await tokenContract.storage_balance_of({
        account_id: accountId,
      });
      const provider = new providers.JsonRpcProvider({
        url: selector.options.network.nodeUrl,
      });
      const res = await provider.query<CodeResult>({
        request_type: "call_function",
        account_id: tokenContract?.contractId,
        method_name: "storage_balance_bounds",
        args_base64: "",
        finality: "final",
      });
      const storageBounds = JSON.parse(Buffer.from(res.result).toString());
      const txs: Transaction[] = [];
      if (
        !storageBalance ||
        new Decimal(storageBalance?.total).lessThan(storageBounds.min)
      ) {
        txs.push({
          signerId: accountId,
          receiverId: wrappedAppchainToken?.contract_account!,
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

      const wallet = await selector.wallet();

      if (action) {
        txs.push({
          signerId: accountId,
          receiverId: anchor.contractId,
          actions: [action],
        });
      } else {
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

        Object.keys(delegatorRewards).forEach((key: string) => {
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
        });
      }

      await wallet.signAndSendTransactions({
        transactions: txs,
      });

      setIsClaiming.off();
    } catch (error) {
      Toast.error(error);
      setIsClaiming.off();
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} maxW="800px" title={"Rewards"}>
      <Flex align="center" justify="flex-end" gap={4}>
        <Heading fontSize="md">
          {total} {appchain?.appchain_metadata?.fungible_token_metadata.symbol}
        </Heading>
        <Button
          colorScheme="octo-blue"
          isDisabled={isClaiming || Number(total) === 0}
          onClick={() => onClaimRewards(undefined)}
          isLoading={isClaiming}
        >
          Claim All
        </Button>
      </Flex>
      <Box p={4} mb={4} mt={4} bg={bg} borderRadius="md">
        <>
          <Flex>
            <HStack color="red">
              <WarningTwoIcon boxSize={3} />
              <Text fontSize="sm">
                You can only claim the rewards distributed within the last 84
                eras(days).
              </Text>
            </HStack>
          </Flex>
        </>
      </Box>
      <Tabs variant="enclosed" index={index} onChange={setIndex}>
        <TabList>
          <Tab>Validator Reward</Tab>
          <Tab>Delegator Reward</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <RewardList rewards={validatorRewards || []} appchain={appchain} />
          </TabPanel>
          <TabPanel>
            <Tabs>
              {Object.keys(delegatorRewards).length > 0 && (
                <TabList>
                  {Object.keys(delegatorRewards).map((key) => {
                    if (delegatorRewards[key]?.length === 0) {
                      return null;
                    }
                    return <Tab key={key}>{key}</Tab>;
                  })}
                </TabList>
              )}
              <TabPanels>
                {Object.keys(delegatorRewards).map((key) => {
                  if (delegatorRewards[key]?.length === 0) {
                    return null;
                  }
                  return (
                    <TabPanel key={key}>
                      <RewardList
                        rewards={delegatorRewards[key] || []}
                        appchain={appchain}
                      />
                    </TabPanel>
                  );
                })}
              </TabPanels>
              {Object.keys(delegatorRewards).length === 0 && (
                <Empty message="No Rewards" />
              )}
            </Tabs>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </BaseModal>
  );
};
