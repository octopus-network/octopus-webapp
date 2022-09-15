import { Flex, Heading, HStack, Text } from "@chakra-ui/react"
import { RippleDot } from "components/RippleDot"
import { ValidatorStatus } from "types"

const validatorStatusConfig = {
  [ValidatorStatus.Registered]: {
    label: "Register",
    desc: "missing session keys",
    color: "#00739D",
  },
  [ValidatorStatus.Validating]: {
    label: "Validating",
    desc: "",
    color: "#00C781",
  },
  [ValidatorStatus.Unstaking]: {
    label: "Unstaking",
    desc: "",
    color: "#CCCCCC",
  },
  [ValidatorStatus.Validating_N_Not_Producing]: {
    label: "Validating",
    desc: "not producing blocks",
    color: "#FF4040",
  },
  [ValidatorStatus.New]: {
    label: "New",
    desc: "coming next day(era)",
    color: "#6FFFB0",
  },
}

export default function ValidatorStatusTag({
  status,
}: {
  status: ValidatorStatus
}) {
  const config = validatorStatusConfig[status]
  return (
    <HStack>
      <Flex bg={config.color} p="4px 6px" borderRadius="3xl" w="auto" gap={1}>
        <RippleDot size={16} color="white" />
        <Heading fontSize="14px" color="white" fontWeight={500}>
          {config.label}
        </Heading>
      </Flex>
      <Text color="#FF4040">{config.desc}</Text>
    </HStack>
  )
}
