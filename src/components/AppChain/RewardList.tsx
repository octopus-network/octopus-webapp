import { WarningTwoIcon } from "@chakra-ui/icons";
import {
  Box,
  Divider,
  Flex,
  HStack,
  Table,
  Tag,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
} from "@chakra-ui/react";
import { Action } from "@near-wallet-selector/core";
import { Empty } from "components/Empty";
import { useMemo } from "react";
import {
  AnchorContract,
  AppchainInfoWithAnchorStatus,
  RewardHistory,
} from "types";
import { DecimalUtil, ZERO_DECIMAL } from "utils";
import { calcUnwithdrawnReward } from "utils/appchain";

export default function RewardList({
  rewards,
  appchain,
  anchor,
  validatorId,
  onClaimRewards,
}: {
  rewards: RewardHistory[];
  appchain?: AppchainInfoWithAnchorStatus;
  anchor?: AnchorContract;
  validatorId?: string;
  onClaimRewards: (action: Action) => void;
}) {
  const bg = useColorModeValue("#f6f7fa", "#15172c");

  const decimals =
    appchain?.appchain_metadata?.fungible_token_metadata?.decimals;

  const unwithdrawnRewards = useMemo(() => {
    return calcUnwithdrawnReward(rewards, decimals);
  }, [decimals, rewards]);

  return (
    <>
      {unwithdrawnRewards.gt(ZERO_DECIMAL) && (
        <Box p={4} bg={bg} borderRadius="lg">
          <>
            <Divider mt={3} mb={3} />
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
      )}
      {rewards?.length ? (
        <Box maxH="40vh" overflow="scroll" mt={3}>
          <Table>
            <Thead>
              <Tr>
                <Th>Day</Th>
                <Th isNumeric>Reward</Th>
                <Th isNumeric>Unclaimed</Th>
              </Tr>
            </Thead>
            <Tbody>
              {rewards?.map((r, idx) => (
                <Tr key={`tr-${idx}`}>
                  <Td>{r.era_number}</Td>
                  <Td isNumeric>
                    {DecimalUtil.beautify(
                      DecimalUtil.fromString(
                        r.total_reward,
                        appchain?.appchain_metadata?.fungible_token_metadata
                          .decimals
                      )
                    )}
                  </Td>
                  <Td isNumeric>
                    {DecimalUtil.beautify(
                      DecimalUtil.fromString(
                        r.unwithdrawn_reward,
                        appchain?.appchain_metadata?.fungible_token_metadata
                          .decimals
                      )
                    )}
                    {DecimalUtil.fromString(r.unwithdrawn_reward).gt(
                      ZERO_DECIMAL
                    ) && r.expired ? (
                      <Tag
                        size="sm"
                        colorScheme="red"
                        mr={-2}
                        transform="scale(.8)"
                      >
                        Expired
                      </Tag>
                    ) : null}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      ) : (
        <Empty message="No Rewards" />
      )}
    </>
  );
}
