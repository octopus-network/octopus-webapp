import React, { useMemo, useEffect, useState } from 'react';
import BN from 'bn.js';

import {
  Flex,
  Heading,
  Text,
  HStack,
  Button,
  useBoolean,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  SimpleGrid,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';

import {
  AppchainInfoWithAnchorStatus,
  RewardHistory,
  AnchorContract,
  TokenContract
} from 'types';

import { BaseModal, Empty } from 'components';
import { DecimalUtil, ZERO_DECIMAL } from 'utils';
import { useGlobalStore } from 'stores';

import {
  SIMPLE_CALL_GAS,
  FAILED_TO_REDIRECT_MESSAGE,
  COMPLEX_CALL_GAS
} from 'primitives';

type RewardsModalProps = {
  rewards: RewardHistory[] | undefined;
  appchain: AppchainInfoWithAnchorStatus | undefined;
  anchor: AnchorContract | undefined;
  wrappedAppchainToken: TokenContract | undefined;
  validatorId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const RewardsModal: React.FC<RewardsModalProps> = ({ 
  isOpen, 
  onClose, 
  rewards, 
  appchain, 
  anchor, 
  wrappedAppchainToken, 
  validatorId 
}) => {

  const bg = useColorModeValue('#f6f7fa', '#15172c');

  const toast = useToast();
  const { global } = useGlobalStore();

  const [isClaiming, setIsClaiming] = useBoolean(false);
  const [isDepositingStorage, setIsDepositingStorage] = useBoolean(false);
  const [needDepositStorage, setNeedDepositStorage] = useBoolean(false);

  const [wrappedAppchainTokenStorageBalance, setWrappedAppchainTokenStorageBalance] = useState(ZERO_DECIMAL);

  useEffect(() => {
    if (!isOpen) {
      setNeedDepositStorage.off();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!wrappedAppchainToken) {
      return;
    }
    wrappedAppchainToken.storage_balance_of({ account_id: global.accountId }).then(storage => {
      setWrappedAppchainTokenStorageBalance(
        storage?.total ? DecimalUtil.fromString(storage.total, 24) : ZERO_DECIMAL
      );
    });
  }, [wrappedAppchainToken, global]);

  const unwithdraedRewards = useMemo(() => {
    if (!rewards?.length) {
      return ZERO_DECIMAL;
    }

    return rewards.reduce((total, next) => total.plus(
      DecimalUtil.fromString(next.unwithdrawn_reward, appchain?.appchain_metadata?.fungible_token_metadata.decimals)
    ), ZERO_DECIMAL);

  }, [rewards]);

  const totalRewards = useMemo(() =>
    rewards?.length ?
      rewards?.reduce(
        (total, next) => total.plus(DecimalUtil.fromString(next.total_reward, appchain?.appchain_metadata?.fungible_token_metadata?.decimals)),
        ZERO_DECIMAL
      ) : ZERO_DECIMAL,
    [rewards]
  );

  const onCliamRewards = () => {
    if (!anchor) {
      return;
    }

    if (wrappedAppchainTokenStorageBalance.lte(ZERO_DECIMAL)) {
      setNeedDepositStorage.on();
      return;
    }
    setIsClaiming.on();

    const method = validatorId ? anchor.withdraw_delegator_rewards : anchor.withdraw_validator_rewards;

    const params: any = validatorId ? {
      validator_id: validatorId,
      delegator_id: global.accountId || ''
    } : { validator_id: global.accountId };

    method(
      params,
      COMPLEX_CALL_GAS
    ).catch(err => {
      if (err.message === FAILED_TO_REDIRECT_MESSAGE) {
        return;
      }

      toast({
        position: 'top-right',
        title: 'Error',
        description: err.toString(),
        status: 'error'
      });
    })
  }

  const onDepositStorage = () => {
    setIsDepositingStorage.on()
    global.wallet?.account().functionCall({
      contractId: wrappedAppchainToken?.contractId || '',
      methodName: 'storage_deposit',
      args: { account_id: global.accountId },
      gas: new BN(SIMPLE_CALL_GAS),
      attachedDeposit: new BN('1250000000000000000000')
    }).catch(err => {
      if (err.message === FAILED_TO_REDIRECT_MESSAGE) {
        return;
      }

      toast({
        position: 'top-right',
        title: 'Error',
        description: err.toString(),
        status: 'error'
      });
    });
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxW="520px"
      title={needDepositStorage ? 'Tips' : 'Rewards'}>
      {
        needDepositStorage ?
          <Box p={4} borderRadius="lg">
            <Heading fontSize="lg" lineHeight="35px">
              It seems that you haven't setup your account on wrapped {appchain?.appchain_metadata?.fungible_token_metadata.symbol} token yet.
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={6}>
              <Button onClick={setNeedDepositStorage.off}>Maybe Later</Button>
              <Button colorScheme="octo-blue" onClick={onDepositStorage}
                isDisabled={isDepositingStorage} isLoading={isDepositingStorage}>Setup Right Now!</Button>
            </SimpleGrid>
          </Box> :
          <>
            <Box p={4} bg={bg} borderRadius="lg">
              <Flex justifyContent="space-between" alignItems="center">
                <Text variant="gray">Total Rewards</Text>
                <Heading fontSize="md">{DecimalUtil.beautify(totalRewards)} {appchain?.appchain_metadata?.fungible_token_metadata.symbol}</Heading>
              </Flex>
              <Flex justifyContent="space-between" alignItems="center" mt={3}>
                <Text variant="gray">Unclaimed Rewards</Text>
                <HStack>
                  <Heading fontSize="md">{DecimalUtil.beautify(unwithdraedRewards)} {appchain?.appchain_metadata?.fungible_token_metadata.symbol}</Heading>
                  <Button colorScheme="octo-blue" size="sm" onClick={onCliamRewards} isLoading={isClaiming}
                    isDisabled={unwithdraedRewards.lte(ZERO_DECIMAL) || isClaiming}>Claim</Button>
                </HStack>
              </Flex>
            </Box>
            {
              rewards?.length ?
                <Box maxH="40vh" overflow="scroll" mt={3}>
                  <Table>
                    <Thead>
                      <Tr>
                        <Th>Era</Th>
                        <Th isNumeric>Reward</Th>
                        <Th isNumeric>Unclaimed</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {
                        rewards?.map((r, idx) => (
                          <Tr key={`tr-${idx}`}>
                            <Td>{r.era_number}</Td>
                            <Td isNumeric>
                              {DecimalUtil.beautify(DecimalUtil.fromString(r.total_reward, appchain?.appchain_metadata?.fungible_token_metadata.decimals))}
                            </Td>
                            <Td isNumeric>
                              {DecimalUtil.beautify(DecimalUtil.fromString(r.unwithdrawn_reward, appchain?.appchain_metadata?.fungible_token_metadata.decimals))}
                            </Td>
                          </Tr>
                        ))
                      }
                    </Tbody>
                  </Table>
                </Box> : <Empty message="No Rewards" />
            }

          </>
      }

    </BaseModal>
  );
}