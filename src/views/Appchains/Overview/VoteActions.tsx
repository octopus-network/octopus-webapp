import React, { useRef, useState, useEffect, useMemo } from 'react';
import Decimal from 'decimal.js';
import useSWR from 'swr';
import axios from 'axios';

import {
  SimpleGrid,
  Box,
  Icon,
  Text,
  HStack,
  Button,
  useColorModeValue,
  useOutsideClick,
  CloseButton,
  Heading,
  Flex,
  Stack,
  useBoolean,
  useToast
} from '@chakra-ui/react';

import {
  useSpring,
  animated,
} from 'react-spring';

import { useGlobalStore } from 'stores';
import { DecimalUtil, ZERO_DECIMAL } from 'utils';
import { AmountInput } from 'components';
import { IoMdThumbsUp, IoMdThumbsDown } from 'react-icons/io';
import { AppchainInfo, UserVotes } from 'types';
import { API_HOST } from 'config';

import { 
  OCT_TOKEN_DECIMALS, 
  SIMPLE_CALL_GAS,
  COMPLEX_CALL_GAS,
  FAILED_TO_REDIRECT_MESSAGE,
} from 'primitives';

import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

type VoteActionsProps = {
  data: AppchainInfo;
}

type VotePopoverProps = {
  isOpen: boolean;
  appchainId: string;
  voteType: 'upvote' | 'downvote';
  voted: Decimal;
  onClose: () => void;
}

