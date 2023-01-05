import React from "react";
import { Box, Flex, Text, List, Divider, Heading } from "@chakra-ui/react";
import { AppchainInfo } from "types";
import { DecimalUtil } from "utils";

type DescriptionItemProps = {
  name: string;
  value: string | number | undefined;
};

type DescriptionsProps = {
  data: AppchainInfo | undefined;
};

const DescriptionItem: React.FC<DescriptionItemProps> = ({ name, value }) => {
  return (
    <Flex alignItems="center" justifyContent="space-between">
      <Text variant="gray">{name}</Text>
      <Heading fontSize="md">{value}</Heading>
    </Flex>
  );
};

export const Descriptions: React.FC<DescriptionsProps> = ({ data }) => {
  return (
    <Box p={4} borderWidth={1} borderRadius="lg">
      <List spacing={3}>
        <DescriptionItem
          name="Initial Supply"
          value={DecimalUtil.formatAmount(
            data?.appchain_metadata?.initial_supply_of_wrapped_appchain_token,
            data?.appchain_metadata?.fungible_token_metadata?.decimals
          )}
        />
        <DescriptionItem
          name="IDO Amount"
          value={DecimalUtil.formatAmount(
            data?.appchain_metadata?.ido_amount_of_wrapped_appchain_token,
            data?.appchain_metadata?.fungible_token_metadata?.decimals
          )}
        />
        <DescriptionItem
          name="Daily Reward"
          value={DecimalUtil.formatAmount(
            data?.appchain_metadata?.initial_era_reward,
            data?.appchain_metadata?.fungible_token_metadata?.decimals
          )}
        />
        <Divider />
        <DescriptionItem
          name="Token Name"
          value={data?.appchain_metadata?.fungible_token_metadata?.name}
        />
        <DescriptionItem
          name="Token Symbol"
          value={data?.appchain_metadata?.fungible_token_metadata?.symbol}
        />
        <DescriptionItem
          name="Decimals"
          value={data?.appchain_metadata?.fungible_token_metadata?.decimals}
        />
      </List>
    </Box>
  );
};
