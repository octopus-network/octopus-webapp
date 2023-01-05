import {
  Box,
  Flex,
  Img,
  Input,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { CloudVendor, Validator } from "types";
import { Select, chakraComponents } from "chakra-react-select";
import { FaAws, FaDigitalOcean } from "react-icons/fa";
import { SiGooglecloud } from "react-icons/si";
import { useEffect } from "react";
import GoogleSignIn from "assets/google_signin.png";

const VendorIcons = {
  [CloudVendor.AWS]: FaAws,
  [CloudVendor.DO]: FaDigitalOcean,
  [CloudVendor.GCP]: SiGooglecloud,
};

const Tips = {
  [CloudVendor.AWS]:
    "It seems you're a validator already, enter Access Key to check your node status",
  [CloudVendor.DO]:
    "It seems you're a validator already, enter Digital Ocean Token Name to check your node status",
  [CloudVendor.GCP]:
    "It seems you're a validator already, sign in with Google to check your node status",
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
  onLogin,
  oauthUser,
}: {
  cloudAccessKey: string;
  validator?: Validator;
  cloudVendor: CloudVendor;
  setCloudVendor: (cloudVendor: CloudVendor) => void;
  setInputAccessKey: (inputAccessKey: string) => void;
  onLogin: () => void;
  oauthUser: any;
}) {
  const inputBg = useColorModeValue("#f5f7fa", "whiteAlpha.100");
  const VendorIcon = VendorIcons[cloudVendor];

  useEffect(() => {
    if (oauthUser && cloudVendor === CloudVendor.GCP) {
      setInputAccessKey(oauthUser.email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oauthUser, cloudVendor]);

  return (
    <>
      <Flex pt={4} pb={4} justifyContent="center" flexDirection="column">
        <Flex bg={inputBg} p={1} borderRadius="md">
          <Box>
            <Select
              value={{
                label: cloudVendor,
                value: cloudVendor,
                icon: <VendorIcon />,
              }}
              options={[CloudVendor.AWS, CloudVendor.DO, CloudVendor.GCP].map(
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
                <Text pl={4}>{oauthUser.email}</Text>
              ) : (
                <Img
                  src={GoogleSignIn}
                  height="44px"
                  alt="Google Sign In"
                  borderRadius={10}
                  ml={8}
                  onClick={onLogin}
                  cursor="pointer"
                />
              ))}
          </Flex>
        </Flex>
        {!!validator && (
          <Text fontSize="sm" variant="gray" mt={1}>
            {Tips[cloudVendor]}
          </Text>
        )}
      </Flex>
    </>
  );
}
