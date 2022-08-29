import { Container, Flex } from "@chakra-ui/react"
import CreatePool from "components/Convertor/CreatePool"
import MyPool from "components/Convertor/MyPool"
import PoolList from "components/Convertor/PoolList"
import { useWalletSelector } from "components/WalletSelectorContextProvider"
import { usePools, useWhitelist } from "hooks/useConvertorContract"
import useSWR from "swr"
import { ConverterConfig, NetworkType } from "types"

export function Converter() {
  const { accountId, networkConfig } = useWalletSelector()
  const { data } = useSWR<ConverterConfig>(`converter-config`)

  const contractId = data
    ? data[networkConfig?.near.networkId ?? NetworkType.TESTNET].contractId
    : ""

  const { whitelist, isLoading: isLoadingWhitelist } = useWhitelist(contractId)

  const { pools, isLoading: isLoadingPools } = usePools(contractId, 0, 30)

  const myPools = pools.filter((p) => p.creator === accountId)

  return (
    <Container position="relative">
      <Flex direction="column" pt={10}>
        <MyPool pools={myPools} whitelist={whitelist} contractId={contractId} />
        <CreatePool whitelist={whitelist} contractId={contractId} />

        <PoolList
          pools={pools}
          whitelist={whitelist}
          isLoading={isLoadingWhitelist || isLoadingPools}
          contractId={contractId}
        />
      </Flex>
    </Container>
  )
}
