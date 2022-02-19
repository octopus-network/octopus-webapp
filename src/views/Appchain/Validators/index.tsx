import React, { useEffect, useState, useMemo } from 'react';
import useSWR from 'swr';
import { encodeAddress } from '@polkadot/util-crypto';

import {
  Flex,
  Heading,
  HStack,
  Center,
  Spinner,
  Button,
  Box,
  Text,
  useColorModeValue,
  Grid,
  GridItem,
  List,
  Icon,
  useBoolean,
  VStack
} from '@chakra-ui/react';

import type { ApiPromise } from '@polkadot/api';
import { TriangleUpIcon, TriangleDownIcon } from '@chakra-ui/icons';

import {
  Validator,
  AnchorContract,
  AppchainInfoWithAnchorStatus,
  ValidatorSessionKey
} from 'types';

import { ValidatorRow } from './ValidatorRow';
import { DelegateModal } from './DelegateModal';

import { DecimalUtil } from 'utils';
import { OCT_TOKEN_DECIMALS } from 'primitives';
import { Empty } from 'components';

type ValidatorsProps = {
  appchain: AppchainInfoWithAnchorStatus | undefined;
  isLoadingValidators: boolean;
  validators: Validator[] | undefined;
  appchainValidators: string[] | undefined;
  validatorSessionKeys: Record<string, ValidatorSessionKey> | undefined;
  anchor: AnchorContract | undefined;
}

type SortButtonProps = {
  label: string;
  sortIdx: number;
  indexArr: number[];
  onChange: (v: number) => void;
}

const SortButton: React.FC<SortButtonProps> = ({ sortIdx, indexArr, onChange, label }) => {

  const onClick = () => {
    if (!indexArr.includes(sortIdx)) {
      onChange(indexArr[1])
    } else if (sortIdx === indexArr[1]) {
      onChange(indexArr[0]);
    } else {
      onChange(0);
    }
  }

  return (
    <HStack alignItems="center" justifyContent="center" onClick={onClick} cursor="pointer">
      <Text variant="gray">{label}</Text>
      <VStack spacing={0}>
        <Icon as={TriangleUpIcon} boxSize={2} opacity={sortIdx === indexArr[0] ? 1 : .3} />
        <Icon as={TriangleDownIcon} boxSize={2} opacity={sortIdx === indexArr[1] ? 1 : .3} />
      </VStack>
    </HStack>
  );
}

