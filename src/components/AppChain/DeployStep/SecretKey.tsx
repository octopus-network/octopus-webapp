import {
  Box,
  Flex,
  Input,
  Select,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import useGCP from "hooks/useGCP";
import useSWR from "swr";
import { CloudVendor } from "types";
import RecommendInstance from "./RecommendInstance";

export default function SecretKey({
  appchainId,
  secretKey,
  setSecretKey,
  setDeployRegion,
  cloudVendor,
}: {
  appchainId?: string;
  secretKey: string;
  setSecretKey: (key: string) => void;
  setDeployRegion: (region: string) => void;
  cloudVendor: CloudVendor;
}) {
  const inputBg = useColorModeValue("#f5f7fa", "whiteAlpha.100");
  const { data: deployConfig } = useSWR("deploy-config");
  const { projects } = useGCP();

  return (
    <Flex pt={2} pb={4} justifyContent="center" flexDirection="column" gap={4}>
      <RecommendInstance appchainId={appchainId} cloudVendor={cloudVendor} />
      <Flex bg={inputBg} p={1} borderRadius="lg">
        {cloudVendor === CloudVendor.GCP ? (
          <>
            <Box p={2}>
              <Text variant="gray">Project</Text>
            </Box>
            <Box flex={1}>
              <Select
                variant="unstyled"
                p={2}
                defaultValue=""
                onChange={(e) => setSecretKey(e.target.value)}
                textAlign="right"
              >
                {(projects || []).map((project: any, idx: number) => (
                  <option value={project.projectId} key={`option-${idx}`}>
                    {project.projectId}
                  </option>
                ))}
              </Select>
            </Box>
          </>
        ) : (
          <Input
            variant="unstyled"
            placeholder={
              cloudVendor === CloudVendor.AWS
                ? "Secret Key"
                : "Token (e.g., dop_v1_***)"
            }
            w="100%"
            p={2}
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
          />
        )}
      </Flex>
      <Flex bg={inputBg} p={1} borderRadius="lg" alignItems="center">
        <Box p={2}>
          <Text variant="gray">Deploy region</Text>
        </Box>
        <Box flex={1}>
          <Select
            variant="unstyled"
            p={2}
            defaultValue=""
            onChange={(e) => setDeployRegion(e.target.value)}
            textAlign="right"
          >
            {deployConfig?.regions.map((region: any, idx: number) => (
              <option value={region.value} key={`option-${idx}`}>
                {region.label}
              </option>
            ))}
          </Select>
        </Box>
      </Flex>
    </Flex>
  );
}
