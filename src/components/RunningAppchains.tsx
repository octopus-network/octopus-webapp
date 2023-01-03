import React, { useEffect, useMemo } from "react";
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
import { OCT_TOKEN_DECIMALS } from "primitives";

import { AppchainInfo, AppchainInfoWithAnchorStatus } from "types";
import useLocalStorage from "hooks/useLocalStorage";

type RunningAppchainsProps = {
  showMore?: boolean;
};

type RunningItemProps = {
  whiteBg?: boolean;
  data: AppchainInfo;
};

const RunningItem: React.FC<RunningItemProps> = ({ whiteBg = false, data }) => {
  const bg = useColorModeValue(whiteBg ? "white" : "#f6f7fa", "#15172c");
  const iconBg = useColorModeValue("white", "whiteAlpha.100");

  const navigate = useNavigate();

  const icon = useMemo(
    () => data.appchain_metadata?.fungible_token_metadata?.icon || "",
    [data]
  );

  const { data: appchain } = useSWR<AppchainInfoWithAnchorStatus>(
    `appchain/${data.appchain_id}`
  );

  return (
    <Box
      bg={bg}
      borderRadius="lg"
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
          <Skeleton isLoaded={!!appchain}>
            <Heading fontSize="lg">
              {appchain?.anchor_status?.delegator_count_in_next_era ||
                "loading"}
            </Heading>
          </Skeleton>
        </VStack>
        <VStack alignItems="flex-start">
          <Text variant="gray" fontSize="sm">
            Staked OCT
          </Text>
          <Heading fontSize="lg">
            {DecimalUtil.beautify(
              DecimalUtil.fromString(data.total_stake, OCT_TOKEN_DECIMALS),
              0
            )}
          </Heading>
        </VStack>
        <VStack alignItems="flex-start">
          <Text variant="gray" fontSize="sm">
            APY
          </Text>
          <Heading fontSize="lg">{appchain?.apy || "-"}</Heading>
        </VStack>
      </Flex>
    </Box>
  );
};

const BlankItem: React.FC<Omit<RunningItemProps, "data">> = ({ whiteBg }) => {
  const bg = useColorModeValue(whiteBg ? "white" : "#f6f7fa", "#15172c");

  return (
    <Box bg={bg} borderRadius="lg" p={6}>
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

export const RunningAppchains: React.FC<RunningAppchainsProps> = ({
  showMore = true,
}) => {
  const { data } = useSWR<AppchainInfo[]>("appchains/running");
  const [vendorKeys, setVendorKeys] = useLocalStorage("vendorKeys", null);

  useEffect(() => {
    if (!vendorKeys && data) {
      const obj: { [key in string]: any } = {};
      const vendor = localStorage.getItem("OCTOPUS_DEPLOYER_CloudVendor");
      const key = localStorage.getItem("OCTOPUS_DEPLOYER_ACCESS_KEY");
      data.forEach((item) => {
        obj[item.appchain_id] = {
          vendor: vendor || "",
          key: key || "",
        };
      });
      setVendorKeys(obj);
      localStorage.removeItem("OCTOPUS_DEPLOYER_CloudVendor");
      localStorage.removeItem("OCTOPUS_DEPLOYER_ACCESS_KEY");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, vendorKeys]);

  return (
    <>
      <Flex alignItems="center" justifyContent="space-between">
        <Heading fontSize="xl">Running Appchains</Heading>
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
          </>
        ) : (
          data.map((item: any, idx: number) => (
            <RunningItem key={`item-${idx}`} whiteBg={!showMore} data={item} />
          ))
        )}
      </SimpleGrid>
    </>
  );
};
