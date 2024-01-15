import { Box, Table, Tag, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react";
import { Empty } from "components/Empty";
import { AppchainInfoWithAnchorStatus } from "types";
import { DecimalUtil } from "utils";
import { RewardItem } from "hooks/useRewards";

export default function RewardList({
  rewards,
  appchain,
}: {
  rewards: RewardItem[];
  appchain?: AppchainInfoWithAnchorStatus;
}) {
  const decimals =
    appchain?.appchain_metadata?.fungible_token_metadata?.decimals;

  return (
    <>
      {rewards?.length ? (
        <Box maxH="40vh" overflow="scroll" mt={3}>
          <Table>
            <Thead>
              <Tr>
                <Th>Day</Th>
                <Th isNumeric>Reward</Th>
                <Th isNumeric>Withdrawn</Th>
              </Tr>
            </Thead>
            <Tbody>
              {rewards
                ?.sort((a, b) => b.era - a.era)
                .map((r, idx) => (
                  <Tr key={`tr-${idx}`}>
                    <Td>{r.era}</Td>
                    <Td isNumeric>
                      {DecimalUtil.formatAmount(r.amount, decimals)}
                    </Td>
                    <Td isNumeric>
                      {r.is_withdrawn ? "Yes" : "No"}
                      {/* {DecimalUtil.fromString(r.unwithdrawn_reward).gt(
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
                    ) : null} */}
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
