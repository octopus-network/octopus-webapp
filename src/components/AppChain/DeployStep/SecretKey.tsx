import {
  Box,
  Flex,
  Input,
  Select,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { DEPLOY_CONFIG } from "config";
import { useEffect } from "react";
import { CloudVendor } from "types";
import RecommendInstance from "./RecommendInstance";

export default function SecretKey({
  appchainId,
  secretKey,
  setSecretKey,
  setDeployRegion,
  cloudVendor,
  projects,
}: {
  appchainId?: string;
  secretKey: string;
  setSecretKey: (key: string) => void;
  setDeployRegion: (region: string) => void;
  cloudVendor: CloudVendor;
  projects: any[];
}) {
  const inputBg = useColorModeValue("#f5f7fa", "whiteAlpha.100");

  useEffect(() => {
    if (!secretKey && cloudVendor === CloudVendor.GCP && projects) {
      if (projects?.length === 0) {
        // Toast.error(
        //   "No project found on GCP console, please create a project first"
        // );
      } else {
        setSecretKey(projects[0]?.projectId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secretKey, cloudVendor, projects]);

  return (
    <Flex pt={2} pb={4} justifyContent="center" flexDirection="column" gap={4}>
      <RecommendInstance appchainId={appchainId} cloudVendor={cloudVendor} />
      <Flex bg={inputBg} p={1} borderRadius="md">
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
      <Flex bg={inputBg} p={1} borderRadius="md" alignItems="center">
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
            {DEPLOY_CONFIG?.regions.map((region: any, idx: number) => (
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
