import React from 'react';

import {
  Box,
  Flex,
  Text,
  List,
  Divider,
  Heading
} from '@chakra-ui/react';

import { AppchainInfo } from 'types';
import { DecimalUtil } from 'utils';

type DescriptionItemProps = {
  name: string;
  value: string | number | undefined;
}

type DescriptionsProps = {
  data: AppchainInfo | undefined;
}

const DescriptionItem: React.FC<DescriptionItemProps> = ({ name, value }) => {
  return (
    <Flex alignItems="center" justifyContent="space-between">
      <Text variant="gray">{name}</Text>
      <Heading fontSize="md">{value}</Heading>
    </Flex>
  );
}

export const Descriptions: React.FC<DescriptionsProps> = ({ data }) => {
  return (
    <Box p={4} borderWidth={1} borderRadius="lg">
      <List spacing={3}>
        <DescriptionItem name="Premined Amount" value={
          DecimalUtil.beautify(
            DecimalUtil.fromString(
              data?.appchain_metadata?.premined_wrapped_appchain_token
            ),
            0
          )
        } />
        <DescriptionItem name="Premined Beneficiary" value={
          data?.appchain_metadata?.premined_wrapped_appchain_token_beneficiary
        } />
        <DescriptionItem name="IDO Amount" value={
          DecimalUtil.beautify(
            DecimalUtil.fromString(
              data?.appchain_metadata?.ido_amount_of_wrapped_appchain_token
            ),
            0
          )
        } />
        <DescriptionItem name="Era Reward" value={
          DecimalUtil.beautify(
            DecimalUtil.fromString(
              data?.appchain_metadata?.initial_era_reward
            ),
            0
          )
        } />
        <Divider />
        <DescriptionItem name="Token Name" value={
          data?.appchain_metadata?.fungible_token_metadata?.name
        } />
        <DescriptionItem name="Token Symbol" value={
          data?.appchain_metadata?.fungible_token_metadata?.symbol
        } />
        <DescriptionItem name="Decimals" value={
          data?.appchain_metadata?.fungible_token_metadata?.decimals
        } />
      </List>
    </Box>
  );
}