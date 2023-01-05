import React, { useMemo } from "react";
import useSWR from "swr";

import {
  Flex,
  Heading,
  Avatar,
  Text,
  HStack,
  Box,
  Link,
  SimpleGrid,
  VStack,
  useColorModeValue,
  Skeleton,
  SkeletonCircle,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { ChevronRightIcon } from "@chakra-ui/icons";
import { Link as RouterLink } from "react-router-dom";
import { DecimalUtil } from "utils";
import { AppchainInfo, Delegator, Validator } from "types";

type RunningAppchainsProps = {
  showMore?: boolean;
};

type FrozenItemProps = {
  whiteBg?: boolean;
  data: AppchainInfo;
};

const FrozenItem: React.FC<FrozenItemProps> = ({ whiteBg = false, data }) => {
  const bg = useColorModeValue(whiteBg ? "white" : "#f6f7fa", "#15172c");
  const iconBg = useColorModeValue("white", "whiteAlpha.100");

  const navigate = useNavigate();

  const icon = useMemo(
    () => data.appchain_metadata?.fungible_token_metadata?.icon || "",
    [data]
  );
  const { data: validators } = useSWR<Validator[]>(
    `validators/${data.appchain_id}`
  );

  const { data: delegatorsArr } = useSWR<Delegator[][]>(
    validators?.length
      ? `${validators.map((v) => v.validator_id).join(",")}/${
          data.appchain_id
        }/delegators`
      : null
  );

  const delegatorsCount = useMemo(
    () => delegatorsArr?.flat(Infinity).length,
    [delegatorsArr]
  );

  return (
    <Box
      bg={bg}
      borderRadius="md"
      p={6}
      cursor="pointer"
      transition="all .3s ease"
      _hover={{
        boxShadow: "0 10px 10px -5px rgba(0,0,12,.06)",
        transform: "translateY(-3px) scale(1.01)",
      }}
      onClick={() => navigate(`/appchains/${data?.appchain_id}`)}
    >
      <Flex justifyContent="space-between" alignItems="center">
        <HStack>
          <Avatar
            src={icon as any}
            style={icon ? { backgroundColor: iconBg } : {}}
            name={data.appchain_id}
            boxSize={9}
          />
          <Heading fontSize="lg">{data.appchain_id}</Heading>
        </HStack>
      </Flex>
      <Flex mt={6} justifyContent="space-between">
        <VStack alignItems="flex-start">
          <Text variant="gray" fontSize="sm">
            Validators
          </Text>
          <Heading fontSize="lg">{data.validator_count}</Heading>
        </VStack>
        <VStack alignItems="flex-start">
          <Text variant="gray" fontSize="sm">
            Delegators
          </Text>
          <Skeleton
            isLoaded={validators?.length ? delegatorsCount !== undefined : true}
          >
            <Heading fontSize="lg">
              {validators?.length
                ? delegatorsCount === undefined
                  ? "loading"
                  : delegatorsCount
                : "0"}
            </Heading>
          </Skeleton>
        </VStack>
        <VStack alignItems="flex-start">
          <Text variant="gray" fontSize="sm">
            Staked OCT
          </Text>
          <Heading fontSize="lg">
            {DecimalUtil.formatAmount(data.total_stake)}
          </Heading>
        </VStack>
        <VStack alignItems="flex-start">
          <Text variant="gray" fontSize="sm">
            APY
          </Text>
          <Heading fontSize="lg">{"0%"}</Heading>
        </VStack>
      </Flex>
    </Box>
  );
};

const BlankItem: React.FC<Omit<FrozenItemProps, "data">> = ({ whiteBg }) => {
  const bg = useColorModeValue(whiteBg ? "white" : "#f6f7fa", "#15172c");

  return (
    <Box bg={bg} borderRadius="md" p={6}>
      <Flex justifyContent="space-between">
        <HStack>
          <SkeletonCircle boxSize={10} />
          <Skeleton>
            <Heading fontSize="lg">loading</Heading>
          </Skeleton>
        </HStack>
      </Flex>
      <Flex mt={6} justifyContent="space-between">
        <VStack alignItems="flex-start">
          <Skeleton>
            <Text variant="gray" fontSize="sm">
              loading
            </Text>
          </Skeleton>
          <Skeleton>
            <Heading fontSize="lg">loading</Heading>
          </Skeleton>
        </VStack>
        <VStack alignItems="flex-start">
          <Skeleton>
            <Text variant="gray" fontSize="sm">
              loading
            </Text>
          </Skeleton>
          <Skeleton>
            <Heading fontSize="lg">loading</Heading>
          </Skeleton>
        </VStack>
        <VStack alignItems="flex-start">
          <Skeleton>
            <Text variant="gray" fontSize="sm">
              loading
            </Text>
          </Skeleton>
          <Skeleton>
            <Heading fontSize="lg">loading</Heading>
          </Skeleton>
        </VStack>
        <VStack alignItems="flex-start">
          <Skeleton>
            <Text variant="gray" fontSize="sm">
              loading
            </Text>
          </Skeleton>
          <Skeleton>
            <Heading fontSize="lg">loading</Heading>
          </Skeleton>
        </VStack>
      </Flex>
    </Box>
  );
};

export const FrozenAppchains: React.FC<RunningAppchainsProps> = ({
  showMore = true,
}) => {
  const { data } = useSWR("appchains/frozen");

  if (data && data.length === 0) {
    return null;
  }

  return (
    <>
      <Flex alignItems="center" justifyContent="space-between">
        <Heading fontSize="xl">Frozen/Broken Appchains</Heading>
        {showMore ? (
          <Link as={RouterLink} to="/appchains" variant="gray-underline">
            <HStack spacing={0}>
              <Text>More</Text>
              <ChevronRightIcon />
            </HStack>
          </Link>
        ) : null}
      </Flex>
      <SimpleGrid gap={8} mt={8} columns={{ base: 1, md: 2 }}>
        {!data?.length ? (
          <>
            <BlankItem whiteBg={!showMore} />
            <BlankItem whiteBg={!showMore} />
          </>
        ) : (
          data.map((item: any, idx: number) => (
            <FrozenItem key={`item-${idx}`} whiteBg={!showMore} data={item} />
          ))
        )}
      </SimpleGrid>
    </>
  );
};