export const Validators: React.FC<ValidatorsProps> = ({ 
  appchain, 
  anchor, 
  isLoadingValidators, 
  validators, 
  appchainValidators,
  validatorSessionKeys
}) => {
  const bg = useColorModeValue('white', '#15172c');

  const [showType, setShowType] = useState('all');
  const [sortIdx, setSortIdx] = useState(2);

  const [delegateModalOpen, setDelegateModalOpen] = useBoolean();

  const [toDelegateValidatorId, setToDelegateValidatorId] = useState('');

  const filteredValidators = useMemo(() => {

    if (showType === 'all' || !validators || !appchainValidators || !validatorSessionKeys) {
      return validators;
    } else if (showType === 'validating') {
      return validators.filter(
        v => appchainValidators.some(s => s === encodeAddress(v.validator_id_in_appchain)) && validatorSessionKeys[v.validator_id]
      );
    } else if (showType === 'needKeys') {
      return validators.filter(
        v => appchainValidators.some(s => s === encodeAddress(v.validator_id_in_appchain)) && !validatorSessionKeys[v.validator_id]
      );
    } else if (showType === 'registered') {
      return validators.filter(
        v => !appchainValidators.some(s => s === encodeAddress(v.validator_id_in_appchain)) && !validatorSessionKeys[v.validator_id]
      );
    }

  }, [validators, showType, appchainValidators, validatorSessionKeys]);

  const sortedValidators = useMemo(() => {
    if (!sortIdx || !filteredValidators?.length) {
      return filteredValidators;
    }

    let tmpArr: Validator[] = [...filteredValidators];

    if (sortIdx === 1) {
      tmpArr.sort((a, b) => 
        DecimalUtil.fromString(a.total_stake, OCT_TOKEN_DECIMALS).sub(
          DecimalUtil.fromString(b.total_stake, OCT_TOKEN_DECIMALS)
        ).toNumber() 
      );
    } else if (sortIdx === 2) {
      tmpArr.sort((a, b) => 
        DecimalUtil.fromString(b.total_stake, OCT_TOKEN_DECIMALS).sub(
          DecimalUtil.fromString(a.total_stake, OCT_TOKEN_DECIMALS)
        ).toNumber() 
      );
    } else if (sortIdx === 3) {
      tmpArr.sort((a, b) => 
        DecimalUtil.fromString(a.deposit_amount, OCT_TOKEN_DECIMALS).sub(
          DecimalUtil.fromString(b.deposit_amount, OCT_TOKEN_DECIMALS)
        ).toNumber() 
      );
    } else if (sortIdx === 4) {
      tmpArr.sort((a, b) => 
        DecimalUtil.fromString(b.deposit_amount, OCT_TOKEN_DECIMALS).sub(
          DecimalUtil.fromString(a.deposit_amount, OCT_TOKEN_DECIMALS)
        ).toNumber() 
      );
    } else if (sortIdx === 5) {
      tmpArr.sort((a, b) => 
        DecimalUtil.fromString(a.delegators_count).sub(
          DecimalUtil.fromString(b.delegators_count)
        ).toNumber() 
      );
    } else if (sortIdx === 6) {
      tmpArr.sort((a, b) => 
        DecimalUtil.fromString(b.delegators_count).sub(
          DecimalUtil.fromString(a.delegators_count)
        ).toNumber() 
      );
    }

    return tmpArr;
  }, [filteredValidators, sortIdx]);

  const onDelegate = (validatorId: string) => {
    setToDelegateValidatorId(validatorId);
    setDelegateModalOpen.on();
  }

  return (
    <>
      <Flex justifyContent="space-between" alignItems="center">
        <Heading fontSize="xl">Validators</Heading>
        <Box display={{ base: 'none', md: 'block' }}>
          <HStack>
            <Button variant={showType === 'registered' ? 'octo-blue' : 'octo-white'}
              size="sm" onClick={() => setShowType('registered')}>Registered</Button>
            <Button variant={showType === 'needKeys' ? 'octo-blue' : 'octo-white'}
              size="sm" onClick={() => setShowType('needKeys')}>Need Keys</Button>
            <Button variant={showType === 'validating' ? 'octo-blue' : 'octo-white'}
              size="sm" onClick={() => setShowType('validating')}>Validating</Button>
            <Button variant={showType === 'all' ? 'octo-blue' : 'octo-white'}
              size="sm" onClick={() => setShowType('all')}>All</Button>
          </HStack>
        </Box>
      </Flex>
      <Box p={2} bg={bg} mt={4} borderRadius="lg" pb={6} minH="320px">
        <Box p={6}>
          <Grid templateColumns={{ base: 'repeat(5, 1fr)', md: 'repeat(8, 1fr)', lg: 'repeat(10, 1fr)' }} gap={2}>
            <GridItem colSpan={2}>
              <Text variant="gray">Validator ID</Text>
            </GridItem>
            <GridItem colSpan={2} display={{ base: 'none', md: 'table-cell' }} textAlign="center">
              <Text variant="gray">State</Text>
            </GridItem>
            <GridItem colSpan={2}>
              <SortButton label="Total Staked" sortIdx={sortIdx} indexArr={[1, 2]} onChange={v => setSortIdx(v)} />
            </GridItem>
            <GridItem colSpan={2} display={{ base: 'none', lg: 'table-cell' }} textAlign="center">
              <SortButton label="Own Staked" sortIdx={sortIdx} indexArr={[3, 4]} onChange={v => setSortIdx(v)} />
            </GridItem>
            <GridItem colSpan={1} display={{ base: 'none', md: 'table-cell' }} textAlign="center">
              <SortButton label="Delegators" sortIdx={sortIdx} indexArr={[5, 6]} onChange={v => setSortIdx(v)} />
            </GridItem>
            <GridItem colSpan={1} textAlign="right">
              <Text variant="gray">Operation</Text>
            </GridItem>
          </Grid>
        </Box>
        {
          isLoadingValidators ?
            <Center minH="260px">
              <Spinner size="lg" thickness="5px" speed="1s" color="octo-blue.500" />
            </Center> :
            filteredValidators?.length ?
            <List spacing={3} mt={2}>
              {
                sortedValidators?.map((v, idx) => {
                  let ss58Address: string;
                  try {
                    ss58Address = encodeAddress(v.validator_id_in_appchain);
                  } catch (err) {
                    ss58Address = '';
                  }

                  const isInAppchain = !!(appchainValidators?.some(s => s === ss58Address));
                  const haveSessionKey = !!(validatorSessionKeys?.[v.validator_id]);

                  return (
                    <ValidatorRow
                      validator={v}
                      key={`validator-${idx}`}
                      anchor={anchor}
                      appchainId={appchain?.appchain_id}
                      isLoading={!appchainValidators?.length || !validatorSessionKeys}
                      isInAppchain={isInAppchain}
                      haveSessionKey={haveSessionKey}
                      ftMetadata={appchain?.appchain_metadata.fungible_token_metadata}
                      validatorSetHistoryEndIndex={appchain?.anchor_status?.index_range_of_validator_set_history?.end_index}
                      showType={showType} 
                      onDelegate={onDelegate} />
                  )
                })
              }
            </List> :
            <Empty />
        }
      </Box>
      <DelegateModal 
        isOpen={delegateModalOpen} 
        anchor={anchor}
        onClose={setDelegateModalOpen.off} 
        validatorId={toDelegateValidatorId} />
    </>
  );
}