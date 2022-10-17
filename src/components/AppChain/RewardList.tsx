import { Box, Table, Tag, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react";
import { Empty } from "components/Empty";
import { AppchainInfoWithAnchorStatus, RewardHistory } from "types";
import { DecimalUtil, ZERO_DECIMAL } from "utils";

export default function RewardList({
  rewards,
  appchain,
}: {
  rewards: RewardHistory[];
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
                <Th isNumeric>Unclaimed</Th>
              </Tr>
            </Thead>
            <Tbody>
              {rewards?.map((r, idx) => (
                <Tr key={`tr-${idx}`}>
                  <Td>{r.era_number}</Td>
                  <Td isNumeric>
                    {DecimalUtil.beautify(
                      DecimalUtil.fromString(r.total_reward, decimals)
                    )}
                  </Td>
                  <Td isNumeric>
                    {DecimalUtil.beautify(
                      DecimalUtil.fromString(r.unwithdrawn_reward, decimals)
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
