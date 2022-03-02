import React, { useMemo, useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import BN from 'bn.js';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { PulseLoader } from 'react-spinners';
import { Account, keyStores, Near } from 'near-api-js';

import {
  Box,
  Heading,
  Flex,
  useColorModeValue,
  Center,
  Skeleton,
  InputRightElement,
  Input,
  HStack,
  Text,
  InputGroup,
  Icon,
  IconButton,
  Avatar,
  Spinner,
  CircularProgress,
  CircularProgressLabel,
  Button,
  useBoolean,
  useToast,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  useInterval
} from '@chakra-ui/react';

import {
  AppchainInfoWithAnchorStatus,
  TokenAssset,
  AppchainSettings,
  TokenContract,
  AnchorContract,
  BridgeHistoryStatus
} from 'types';

import { decodeAddress, isAddress } from '@polkadot/util-crypto';
import { u8aToHex, stringToHex, isHex } from '@polkadot/util';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

import {
  web3FromSource,
  web3Enable,
  web3Accounts as extensionWeb3Accounts,
  isWeb3Injected
} from '@polkadot/extension-dapp';

import { Empty } from 'components';
import nearLogo from 'assets/near.svg';
import { ChevronDownIcon, WarningIcon } from '@chakra-ui/icons';
import { MdSwapVert } from 'react-icons/md';
import { useGlobalStore } from 'stores';
import { AiFillCloseCircle } from 'react-icons/ai';
import { SelectWeb3AccountModal } from './SelectWeb3AccountModal';
import { SelectTokenModal } from './SelectTokenModal';
import { History } from './History';
import { AmountInput } from 'components';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Decimal from 'decimal.js';
import { ZERO_DECIMAL, DecimalUtil } from 'utils';
import { useTxnsStore } from 'stores';
import { useDebounce } from 'use-debounce';

import { 
  COMPLEX_CALL_GAS, 
  FAILED_TO_REDIRECT_MESSAGE, 
  SIMPLE_CALL_GAS 
} from 'primitives';

function toHexAddress(ss58Address: string) {
  if (isHex(ss58Address)) {
    return '';
  }
  try {
    const u8a = decodeAddress(ss58Address);
    return u8aToHex(u8a);
  } catch (err) {
    return '';
  }

}

export const BridgePanel: React.FC = () => {
  const bg = useColorModeValue('white', '#15172c');
  const { appchainId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const grayBg = useColorModeValue('#f2f4f7', '#1e1f34');
  const [isLoging, setIsLoging] = useBoolean();
  const [isLoadingBalance, setIsLodingBalance] = useBoolean();
  const [isAmountInputFocused, setIsAmountInputFocused] = useBoolean();
  const [isAccountInputFocused, setIsAccountInputFocused] = useBoolean();
  const [selectAccountModalOpen, setSelectAccountModalOpen] = useBoolean();
  const [selectTokenModalOpen, setSelectTokenModalOpen] = useBoolean();
  const [isTransfering, setIsTransfering] = useBoolean();
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useBoolean();
  const [isDepositingStorage, setIsDepositingStorage] = useBoolean();

  const [lastTokenContractId, setLastTokenContractId] = useState('');

  const { global } = useGlobalStore();
  const { txns, updateTxn, clearTxnsOfAppchain } = useTxnsStore();
  const { data: appchain } = useSWR<AppchainInfoWithAnchorStatus>(appchainId ? `appchain/${appchainId}` : null, { refreshInterval: 10 * 1000 });
  const { data: appchainSettings } = useSWR<AppchainSettings>(appchainId ? `appchain-settings/${appchainId}` : null);

  const { data: tokens } = useSWR<TokenAssset[]>(appchainId ? `tokens/${appchainId}` : null);

  const { pathname } = useLocation();
  const [amount, setAmount] = useState('');
  const isReverse = useMemo(() => !appchainId || new RegExp(`^/bridge/near/`).test(pathname), [pathname]);

  const fromChainName = useMemo(() => isReverse ? 'NEAR' : appchainId, [isReverse, appchainId]);
  const targetChainName = useMemo(() => !isReverse ? 'NEAR' : appchainId, [isReverse, appchainId]);

  const [appchainAccount, setAppchainAccount] = useState<InjectedAccountWithMeta>();
  const [web3Accounts, setWeb3Accounts] = useState<InjectedAccountWithMeta[]>();

  const [targetAccount, setTargetAccount] = useState('');
  const [tokenAsset, setTokenAsset] = useState<TokenAssset>();
  const [appchainApi, setAppchainApi] = useState<ApiPromise>();

  const [isInvalidTargetAccount, setIsInvalidTargetAccount] = useBoolean();
  const [targetAccountNeedDepositStorage, setTargetAccountNeedDepositStorage] = useBoolean();

  const [balance, setBalance] = useState<Decimal>();

  const [debouncedTargetAccount] = useDebounce(targetAccount, 600);

  useEffect(() => {
    web3Enable('Octopus Network').then(res => {
      extensionWeb3Accounts().then(accounts => {
        setWeb3Accounts(accounts);
        if (accounts.length) {
          setAppchainAccount(accounts[0]);
        }
      });
    });
  }, [isWeb3Injected]);

  useEffect(() => {
    if (isHistoryDrawerOpen) {
      (document.getElementById('root') as any).style = 'transition: all .3s ease-in-out; transform: translateX(-5%)';
    } else {
      (document.getElementById('root') as any).style = 'transition: all .15s ease-in-out; transform: translateX(0)';
    }
  }, [isHistoryDrawerOpen]);

  useEffect(() => {

    if (!appchainSettings) {
      return;
    }

    const provider = new WsProvider(appchainSettings.rpc_endpoint);
    const api = new ApiPromise({ provider });

    api.isReady.then(api => setAppchainApi(api));

  }, [appchainSettings, appchain]);

  useEffect(() => {
    if (!appchainId) {
      return;
    }

    setLastTokenContractId(window.localStorage.getItem('OCTOPUS_BRIDGE_TOKEN_CONTRACT_ID') || '');

    setTokenAsset(undefined);
    setAppchainApi(undefined);
    setIsLodingBalance.on();
    setAmount('');
    setTimeout(() => {
      amountInputRef.current?.focus();
    }, 300);
  }, [appchainId]);

  useEffect(() => {
    if (tokens?.length) {
      setTokenAsset(
        lastTokenContractId ? tokens.find(t => t.contractId === lastTokenContractId) || tokens[0] : tokens[0]
      );
    }
  }, [tokens, lastTokenContractId]);

  const fromAccount = useMemo(() => isReverse ? global.accountId : appchainAccount?.address, [isReverse, global, appchainAccount, appchainId]);
  const initialTargetAccount = useMemo(() => !isReverse ? global.accountId : appchainAccount?.address, [isReverse, global, appchainAccount]);

  const appchainTxns = useMemo(() =>
    Object
      .values(appchainId ? txns?.[appchainId] || {} : {})
      .filter(t => 
        (t.fromAccount === fromAccount || t.toAccount === fromAccount) || 
        (t.fromAccount === global.accountId || t.toAccount === global.accountId)
      ).sort((a, b) => b.timestamp - a.timestamp)
    , [appchainId, txns, global, fromAccount]);

  const pendingTxns = useMemo(() => appchainTxns.filter(txn => txn.status === BridgeHistoryStatus.Pending), [appchainTxns]);


  const tokenContract = useMemo(() => tokenAsset && global.wallet ? new TokenContract(
    global.wallet.account(),
    tokenAsset.contractId,
    {
      viewMethods: ['ft_balance_of', 'storage_balance_of'],
      changeMethods: ['ft_transfer_call']
    }
  ) : undefined, [tokenAsset, global]);

  const checkNearAccount = useCallback(() => {
    if (!global.network || !debouncedTargetAccount || !tokenContract) {
      return;
    }

    const near = new Near({
      keyStore: new keyStores.BrowserLocalStorageKeyStore(),
      ...global.network.near,
    });

    // check is valid near account or not
    const tmpAccount = new Account(near.connection, debouncedTargetAccount);
    tmpAccount.state().then(_ => {
      setIsInvalidTargetAccount.off();
      // check if target account need deposit storage
      tokenContract?.storage_balance_of({ account_id: debouncedTargetAccount }).then(storage => {
        if (storage === null) {
          setTargetAccountNeedDepositStorage.on();
        } else {
          setTargetAccountNeedDepositStorage.off();
        }
      });
    }).catch(_ => {
      setIsInvalidTargetAccount.on();
    });

  }, [global, debouncedTargetAccount, tokenContract]);

  const checkAppchainAccount = useCallback(() => {
    if (!appchainApi || !debouncedTargetAccount) {
      return;
    }
    if (isHex(debouncedTargetAccount) || !isAddress(debouncedTargetAccount)) {
      setIsInvalidTargetAccount.on();
      return;
    }
    if (tokenAsset?.assetId === undefined) {
      return;
    }
    appchainApi?.query.system.account(debouncedTargetAccount).then(res => {
      if (res.providers.toNumber() === 0) {
        setTargetAccountNeedDepositStorage.on();
      }
    });
  }, [debouncedTargetAccount, appchainApi, tokenAsset]);

  const checkTargetAccount = React.useRef<any>();
  checkTargetAccount.current = () => {
    setIsInvalidTargetAccount.off();
    setTargetAccountNeedDepositStorage.off();
    if (isReverse) {
      checkAppchainAccount();
    } else {
      checkNearAccount();
    }
  }

  useEffect(() => {
    checkTargetAccount.current();
  }, [debouncedTargetAccount, tokenAsset]);

  const anchorContract = useMemo(() => appchain && global.wallet ? new AnchorContract(
    global.wallet.account(),
    appchain.appchain_anchor,
    {
      viewMethods: ['get_appchain_message_processing_result_of'],
      changeMethods: ['burn_wrapped_appchain_token']
    }
  ) : undefined, [appchain, global]);

  const pendingTxnsChecker = React.useRef<any>();
  const isCheckingTxns = React.useRef(false);
  pendingTxnsChecker.current = async () => {

    if (isCheckingTxns.current) {
      return;
    }

    isCheckingTxns.current = true;

    const promises = pendingTxns.map(txn => {
      if (txn.isAppchainSide) {
        return anchorContract?.get_appchain_message_processing_result_of({ nonce: txn.sequenceId }).then(result => {
          if (result?.['Ok']) {
            updateTxn(txn.appchainId, { ...txn, status: BridgeHistoryStatus.Succeed });
            // toast({
            //   status: 'success',
            //   title: 'Transaction Confirmed',
            //   position: 'top-right'
            // });
          } else if (result?.['Error']) {
            updateTxn(txn.appchainId, {
              ...txn,
              status: BridgeHistoryStatus.Failed,
              message: result['Error'].message || 'Unknown error'
            });
          }
        });
      } else {
        return appchainApi?.query.octopusAppchain.notificationHistory(txn.sequenceId).then(res => {
          const jsonRes: string | null = res?.toJSON() as any;
          if (jsonRes === 'Success') {
            updateTxn(txn.appchainId, { ...txn, status: BridgeHistoryStatus.Succeed });
            // toast({
            //   status: 'success',
            //   title: 'Transaction Confirmed',
            //   position: 'top-right'
            // });
          } else if (jsonRes !== null) {
            updateTxn(txn.appchainId, { ...txn, status: BridgeHistoryStatus.Failed, message: jsonRes });
          }
        });
      }
    });
    try {
      await Promise.all(promises);
    } catch (err) { }

    isCheckingTxns.current = false;
  }

  useInterval(() => {
    pendingTxnsChecker.current();
  }, 5 * 1000);

  // fetch balance via near contract
  useEffect(() => {

    if (!isReverse || !tokenAsset || !global.wallet || !fromAccount || !tokenContract) {
      return;
    }

    setIsLodingBalance.on();

    tokenContract.ft_balance_of({ account_id: global.accountId }).then(res => {
      setBalance(DecimalUtil.fromString(res, tokenAsset?.metadata.decimals));
      setIsLodingBalance.off();
    });

  }, [isReverse, global, fromAccount, tokenAsset, tokenContract]);

  const checkBalanceViaRPC = React.useRef<any>();
  checkBalanceViaRPC.current = async () => {
    if (!tokenAsset) {
      return;
    }

    let balance = ZERO_DECIMAL;
    if (tokenAsset.assetId === undefined) {

      const res = await appchainApi?.query.system.account(fromAccount);
      const resJSON: any = res?.toJSON();
      balance = DecimalUtil.fromString(resJSON?.data?.free, tokenAsset?.metadata.decimals);

    } else {
      const res = await appchainApi?.query.octopusAssets?.account(
        tokenAsset.assetId,
        fromAccount
      );

      const resJSON: any = res?.toJSON();

      balance = DecimalUtil.fromString(resJSON?.balance, tokenAsset?.metadata.decimals);
    }

    setBalance(balance);
    setIsLodingBalance.off();
  }

  // fetch balance from appchain rpc
  useEffect(() => {

    if (isReverse || !tokenAsset || !global.wallet || !appchainApi || !fromAccount) {
      return;
    }

    checkBalanceViaRPC?.current();
  }, [isReverse, appchainApi, global, fromAccount, tokenAsset]);

  useEffect(() => {
    if (!fromAccount) {
      setBalance(ZERO_DECIMAL);
      if (isLoadingBalance) {
        setIsLodingBalance.off();
      }
    }
  }, [fromAccount, isLoadingBalance]);

  useEffect(() => {
    setTargetAccount(initialTargetAccount || '');
  }, [initialTargetAccount]);

  const targetAccountInputRef = React.useRef<any>();
  const amountInputRef = React.useRef<any>();

  const onToggleDirection = () => {
    if (isReverse) {
      navigate(`/bridge/${appchainId}/near`);
    } else {
      navigate(`/bridge/near/${appchainId}`)
    }
    setTimeout(() => {
      amountInputRef.current?.focus();
    }, 300);
  }

  const onClearTargetAccount = () => {
    setTargetAccount('');

    if (targetAccountInputRef.current) {
      targetAccountInputRef.current.value = '';
      targetAccountInputRef.current.focus();
    }

  }

  const onLogin = (e: any) => {
    setIsLoging.on();
    global.wallet?.requestSignIn(global.network?.octopus.registryContractId, 'Octopus Webapp');
  }

  const onLogout = () => {
    global.wallet?.signOut();
    window.location.replace(window.location.origin + window.location.pathname);
  }

  const onSelectAccount = (account: InjectedAccountWithMeta) => {
    setAppchainAccount(account);
    setSelectAccountModalOpen.off();
  }

  const onSelectToken = (token: TokenAssset) => {
    setTokenAsset(token)
    setAmount('');
    setSelectTokenModalOpen.off();
    setTimeout(() => {
      amountInputRef.current?.focus();
    }, 300);
    window.localStorage.setItem('OCTOPUS_BRIDGE_TOKEN_CONTRACT_ID', token.contractId);
  }

  const onSetMax = () => {
    if (!isReverse && tokenAsset?.assetId === undefined) {
      setAmount(balance?.sub(0.01).gt(ZERO_DECIMAL) ? balance?.sub(0.01).toString() : '');
    } else {
      setAmount(balance?.toString() || '');
    }
  }

  const onBurn = () => {
    setIsTransfering.on();

    const amountInU64 = DecimalUtil.toU64(DecimalUtil.fromString(amount), tokenAsset?.metadata.decimals);
    try {

      let targetAccountInHex = toHexAddress(targetAccount || '');

      if (!targetAccountInHex) {
        throw new Error('Invliad target account');
      }

      if (tokenAsset?.assetId === undefined) {
        anchorContract?.burn_wrapped_appchain_token(
          { receiver_id: targetAccountInHex, amount: amountInU64.toString() },
          COMPLEX_CALL_GAS
        );
        return;
      }

      tokenContract?.ft_transfer_call(
        {
          receiver_id: appchain?.appchain_anchor || '',
          amount: amountInU64.toString(),
          msg: JSON.stringify({
            BridgeToAppchain: {
              receiver_id_in_appchain: targetAccountInHex
            }
          })
        },
        COMPLEX_CALL_GAS,
        1
      );

    } catch (err: any) {
      if (err.message === FAILED_TO_REDIRECT_MESSAGE) {
        return;
      }
      toast({
        position: 'top-right',
        description: err.toString(),
        status: 'error'
      });
      setIsTransfering.off();
    }
  }

  const onRedeem = async () => {

    await web3Enable('Octopus Network');
    const injected = await web3FromSource(appchainAccount?.meta.source || '');
    appchainApi?.setSigner(injected.signer);

    setIsTransfering.on();

    const targetAccountInHex = stringToHex(targetAccount);
    const amountInU64 = DecimalUtil.toU64(DecimalUtil.fromString(amount), tokenAsset?.metadata.decimals);

    const tx: any = tokenAsset?.assetId === undefined ?
      appchainApi?.tx.octopusAppchain.lock(targetAccountInHex, amountInU64.toString()) :
      appchainApi?.tx.octopusAppchain.burnAsset(tokenAsset?.assetId, targetAccountInHex, amountInU64.toString());

    await tx.signAndSend(fromAccount, ({ events = [], status }: any) => {

      events.forEach(({ phase, event: { data, method, section } }: any) => {

        if (section === 'octopusAppchain' && (
          method === 'Locked' || method === 'AssetBurned'
        )) {
          updateTxn(appchainId || '', {
            isAppchainSide: true,
            appchainId: appchainId || '',
            hash: tx.hash.toString(),
            sequenceId: data[method === 'Locked' ? 3 : 4].toNumber(),
            amount: amountInU64.toString(),
            status: BridgeHistoryStatus.Pending,
            timestamp: new Date().getTime(),
            fromAccount: fromAccount || '',
            toAccount: targetAccount || '',
            tokenContractId: tokenAsset?.contractId || ''
          });
          setIsTransfering.off();
          checkBalanceViaRPC?.current();
        }
      });

    }).catch((err: any) => {
      toast({
        position: 'top-right',
        description: err.toString(),
        status: 'error'
      });
      setIsTransfering.off();
    });
  }

  const onClearHistory = () => {
    clearTxnsOfAppchain(appchainId || '');
  }

  const onDepositStorage = async () => {
   
    if (isReverse) {
      if (!appchainApi || !appchainAccount) {
        return;
      }
      await web3Enable('Octopus Network');
      const injected = await web3FromSource(appchainAccount.meta.source || '');
      appchainApi.setSigner(injected.signer);

      setIsDepositingStorage.on();
      const tx = appchainApi.tx.balances.transfer(targetAccount, DecimalUtil.toU64(new Decimal(0.01), appchain?.appchain_metadata?.fungible_token_metadata?.decimals).toString());
      tx.signAndSend(appchainAccount.address, res => {
        if (res.isInBlock) {
          setIsDepositingStorage.off();
          setTargetAccountNeedDepositStorage.off();
        }
      });

      return;
    }

    setIsDepositingStorage.on()
    global.wallet?.account().functionCall({
      contractId: tokenContract?.contractId || '',
      methodName: 'storage_deposit',
      args: { account_id: targetAccount },
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
    <>
      <Box bg={bg} p={6} borderRadius="lg" minH="520px">
        <Flex justifyContent="space-between" alignItems="center" minH="32px">
          <Heading fontSize="xl">Bridge</Heading>
          {
            appchainTxns.length ?
              <Button colorScheme="octo-blue" variant="ghost" size="sm" onClick={setIsHistoryDrawerOpen.on}>
                <HStack>
                  {
                    pendingTxns.length ?
                      <CircularProgress color="octo-blue.400" isIndeterminate size="18px">
                        <CircularProgressLabel fontSize="10px">{pendingTxns.length}</CircularProgressLabel>
                      </CircularProgress> : null
                  }
                  <Text>History</Text>
                </HStack>
              </Button> : null
          }
        </Flex>
        {
          !appchainId ?
            <Empty message="Please select an appchain" minH="420px" /> :
            !appchain ?
              <Center minH="320px">
                <Spinner size="md" thickness="4px" speed="1s" color="octo-blue.500" />
              </Center> :
              <Box mt={4}>
                <Box bg={grayBg} p={4} borderRadius="lg" pt={2}>
                  <Heading fontSize="md" className="octo-gray">From</Heading>
                  <Flex mt={3} alignItems="center" justifyContent="space-between">
                    <HStack spacing={3} maxW="calc(100% - 120px)" >
                      <Avatar
                        boxSize={8}
                        name={fromChainName}
                        src={isReverse ? nearLogo : appchain?.appchain_metadata.fungible_token_metadata.icon as any} />
                      <Heading fontSize="lg" textOverflow="ellipsis" overflow="hidden" whiteSpace="nowrap">
                        {fromAccount || fromChainName}
                      </Heading>
                    </HStack>
                    {
                      !fromAccount ?
                        (
                          isReverse ?
                            <Button colorScheme="octo-blue" isLoading={isLoging} isDisabled={isLoging} onClick={onLogin} size="sm">Connect</Button> :
                            <Button colorScheme="octo-blue" onClick={setSelectAccountModalOpen.on} size="sm">Connect</Button>
                        ) :
                        isReverse ?
                          <Button variant="white" onClick={onLogout} size="sm">Disconnect</Button> :
                          <Button variant="white" onClick={setSelectAccountModalOpen.on} size="sm">Change</Button>
                    }
                  </Flex>
                </Box>
                <Flex justifyContent="center">
                  <IconButton aria-label="switch" isRound size="xs" borderWidth={3} borderColor={bg} transform="scale(1.4)" onClick={onToggleDirection}>
                    <Icon as={MdSwapVert} boxSize={4} />
                  </IconButton>
                </Flex>
                <Box bg={isAccountInputFocused ? bg : grayBg} p={4} borderRadius="lg" pt={2} borderColor={isAccountInputFocused ? '#2468f2' : grayBg} borderWidth={1}>
                  <Flex alignItems="center" justifyContent="space-between" minH="25px">
                    <Heading fontSize="md" className="octo-gray">Target</Heading>
                    {
                      isInvalidTargetAccount ?
                      <HStack color="red">
                        <WarningIcon boxSize={3} />
                        <Text fontSize="xs">Invalid account</Text>
                      </HStack> :
                      targetAccountNeedDepositStorage ?
                      <HStack>
                        <WarningIcon color="red" boxSize={3} />
                        <Text fontSize="xs" color="red">This account isn't setup yet</Text>
                        <Button 
                          colorScheme="octo-blue" 
                          variant="ghost" 
                          size="xs" 
                          isDisabled={isDepositingStorage || !global.accountId} 
                          isLoading={isDepositingStorage} 
                          onClick={onDepositStorage}>
                          {
                            global.accountId ? 'Setup' : 'Please Login'
                          }
                        </Button>
                      </HStack> : null
                    }
                  </Flex>
                  <HStack spacing={3} mt={3}>
                    <Avatar
                      boxSize={8}
                      name={targetChainName}
                      src={!isReverse ? nearLogo : appchain?.appchain_metadata.fungible_token_metadata.icon as any} />
                    <InputGroup
                      variant="unstyled">
                      <Input
                        value={targetAccount}
                        size="lg"
                        fontWeight={600}
                        maxW="calc(100% - 40px)"
                        placeholder={`Target account in ${targetChainName}`}
                        borderRadius="none"
                        onFocus={setIsAccountInputFocused.on}
                        onBlur={setIsAccountInputFocused.off}
                        onChange={e => setTargetAccount(e.target.value)}
                        ref={targetAccountInputRef}
                        type="text" />
                      {
                        targetAccount ?
                          <InputRightElement>
                            <IconButton aria-label="clear" size="sm" isRound onClick={onClearTargetAccount}>
                              <Icon as={AiFillCloseCircle} boxSize={5} className="octo-gray" />
                            </IconButton>
                          </InputRightElement> : null
                      }
                    </InputGroup>
                  </HStack>
                </Box>
                <Box borderWidth={1} p={4} borderColor={isAmountInputFocused ? '#2468f2' : grayBg} bg={isAmountInputFocused ? bg : grayBg} borderRadius="lg" pt={2} mt={6}>
                  <Flex alignItems="center" justifyContent="space-between" minH="25px">
                    <Heading fontSize="md" className="octo-gray">Bridge Asset</Heading>
                    {
                      fromAccount ?
                        <Skeleton isLoaded={!isLoadingBalance && (
                          (!isReverse && !!appchainApi) ||
                          (isReverse && !!anchorContract)
                        )}>
                          <HStack>
                            <Text fontSize="sm" variant="gray">Balance: {balance ? DecimalUtil.beautify(balance) : '-'}</Text>
                            {
                              balance?.gt(ZERO_DECIMAL) ?
                                <Button size="xs" variant="ghost" colorScheme="octo-blue" onClick={onSetMax}>Max</Button> : null
                            }
                          </HStack>
                        </Skeleton> : null
                    }
                  </Flex>
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
                      onBlur={setIsAmountInputFocused.off} />
                    <Button ml={3} size="sm" variant="ghost" onClick={setSelectTokenModalOpen.on}>
                      <HStack>
                        <Avatar name={tokenAsset?.metadata?.symbol} src={tokenAsset?.metadata?.icon as any} boxSize={5} size="sm" />
                        <Heading fontSize="md">{tokenAsset?.metadata?.symbol}</Heading>
                        <Icon as={ChevronDownIcon} />
                      </HStack>
                    </Button>
                  </Flex>
                </Box>
                <Box mt={8}>
                  <Button
                    colorScheme="octo-blue"
                    size="lg"
                    isFullWidth
                    isDisabled={
                      !fromAccount || isLoadingBalance || !targetAccount || !amount ||
                      balance?.lt(amount) || isTransfering || isInvalidTargetAccount || targetAccountNeedDepositStorage
                    }
                    isLoading={isTransfering}
                    spinner={<PulseLoader color="rgba(255, 255, 255, .9)" size={12} />}
                    onClick={isReverse ? onBurn : onRedeem}>
                    {
                      !fromAccount ?
                        'Connect Wallet' :
                        !targetAccount ?
                          'Input Target Account' :
                          (isInvalidTargetAccount || targetAccountNeedDepositStorage) ?
                            'Invalid Target Account' :
                            !amount ?
                              'Input Amount' :
                              balance?.lt(amount) ?
                                'Insufficient Balance' :
                                'Transfer'
                    }
                  </Button>
                </Box>
              </Box>
        }
      </Box>
      <SelectWeb3AccountModal
        isOpen={selectAccountModalOpen}
        onClose={setSelectAccountModalOpen.off}
        accounts={web3Accounts}
        onChooseAccount={onSelectAccount}
        selectedAccount={fromAccount} />

      <SelectTokenModal
        isOpen={selectTokenModalOpen}
        onClose={setSelectTokenModalOpen.off}
        tokens={tokens}
        onSelectToken={onSelectToken}
        selectedToken={tokenAsset?.metadata?.symbol} />

      <Drawer
        placement="right"
        isOpen={isHistoryDrawerOpen}
        onClose={setIsHistoryDrawerOpen.off}
        size="lg">
        <DrawerOverlay />
        <DrawerContent>
          <History
            appchain={appchain}
            histories={appchainTxns}
            onDrawerClose={setIsHistoryDrawerOpen.off}
            onClearHistory={onClearHistory}
            tokenAssets={tokens} />
        </DrawerContent>
      </Drawer>
    </>
  );
}