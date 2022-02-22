import React, { useMemo, useState, useEffect } from 'react';
import useSWR from 'swr';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { PulseLoader } from 'react-spinners';

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
  Button,
  useBoolean,
  useToast
} from '@chakra-ui/react';

import {
  AppchainInfoWithAnchorStatus,
  TokenAssset,
  AppchainSettings,
  TokenContract,
  AnchorContract
} from 'types';

import { decodeAddress } from '@polkadot/util-crypto';
import { u8aToHex, stringToHex, isHex } from '@polkadot/util';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { web3FromSource, web3Enable, web3Accounts as extensionWeb3Accounts } from '@polkadot/extension-dapp';

import { Empty } from 'components';
import nearLogo from 'assets/near.svg';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { MdSwapVert } from 'react-icons/md';
import { useGlobalStore } from 'stores';
import { AiFillCloseCircle } from 'react-icons/ai';
import { SelectWeb3AccountModal } from './SelectWeb3AccountModal';
import { SelectTokenModal } from './SelectTokenModal';
import { AmountInput } from 'components';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Decimal from 'decimal.js';
import { ZERO_DECIMAL, DecimalUtil } from 'utils';

import { COMPLEX_CALL_GAS, FAILED_TO_REDIRECT_MESSAGE } from 'primitives';

function toHexAddress(ss58Address: string) {
  if (isHex(ss58Address)) {
    return '';
  }
  try {
    const u8a = decodeAddress(ss58Address);
    return u8aToHex(u8a);
  } catch(err) {
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

  const { global } = useGlobalStore();
  const { data: appchain } = useSWR<AppchainInfoWithAnchorStatus>(appchainId ? `appchain/${appchainId}` : null);
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

  const [balance, setBalance] = useState<Decimal>();

  useEffect(() => {
    web3Enable('Octopus Network').then(res => {
      extensionWeb3Accounts().then(accounts => {
        setWeb3Accounts(accounts);
        if (accounts.length) {
          setAppchainAccount(accounts[0]);
        }
      });
    });
  }, []);

  useEffect(() => {

    if (!appchainSettings) {
      return;
    }

    const provider = new WsProvider(appchainSettings.rpc_endpoint);
    const api = new ApiPromise({ provider });

    api.isReady.then(api => setAppchainApi(api));

  }, [appchainSettings]);

  useEffect(() => {
    if (!appchainId) {
      return;
    }
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
      setTokenAsset(tokens[0]);
    }
  }, [tokens]);

  const fromAccount = useMemo(() => isReverse ? global.accountId : appchainAccount?.address, [isReverse, global, appchainAccount, appchainId]);
  const initialTargetAccount = useMemo(() => !isReverse ? global.accountId : appchainAccount?.address, [isReverse, global, appchainAccount]);

  const tokenContract = useMemo(() => tokenAsset && global.wallet ? new TokenContract(
    global.wallet.account(),
    tokenAsset.contractId,
    {
      viewMethods: ['ft_balance_of'],
      changeMethods: ['ft_transfer_call']
    }
  ) : undefined, [tokenAsset, global]);

  const anchorContract = useMemo(() => appchain && global.wallet ? new AnchorContract(
    global.wallet.account(),
    appchain.appchain_anchor,
    {
      viewMethods: [],
      changeMethods: ['burn_wrapped_appchain_token']
    }
  ) : undefined, [appchain, global]);

  // fetch balance via near contract
  useEffect(() => {

    if (!isReverse || !tokenAsset || !global.wallet || !fromAccount || !tokenContract) {
      return;
    }

    setIsLodingBalance.on();

    tokenContract.ft_balance_of({ account_id: global.accountId }).then(res => {
      setBalance(DecimalUtil.fromString(res, tokenAsset?.metadata.decimals));
      setIsLodingBalance.off();
      console.log('off');
    });

  }, [isReverse, global, fromAccount, tokenAsset, tokenContract]);

  // fetch balance from appchain rpc
  useEffect(() => {

    if (isReverse || !tokenAsset || !global.wallet || !appchainApi || !fromAccount) {
      return;
    }

    setIsLodingBalance.on();

    if (tokenAsset.assetId === undefined) {

      appchainApi?.query.system.account(fromAccount).then(res => {
        const resJSON: any = res.toJSON();
        const freeBalance = DecimalUtil.fromString(resJSON?.data?.free, tokenAsset?.metadata.decimals);
        setBalance(freeBalance);
        setIsLodingBalance.off();
      });
    } else {
      appchainApi?.query.octopusAssets?.account(
        tokenAsset.assetId,
        fromAccount
      ).then(res => {
        const resJSON: any = res.toJSON();
        console.log('asset', resJSON);
        setBalance(DecimalUtil.fromString(resJSON?.balance, tokenAsset?.metadata.decimals));
        setIsLodingBalance.off();
      });
    }

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

    } catch(err: any) {
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
      
      if (status.isFinalized) {
        setIsTransfering.off();
        window.location.reload();
      }
    }).catch((err: any) => {
      toast({
        position: 'top-right',
        description: err.toString(),
        status: 'error'
      });
      setIsTransfering.off();
    });
  }

  return (
    <>
      <Box bg={bg} p={6} borderRadius="lg" minH="520px">
        <Flex justifyContent="space-between" alignItems="center">
          <Heading fontSize="xl">Bridge</Heading>
          <Button colorScheme="octo-blue" variant="ghost" size="sm">
            History
          </Button>
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
                  <Heading fontSize="md" className="octo-gray">Target</Heading>
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
                        <Skeleton isLoaded={!isLoadingBalance && !!appchainApi}>
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
                      balance?.lt(amount) || isTransfering
                    }
                    isLoading={isTransfering}
                    spinner={<PulseLoader color="rgba(255, 255, 255, .9)" size={12} />}
                    onClick={isReverse ? onBurn : onRedeem}>
                    {
                      !fromAccount ?
                        'Connect Wallet' :
                        !targetAccount ?
                          'Input Target Account' :
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
    </>
  );
}