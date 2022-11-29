import React, { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import {
  Flex,
  HStack,
  Heading,
  Tooltip,
  useColorModeValue,
  Icon,
  Avatar,
  Text,
  Grid,
  List,
  SimpleGrid,
  GridItem,
  Box,
  Link,
  Image,
} from "@chakra-ui/react";

import { QuestionOutlineIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { AppchainInfo } from "types";
import upvote from "assets/icons/up-vote.png";
import downvote from "assets/icons/down-vote.png";

import { useNavigate } from "react-router-dom";
import { DecimalUtil, ZERO_DECIMAL } from "utils";
import { OCT_TOKEN_DECIMALS } from "primitives";
import { Empty } from "components";
import { useWalletSelector } from "components/WalletSelectorContextProvider";
import { providers } from "near-api-js";
import { CodeResult } from "near-api-js/lib/providers/provider";

type VotingItemProps = {
  data: AppchainInfo;
  highestVotes: number;
};

const VotingItem: React.FC<VotingItemProps> = ({ data, highestVotes }) => {
  const hoverBg = useColorModeValue("gray.100", "whiteAlpha.100");

  const { network, selector, accountId } = useWalletSelector();
  const navigate = useNavigate();
  const [votes, setVotes] = useState({ up: 0, down: 0, mine: undefined });

  useEffect(() => {
    if (data.dao_proposal_url && selector) {
      const result =
        /https:\/\/(\S+).astrodao\.com\/dao\/(\S+)\/proposals\/(\S+)-(\d+)/.exec(
          data.dao_proposal_url
        );
      if (result) {
        const [, , , contractId, proposalId] = result;
        const provider = new providers.JsonRpcProvider({
          url: selector.options.network.nodeUrl,
        });

        provider
          .query<CodeResult>({
            request_type: "call_function",
            account_id: contractId,
            method_name: "get_proposal",
            args_base64: btoa(
              JSON.stringify({
                id: Number(proposalId),
              })
            ),
            finality: "final",
          })
          .then((res) => {
            const result = JSON.parse(Buffer.from(res.result).toString());
            let up = 0;
            let down = 0;
            console.log("result", result);

            Object.values(result.votes).forEach((vote: any) => {
              if (vote === "Approve") {
                up += 1;
              } else {
                down += 1;
              }
            });
            setVotes({
              up,
              down,
              mine: accountId ? result.votes[accountId] : undefined,
            });
          })
          .catch((error) => {
            console.log("error", error);
          });
      }
    }
  }, [data.dao_proposal_url, network, selector, accountId]);

  return (
    <Box
      p={4}
      cursor="pointer"
      borderRadius="lg"
      className="transition"
      backgroundColor="transparent"
      _hover={{
        backgroundColor: hoverBg,
        transform: "scale(1.01)",
      }}
      onClick={() => navigate(`/appchains/overview/${data.appchain_id}`)}
    >
      <Grid
        templateColumns={{ base: "repeat(6, 1fr)", md: "repeat(11, 1fr)" }}
        alignItems="center"
        gap={6}
      >
        <GridItem colSpan={3}>
          <HStack>
            <Avatar
              src={data.appchain_metadata?.fungible_token_metadata?.icon as any}
              name={data.appchain_id}
              boxSize={7}
            />
            <Heading
              fontSize="md"
              whiteSpace="nowrap"
              overflow="hidden"
              textOverflow="ellipsis"
            >
              {data.appchain_id}
            </Heading>
          </HStack>
        </GridItem>
        <GridItem colSpan={4} display={{ base: "none", md: "table-cell" }}>
          <SimpleGrid columns={2} gap={6}>
            <HStack spacing={2}>
              <Image
                src={upvote}
                width={8}
                borderRadius="50%"
                border={votes.mine === "Approve" ? "2px solid #7ca4f7" : ""}
                title={votes.mine === "Approve" ? "Voted" : undefined}
              />
              <Text fontWeight="bold" fontSize="large">
                {votes.up}
              </Text>
            </HStack>
            <HStack spacing={2}>
              <Image
                src={downvote}
                width={8}
                borderRadius="50%"
                border={votes.mine === "Reject" ? "2px solid #2468f2" : ""}
                title={votes.mine === "Reject" ? "Voted" : undefined}
              />
              <Text fontWeight="bold" fontSize="large">
                {votes.down}
              </Text>
            </HStack>
          </SimpleGrid>
        </GridItem>
        <GridItem colSpan={3} display={{ base: "none", md: "table-cell" }}>
          <HStack>
            <Link href={data.dao_proposal_url} size="large">
              56
            </Link>
          </HStack>
        </GridItem>
        <GridItem colSpan={1}>
          <Icon
            as={ChevronRightIcon}
            boxSize={6}
            className="octo-gray"
            opacity=".8"
          />
        </GridItem>
      </Grid>
    </Box>
  );
};

export const Voting: React.FC = () => {
  const bg = useColorModeValue("white", "#25263c");

  const { data: appchains } = useSWR("appchains/voting");

  const highestVotes = useMemo(() => {
    if (!appchains?.length) {
      return 0;
    }

    let highest = ZERO_DECIMAL;

    appchains.forEach((appchain: AppchainInfo) => {
      const upvoteDeposit = DecimalUtil.fromString(
        appchain.upvote_deposit,
        OCT_TOKEN_DECIMALS
      );
      const downvoteDeposit = DecimalUtil.fromString(
        appchain.downvote_deposit,
        OCT_TOKEN_DECIMALS
      );
      if (upvoteDeposit.gt(highest)) {
        highest = upvoteDeposit;
      }

      if (downvoteDeposit.gt(highest)) {
        highest = downvoteDeposit;
      }
    });

    return highest.toNumber();
  }, [appchains]);

  return (
    <>
      <Flex alignItems="center" justifyContent="space-between">
        <Tooltip label="Voting Appchains">
          <HStack pl={10}>
            <Heading fontSize="xl">Voting</Heading>
            <Icon as={QuestionOutlineIcon} boxSize={4} className="octo-gray" />
          </HStack>
        </Tooltip>
      </Flex>
      <Box mt={8} bg={bg} p={6} borderRadius="lg">
        {appchains?.length ? (
          <>
            <Box p={4}>
              <Grid
                templateColumns={{
                  base: "repeat(6, 1fr)",
                  md: "repeat(11, 1fr)",
                }}
                className="octo-gray"
                gap={6}
              >
                <GridItem colSpan={3}>ID</GridItem>
                <GridItem
                  colSpan={4}
                  display={{ base: "none", md: "table-cell" }}
                >
                  Votes
                </GridItem>
                <GridItem
                  colSpan={3}
                  display={{ base: "none", md: "table-cell" }}
                >
                  DAO Proposal
                </GridItem>
                <GridItem colSpan={1} />
              </Grid>
            </Box>
            <List>
              {appchains.map((appchain: AppchainInfo, idx: number) => (
                <VotingItem
                  data={appchain}
                  key={`voting-item-${idx}`}
                  highestVotes={highestVotes}
                />
              ))}
            </List>
          </>
        ) : (
          <Empty />
        )}
      </Box>
    </>
  );
};
