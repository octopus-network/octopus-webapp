import React from "react";
import useSWR from "swr";

import {
  Flex,
  HStack,
  Heading,
  Tooltip,
  useColorModeValue,
  Icon,
  Avatar,
  Grid,
  List,
  GridItem,
  Box,
} from "@chakra-ui/react";

import { QuestionOutlineIcon, ChevronRightIcon } from "@chakra-ui/icons";

import { DecimalUtil } from "utils";
import { AppchainInfo } from "types";
import { useNavigate } from "react-router-dom";

import { Empty } from "components";

type BootingItemProps = {
  data: AppchainInfo;
};

const BootingItem: React.FC<BootingItemProps> = ({ data }) => {
  const hoverBg = useColorModeValue("gray.100", "whiteAlpha.100");
  const navigate = useNavigate();

  return (
    <Box
      p={4}
      cursor="pointer"
      borderRadius="md"
      className="transition"
      backgroundColor="transparent"
      _hover={{
        backgroundColor: hoverBg,
        transform: "scale(1.01)",
      }}
      onClick={() => navigate(`/appchains/overview/${data.appchain_id}`)}
    >
      <Grid
        templateColumns={{ base: "repeat(7, 1fr)", md: "repeat(10, 1fr)" }}
        alignItems="center"
        gap={6}
      >
        <GridItem colSpan={3}>
          <HStack>
            <Avatar
              src={data.appchain_metadata?.fungible_token_metadata?.icon as any}
              name={data.appchain_id}
              boxSize={8}
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
        <GridItem colSpan={3} display={{ base: "none", md: "table-cell" }}>
          <Heading fontSize="md">{data.validator_count}</Heading>
        </GridItem>
        <GridItem colSpan={3}>
          <Heading fontSize="md">
            {DecimalUtil.formatAmount(data.total_stake)} OCT
          </Heading>
        </GridItem>
        <GridItem colSpan={1}>
          <HStack position="relative" justifyContent="flex-end">
            <Icon
              as={ChevronRightIcon}
              boxSize={6}
              className="octo-gray"
              opacity=".8"
            />
          </HStack>
        </GridItem>
      </Grid>
    </Box>
  );
};

export const Booting: React.FC = () => {
  const bg = useColorModeValue("white", "#25263c");

  const { data: appchains } = useSWR("appchains/booting");

  return (
    <>
      <Flex>
        <Tooltip label="Booting Appchains">
          <HStack>
            <Heading fontSize="xl">Booting</Heading>
            <Icon as={QuestionOutlineIcon} boxSize={4} className="octo-gray" />
          </HStack>
        </Tooltip>
      </Flex>
      <Box mt={8} bg={bg} p={6} borderRadius="md">
        {appchains?.length ? (
          <>
            <Box p={4}>
              <Grid
                templateColumns={{
                  base: "repeat(7, 1fr)",
                  md: "repeat(10, 1fr)",
                }}
                className="octo-gray"
                gap={6}
              >
                <GridItem colSpan={3}>ID</GridItem>
                <GridItem
                  colSpan={3}
                  display={{ base: "none", md: "table-cell" }}
                >
                  Validators
                </GridItem>
                <GridItem colSpan={3}>Staked</GridItem>
                <GridItem colSpan={1} />
              </Grid>
            </Box>
            <List>
              {appchains.map((appchain: AppchainInfo, idx: number) => (
                <BootingItem data={appchain} key={`booting-item-${idx}`} />
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
