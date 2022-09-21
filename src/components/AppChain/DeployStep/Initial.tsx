import { Box, Flex, Input, Text, useColorModeValue } from "@chakra-ui/react"
import { CloudVendor, Validator } from "types"
import { Select, chakraComponents } from "chakra-react-select"
import { FaAws, FaDigitalOcean } from "react-icons/fa"

const customComponents = {
  Option: ({ children, ...props }: any) => {
    return (
      <chakraComponents.Option {...props}>
        {props.data.icon}
        <Box ml={2}>{children}</Box>
      </chakraComponents.Option>
    )
  },
  Input: ({ children, ...props }: any) => {
    let icon = null
    let label = ""
    if (props.hasValue) {
      const value = props.getValue()[0]
      icon =
        CloudVendor.AWS === value.label ? (
          <FaAws size={20} />
        ) : (
          <FaDigitalOcean size={20} />
        )
      label = value.label
    }

    return (
      <chakraComponents.Option {...props} selectProps={{ size: "md" }}>
        {icon}
        <Text ml={2} fontSize="md">
          {label}
        </Text>
      </chakraComponents.Option>
    )
  },
  SingleValue: () => null,
}

export default function Initial({
  cloudAccessKey,
  validator,
  cloudVendor,
  setCloudVendor,
  setInputAccessKey,
}: {
  cloudAccessKey: string
  validator?: Validator
  cloudVendor: CloudVendor
  setCloudVendor: (cloudVendor: CloudVendor) => void
  setInputAccessKey: (inputAccessKey: string) => void
}) {
  const inputBg = useColorModeValue("#f5f7fa", "whiteAlpha.100")

  return (
    <>
      <Flex pt={4} pb={4} justifyContent="center" flexDirection="column">
        <Flex bg={inputBg} p={1} borderRadius="lg">
          <Box>
            <Select
              value={{
                label: cloudVendor,
                value: cloudVendor,
                icon:
                  CloudVendor.AWS === cloudVendor ? (
                    <FaAws />
                  ) : (
                    <FaDigitalOcean />
                  ),
              }}
              options={[CloudVendor.AWS, CloudVendor.DO].map((t) => {
                return {
                  label: t,
                  value: t,
                  icon:
                    CloudVendor.AWS === t ? (
                      <FaAws size={26} />
                    ) : (
                      <FaDigitalOcean size={26} />
                    ),
                }
              })}
              onChange={(newValue) => {
                if (newValue) {
                  setCloudVendor(newValue.value as CloudVendor)
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
  )
}