const VotePopover: React.FC<VotePopoverProps> = ({ isOpen, appchainId, voteType, voted, onClose }) => {
  
  const { global } = useGlobalStore();
  const toast = useToast();

  const bg = useColorModeValue('white', '#25263c');
  const ref = useRef<any>();

  const inputRef = useRef<any>();
  const inputRef2 = useRef<any>();

  const [isDepositing, setIsDepositing] = useBoolean(false);
  const [isWithdrawing, setIsWithdrawing] = useBoolean(false);

  const [withdrawPanel, setWithdrawPanel] = useBoolean(false);

  const { data: balances } = useSWR(global.accountId ? `balances/${global.accountId}` : null);

  const [popoverProps, popoverApi] = useSpring(() => ({
    opacity: 0,
    transform: 'translateY(10px)'
  }));

  const [depositPanelProps, depositPanelApi] = useSpring(() => ({
    opacity: 1,
    transform: 'translateX(0px)'
  }));

  const [withdrawPanelProps, withdrawPanelApi] = useSpring(() => ({
    opacity: 0,
    transform: 'translateX(100%)'
  }));

  const [amount, setAmount] = useState('');

  useOutsideClick({
    ref: ref,
    handler: onClose,
  });

  useEffect(() => {
    if (isOpen) {
      popoverApi.start({ opacity: 1, transform: 'translateY(0px)' })
      setTimeout(() => {
        inputRef?.current.focus();
      }, 300);
    } else {
      popoverApi.start({ opacity: 0, transform: 'translateY(10px)' });
    }

    if (!isOpen) {
      setAmount('');
      setWithdrawPanel.off();
    }
    
  }, [isOpen]);

  useEffect(() => {
    if (withdrawPanel) {
      depositPanelApi.start({ opacity: 0, transform: 'translateX(-100%)' });
      withdrawPanelApi.start({ opacity: 1, transform: 'translateX(0px)' });
      setTimeout(() => {
        inputRef2?.current.focus();
      }, 300);
    } else {
      depositPanelApi.start({ opacity: 1, transform: 'translateX(0px)' });
      withdrawPanelApi.start({ opacity: 0, transform: 'translateX(100%)' });
      setTimeout(() => {
        inputRef?.current.focus();
      }, 300);
    }
  }, [withdrawPanel]);

  const onAmountChange = (value: string) => {
    setAmount(value);
  }

  const onDepositVotes = () => {
    setIsDepositing.on();
    global.octToken?.ft_transfer_call(
      {
        receiver_id: global.network?.octopus.registryContractId || '',
        amount: DecimalUtil.toU64(DecimalUtil.fromString(amount), OCT_TOKEN_DECIMALS).toString(),
        msg: JSON.stringify({
          [`${voteType.replace(/^([a-z])|\s+([a-z])/g, $1 => $1.toUpperCase())}Appchain`]: {
            "appchain_id": appchainId
          }
        })
      },
      SIMPLE_CALL_GAS,
      1
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
      setIsDepositing.off();
    });
  }

  const onWithdrawVotes = () => {
    const method = 
      voteType === 'upvote' ? 
      global.registry?.withdraw_upvote_deposit_of :
      global.registry?.withdraw_downvote_deposit_of;

    setIsWithdrawing.on();

    method?.(
      {
        appchain_id: appchainId,
        amount: DecimalUtil.toU64(DecimalUtil.fromString(amount), OCT_TOKEN_DECIMALS).toString()
      },
      COMPLEX_CALL_GAS
    ).then(() => {
      axios.post(`${API_HOST}/update-appchains`).then(() => window.location.reload());
    }).catch(err => {
      setIsWithdrawing.off();
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

  const setMaxAmount = () => {
    setAmount(voted.toString());
  }

  return (
    <animated.div style={popoverProps}>
    <Box 
      bg={bg}
      p={4}
      ref={ref}
      zIndex={1}
      borderRadius="lg"
      overflow="hidden"
      position="absolute" bottom="0" left="0" w="100%"
      boxShadow="0px 0px 30px 0px rgba(0,29,97,0.10)">
      <animated.div style={withdrawPanelProps}>  
        <Box position="absolute" left="0" top="0" w="100%" h="100%">
          <Flex alignItems="center" justifyContent="space-between">
            <Button size="sm" colorScheme="octo-blue" variant="ghost" onClick={setWithdrawPanel.off}>
              <Icon as={ChevronLeftIcon} mr={1} /> Deposit 
            </Button>
          </Flex>
          <Box mt={6}>
            <AmountInput placeholder="Withdraw amount" onChange={onAmountChange} value={amount} refObj={inputRef2} />
          </Box>
          {
            voted.gt(ZERO_DECIMAL) ?
            <Flex mt={2} justifyContent="flex-end">
              <HStack>
                <Text variant="gray" fontSize="sm">Voted: {DecimalUtil.beautify(voted)}</Text>
                <Button size="xs" colorScheme="octo-blue" variant="ghost" onClick={setMaxAmount}>
                  max
                </Button>
              </HStack>
            </Flex> : null
          }
          <Box mt={4}>
            <Button colorScheme={voteType === 'downvote' ? 'teal' : 'octo-blue'} 
              disabled={
                !amount || isWithdrawing ||
                DecimalUtil.fromString(amount).gt(voted)
              }
              isLoading={isWithdrawing}
              onClick={onWithdrawVotes}
              isFullWidth>
              { 
                DecimalUtil.fromString(amount).gt(voted) ? 'Insufficient Votes' :
                'Withdraw'
              }
            </Button>
          </Box>
        </Box>
      </animated.div>  
      <animated.div style={depositPanelProps}>  
        <Box position="relative">
          <Flex alignItems="center" justifyContent="space-between">
            <Heading fontSize="lg">{voteType === 'upvote' ? 'Upvote' : 'Downvote'}</Heading>
            <CloseButton onClick={onClose} color="gray" />
          </Flex>
          <Box mt={6}>
            <AmountInput placeholder="Amount of votes" onChange={onAmountChange} value={amount} refObj={inputRef} />
          </Box>
          {
            voted.gt(ZERO_DECIMAL) ?
            <Flex mt={2} justifyContent="flex-end">
              <HStack>
                <Text variant="gray" fontSize="sm">Voted: {DecimalUtil.beautify(voted)}</Text>
                <Button size="xs" colorScheme="octo-blue" variant="ghost" onClick={setWithdrawPanel.on}>
                  Withdraw <Icon as={ChevronRightIcon} ml={1} />
                </Button>
              </HStack>
            </Flex> : null
          }
          <Box mt={4}>
            <Button colorScheme={voteType === 'downvote' ? 'teal' : 'octo-blue'} 
              disabled={
                !amount || isDepositing ||
                DecimalUtil.fromString(amount).gt(DecimalUtil.fromString(balances?.['OCT']))
              }
              isLoading={isDepositing}
              onClick={onDepositVotes}
              isFullWidth>
              <Icon as={voteType === 'upvote' ? IoMdThumbsUp : IoMdThumbsDown} mr={1} />
              { 
                DecimalUtil.fromString(amount).gt(DecimalUtil.fromString(balances?.['OCT'])) ? 'Insufficient Balance' :
                voteType === 'upvote' ? 'Upvote' : 'Downvote' 
              }
            </Button>
          </Box>
        </Box>
      </animated.div>
      
    </Box>
    </animated.div>
  );
}

export const VoteActions: React.FC<VoteActionsProps> = ({ data }) => {
  const { global } = useGlobalStore();
  const bg = useColorModeValue('#f6f7fa', '#15172c');

  const [upvotePopoverOpen, setUpvotePopoverOpen] = useBoolean(false);
  const [downvotePopoverOpen, setDownvotePopoverOpen] = useBoolean(false);
  const toast = useToast();

  const downvotes = useMemo(() => DecimalUtil.fromString(data?.downvote_deposit, OCT_TOKEN_DECIMALS), [data]);
  const upvotes = useMemo(() => DecimalUtil.fromString(data?.upvote_deposit, OCT_TOKEN_DECIMALS), [data]);

  const { data: userVotes } = useSWR<UserVotes>(global.accountId ? `votes/${global.accountId}/${data.appchain_id}` : null);

  const userDownvotes = useMemo(() => DecimalUtil.fromString(userVotes?.downvotes, OCT_TOKEN_DECIMALS), [userVotes]);
  const userUpvotes = useMemo(() => DecimalUtil.fromString(userVotes?.upvotes, OCT_TOKEN_DECIMALS), [userVotes]);

  const [isWithdrawingUpvotes, setIsWithdrawingUpvotes] = useBoolean();
  const [isWithdrawingDownvotes, setIsWithdrawingDownvotes] = useBoolean();

  const onWithdrawVotes = (voteType: 'upvote' | 'downvote') => {
    const method = 
      voteType === 'upvote' ? 
      global.registry?.withdraw_upvote_deposit_of :
      global.registry?.withdraw_downvote_deposit_of;

    (voteType === 'upvote' ? setIsWithdrawingUpvotes : setIsWithdrawingDownvotes).on();

    method?.(
      {
        appchain_id: data.appchain_id,
        amount: (voteType === 'upvote' ? userVotes?.upvotes : userVotes?.downvotes) || '0'
      },
      COMPLEX_CALL_GAS
    ).then(() => {
      axios.post(`${API_HOST}/update-appchains`).then(() => window.location.reload());
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
    <>
      {
        userUpvotes.gt(ZERO_DECIMAL) || userDownvotes.gt(ZERO_DECIMAL) ?
        <Flex p={4} borderRadius="lg" bg={bg} mb={4} alignItems="center" position="relative" zIndex={upvotePopoverOpen || downvotePopoverOpen ? 0 : 2}>
          <Text variant="gray">Your votes:</Text>
          <Stack direction={{ base: 'column', md: 'row' }} ml={3}>
            {
              userUpvotes.gt(ZERO_DECIMAL) ?
              <HStack>
                <Icon as={IoMdThumbsUp} />
                <Heading fontSize="md">{DecimalUtil.beautify(userUpvotes)}</Heading>
                {
                  data?.appchain_state !== 'InQueue' ?
                  <Button 
                    size="xs" 
                    colorScheme="octo-blue" 
                    variant="ghost"
                    position="relative"
                    isDisabled={isWithdrawingUpvotes} 
                    isLoading={isWithdrawingUpvotes} 
                    onClick={() => onWithdrawVotes('upvote')}>
                    Withdraw
                    <Box position="absolute" top="0px" right="0px" boxSize={2} bg="red" borderRadius="full" />
                  </Button> : null
                }
                {
                  userDownvotes.gt(ZERO_DECIMAL) ?
                  <Text variant="gray">|</Text> : null
                }
              </HStack> : null
            }
            {
              userDownvotes.gt(ZERO_DECIMAL) ?
              <HStack>
                <Icon as={IoMdThumbsDown} />
                <Heading fontSize="md">{DecimalUtil.beautify(userDownvotes)}</Heading>
                {
                  data?.appchain_state !== 'InQueue' ?
                  <Button 
                    size="xs" 
                    colorScheme="octo-blue" 
                    variant="ghost" 
                    onClick={() => onWithdrawVotes('downvote')}
                    position="relative"
                    isDisabled={isWithdrawingDownvotes} 
                    isLoading={isWithdrawingDownvotes} >
                    Withdraw
                    <Box position="absolute" top="0px" right="0px" boxSize={2} bg="red" borderRadius="full" />
                  </Button> : null
                }
                
              </HStack> : null
            }
          </Stack>
        </Flex> : null
      }
      {
        data?.appchain_state === 'InQueue' ?
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Box position="relative">
            <Button 
              position="relative"
              colorScheme="octo-blue"
              onClick={setUpvotePopoverOpen.on} 
              zIndex={upvotePopoverOpen || downvotePopoverOpen ? 0 : 2}
              transition="all .5s ease"
              style={{
                opacity: upvotePopoverOpen ? 0 : 1,
                transform: upvotePopoverOpen ? 'scale(.9) translateY(-10px)' : 'scale(1) translateY(0px)'
              }}
              isFullWidth>
              <Icon as={IoMdThumbsUp} mr={1} /> Upvote
              {/* {
                upvotes.gt(ZERO_DECIMAL) ?
                `(${DecimalUtil.beautify(upvotes)})` : ''
              } */}
            </Button>
            <VotePopover voteType="upvote" onClose={setUpvotePopoverOpen.off} isOpen={upvotePopoverOpen} 
              voted={userUpvotes} appchainId={data?.appchain_id} />
          </Box>
          <Box position="relative">
            <Button 
              position="relative"
              colorScheme="teal"
              onClick={setDownvotePopoverOpen.on} 
              zIndex={downvotePopoverOpen || upvotePopoverOpen ? 0 : 2}
              transition="all .5s ease"
              style={{
                opacity: downvotePopoverOpen ? 0 : 1,
                transform: downvotePopoverOpen ? 'scale(.9) translateY(-10px)' : 'scale(1) translateY(0px)'
              }}
              isFullWidth>
              <Icon as={IoMdThumbsDown} mr={1} /> Downvote
              {/* {
                downvotes.gt(ZERO_DECIMAL) ?
                `(${DecimalUtil.beautify(downvotes)})` : ''
              } */}
            </Button>
            <VotePopover voteType="downvote" onClose={setDownvotePopoverOpen.off} isOpen={downvotePopoverOpen} 
              voted={userDownvotes} appchainId={data?.appchain_id} />
          </Box>
        </SimpleGrid> : null
      }
      
    </>
  );
}