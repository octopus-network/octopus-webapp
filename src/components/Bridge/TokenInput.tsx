import {
  Avatar,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  useColorModeValue,
} from "@chakra-ui/react"
import nearLogo from "assets/near.svg"
import { useEffect } from "react"
import { AppchainInfoWithAnchorStatus } from "types"

export default function TokenInpput({
  label,
  chain,
  appchain,
}: {
  label: string
  chain: string
  appchain?: AppchainInfoWithAnchorStatus
}) {
  const grayBg = useColorModeValue("#f2f4f7", "#1e1f34")
  const isEvm = appchain?.appchain_metadata.template_type === "BarnacleEvm"

  useEffect(() => {}, [])
  return (
    <Box bg={grayBg} p={4} borderRadius="lg" pt={2}>
      {/* <Heading fontSize="md" className="octo-gray">
        {label}
      </Heading>
      <Flex mt={3} alignItems="center" justifyContent="space-between">
        <HStack spacing={3} maxW="calc(100% - 120px)">
          <Avatar
            boxSize={8}
            name={chain}
            src={
              chain === "NEAR"
                ? nearLogo
                : (appchain?.appchain_metadata?.fungible_token_metadata
                    .icon as any)
            }
          />
          <Heading
            fontSize="lg"
            textOverflow="ellipsis"
            overflow="hidden"
            whiteSpace="nowrap"
          >
            {fromAccount || chain}
          </Heading>
        </HStack>
        {!fromAccount ? (
          isReverse ? (
            <Button
              colorScheme="octo-blue"
              isLoading={isLogging}
              isDisabled={isLogging}
              onClick={onLogin}
              size="sm"
            >
              Connect
            </Button>
          ) : (
            <Button
              colorScheme="octo-blue"
              onClick={async () => {
                // eth
                if (isEvm) {
                  if (typeof window.ethereum !== "undefined") {
                    console.log("MetaMask is installed!")
                    window.ethereum
                      .request({
                        method: "eth_requestAccounts",
                      })
                      .then((res: any) => {
                        console.log("res", res)
                      })
                      .catch(console.error)
                  }
                } else {
                  // polkadot
                  setSelectAccountModalOpen.on()
                }
              }}
              size="sm"
            >
              Connect
            </Button>
          )
        ) : isReverse ? (
          <Button variant="white" onClick={onLogout} size="sm">
            Disconnect
          </Button>
        ) : (
          <Button
            variant="white"
            onClick={setSelectAccountModalOpen.on}
            size="sm"
          >
            Change
          </Button>
        )}
      </Flex> */}
    </Box>
  )
}
