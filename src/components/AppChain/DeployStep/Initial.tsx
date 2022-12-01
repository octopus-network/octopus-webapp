import {
  Box,
  Button,
  Flex,
  Icon,
  Input,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { CloudVendor, Validator } from "types";
import { Select, chakraComponents } from "chakra-react-select";
import { FaAws, FaDigitalOcean } from "react-icons/fa";
import { SiGooglecloud } from "react-icons/si";
import { useEffect } from "react";
import { FcGoogle } from "react-icons/fc";
import useGCP from "hooks/useGCP";
import { useWalletSelector } from "components/WalletSelectorContextProvider";

const VendorIcons = {
  [CloudVendor.AWS]: FaAws,
  [CloudVendor.DO]: FaDigitalOcean,
  [CloudVendor.GCP]: SiGooglecloud,
};

const customComponents = {
  Option: ({ children, ...props }: any) => {
    return (
      <chakraComponents.Option {...props}>
        {props.data.icon}
        <Box ml={2}>{children}</Box>
      </chakraComponents.Option>
    );
  },
  Input: ({ children, ...props }: any) => {
    let icon = null;
    let label = "";
    if (props.hasValue) {
      const value = props.getValue()[0];
      const VendorIcon = VendorIcons[value.label as CloudVendor];
      icon = <VendorIcon size={20} />;
      label = value.label;
    }

    return (
      <chakraComponents.Option {...props} selectProps={{ size: "md" }}>
        {icon}
        <Text ml={2} fontSize="md">
          {label}
        </Text>
      </chakraComponents.Option>
    );
  },
  SingleValue: () => null,
};

export default function Initial({
  cloudAccessKey,
  validator,
  cloudVendor,
  setCloudVendor,
  setInputAccessKey,
}: {
  cloudAccessKey: string;
  validator?: Validator;
  cloudVendor: CloudVendor;
  setCloudVendor: (cloudVendor: CloudVendor) => void;
  setInputAccessKey: (inputAccessKey: string) => void;
}) {
  const inputBg = useColorModeValue("#f5f7fa", "whiteAlpha.100");
  const VendorIcon = VendorIcons[cloudVendor];
  const { network } = useWalletSelector();

  const { onLogin, oauthUser } = useGCP();

  // useEffect(() => {
  //   if (oauthUser && cloudVendor === CloudVendor.GCP) {
  //     setInputAccessKey(oauthUser.Bc.access_token);
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [oauthUser, cloudVendor]);

  return (
    <>
      <Flex pt={4} pb={4} justifyContent="center" flexDirection="column">
        <Flex bg={inputBg} p={1} borderRadius="lg">
          <Box>
            <Select
              value={{
                label: cloudVendor,
                value: cloudVendor,
                icon: <VendorIcon />,
              }}
              options={[CloudVendor.AWS, CloudVendor.DO].map(
                (t) => {
                  const VendorIcon = VendorIcons[t];
                  return {
                    label: t,
                    value: t,
                    icon: <VendorIcon size={26} />,
                  };
                }
              )}
              onChange={(newValue) => {
                if (newValue) {
                  setCloudVendor(newValue.value as CloudVendor);
                }
              }}
              components={customComponents}
            />
          </Box>
          <Flex flex={1} alignItems="center">
            {[CloudVendor.AWS, CloudVendor.DO].includes(cloudVendor) && (
              <Input
                variant="unstyled"
                placeholder={
                  cloudVendor === CloudVendor.AWS
                    ? "Access Key"
                    : "Digital Ocean Token Name"
                }
                w="100%"
                p={2}
                value={cloudAccessKey}
                onChange={(e) => setInputAccessKey(e.target.value)}
              />
            )}
            {cloudVendor === CloudVendor.GCP &&
              (oauthUser ? (
                <Text pl={4}>{oauthUser.sub}</Text>
              ) : (
                <Button
                  size="sm"
                  onClick={onLogin}
                  variant="ghost"
                  colorScheme="octo-blue"
                  ml={4}
                >
                  <Icon as={FcGoogle} mr={1} /> Sign in with Google
                </Button>
              ))}
          </Flex>
        </Flex>
        {!!validator && (
          <Text fontSize="sm" variant="gray" mt={1}>
            It seems you're a validator already, enter{" "}
            {cloudVendor === CloudVendor.AWS
              ? "Access Key"
              : "Digital Ocean Token Name"}{" "}
            to check your node status
          </Text>
        )}
      </Flex>
    </>
  );
}
