/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react"

import {
  Box,
  List,
  HStack,
  Heading,
  Avatar,
  Button,
  useColorModeValue,
  Text,
  Image,
  VStack,
  SimpleGrid,
} from "@chakra-ui/react"

import { TokenAsset, CollectibleContract, Collectible } from "types"

import { Empty, BaseModal } from "components"
import { useGlobalStore } from "stores"
import failedToLoad from "assets/failed_to_load.svg"
import { ApiPromise } from "@polkadot/api"

type SelectTokenModalProps = {
  isOpen: boolean
  onClose: VoidFunction
  selectedToken?: string
  tokens: TokenAsset[] | undefined
  isReverse?: boolean
  appchainApi: ApiPromise | undefined
  fromAccount: string | undefined
  appchainId: string | undefined
  collectibleClasses?: number[]
  onSelectToken: (
    account: TokenAsset | Collectible,
    isCollectible?: boolean
  ) => void
}

export const SelectTokenModal: React.FC<SelectTokenModalProps> = ({
  tokens,
  isOpen,
  onClose,
  onSelectToken,
  selectedToken,
  appchainId,
  appchainApi,
  fromAccount,
  isReverse = false,
  collectibleClasses = [],
}) => {
  const bg = useColorModeValue("#f6f7fa", "#15172c")
  const [tabIdx, setTabIdx] = useState(0)
  const [collectibles, setCollectibles] = useState<Collectible[]>()

  const { global } = useGlobalStore()

  useEffect(() => {
    if (
      !collectibleClasses?.length ||
      !appchainId ||
      !global.registry ||
      !fromAccount
    ) {
      setCollectibles([])
      return
    }

    if (isReverse) {
      const promises = collectibleClasses.map((classId) => {
        const contract = new CollectibleContract(
          global.wallet?.account() as any,
          `${classId}.${appchainId}.${global.registry?.contractId}`,
          {
            viewMethods: ["nft_tokens_for_owner"],
            changeMethods: [],
          }
        )

        return contract
          .nft_tokens_for_owner({
            account_id: fromAccount,
            from_index: "0",
          })
          .then((res) =>
            res ? res.map((item: any) => ({ ...item, class: classId })) : null
          )
      })

      Promise.all(promises).then((res) => {
        const tmpArr: any[] = res?.length
          ? res.flat(Infinity).map((item: any) => ({
              id: item.token_id,
              class: item.class,
              owner: item.owner_id,
              metadata: {
                name: item.metadata?.title,
                mediaUri: item.metadata?.media,
              },
            }))
          : []

        setCollectibles(tmpArr)
      })
    } else {
      if (!appchainApi?.isReady) {
        return
      }
      const promises = collectibleClasses.map((classId) => {
        return appchainApi.query.octopusUniques.class(classId).then((info) => {
          const { instances } = (info?.toJSON() as any) || {}

          const tmpPromises = []

          for (let i = 1; i <= instances; i++) {
            tmpPromises.push(
              appchainApi.query.octopusUniques
                .asset(classId, i)
                .then(async (res) => {
                  console.log("res.toJSON()", res.toJSON())

                  try {
                    if (res) {
                      const _res =
                        await appchainApi.query.octopusUniques.instanceMetadataOf(
                          classId,
                          i
                        )

                      const data = JSON.parse((_res.toHuman() as any).data)

                      return {
                        ...(res.toJSON() as any),
                        id: i,
                        class: classId,
                        metadata: data,
                      }
                    }
                  } catch (error) {}

                  return null
                })
            )
          }

          return Promise.all(tmpPromises).then((res) =>
            res?.filter((item) => !!item && item.owner === fromAccount)
          )
        })
      })

      Promise.all(promises).then((res) => {
        const tmpArr: any[] = res?.length
          ? res.flat(Infinity).map((item: any) => {
              console.log("item", item)

              return {
                id: item.id,
                class: item.class,
                owner: item.owner,
                metadata: item.metadata,
              }
            })
          : []

        setCollectibles(tmpArr)
      })
    }
  }, [
    appchainId,
    JSON.stringify(collectibleClasses),
    isReverse,
    global,
    fromAccount,
    appchainApi,
    isOpen,
  ])

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} maxW="xl">
      <HStack mt={2} spacing={3}>
        <Heading fontSize="lg">Select</Heading>
        <HStack spacing={0}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setTabIdx(0)}
            colorScheme={tabIdx === 0 ? "octo-blue" : "teal"}
            opacity={tabIdx === 0 ? 1 : 0.5}
          >
            Token
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setTabIdx(1)}
            colorScheme={tabIdx === 1 ? "octo-blue" : "teal"}
            opacity={tabIdx === 1 ? 1 : 0.5}
          >
            Collectible
          </Button>
        </HStack>
      </HStack>
      {tabIdx === 0 ? (
        <Box mt={4}>
          {!tokens?.length ? (
            <Empty message="No Tokens" />
          ) : (
            <List spacing={3} minH="15vh">
              {tokens?.map((token) => (
                <Box
                  p={2}
                  bg={selectedToken === token.metadata.symbol ? bg : ""}
                  _hover={{ background: bg }}
                  key={token.contractId}
                  borderRadius="lg"
                  cursor="pointer"
                  onClick={() => onSelectToken(token)}
                >
                  <HStack w="calc(100% - 100px)">
                    <Avatar
                      name={token.metadata.symbol}
                      src={token.metadata.icon as any}
                      boxSize={8}
                      size="sm"
                    />
                    <VStack alignItems="flex-start" spacing={0}>
                      <Heading fontSize="md">
                        {token.metadata.symbol || "UNKNOWN"}
                      </Heading>
                      <Text fontSize="xs" color="gray">
                        {token.metadata.name}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              ))}
            </List>
          )}
        </Box>
      ) : (
        <Box p={4}>
          {!collectibles?.length ? (
            <Empty message="No Collectibles" />
          ) : (
            <SimpleGrid columns={[2, 3]} gap={5}>
              {collectibles.map((c, idx) => (
                <Box
                  key={`collectible-${idx}`}
                  cursor="pointer"
                  onClick={() => onSelectToken(c, true)}
                >
                  <Box bg={bg} borderRadius="lg" overflow="hidden">
                    <Image src={c.metadata?.mediaUri ?? failedToLoad} />
                  </Box>
                  <Heading fontSize="md" mt={2} textAlign="center">
                    {c.metadata.name}
                  </Heading>
                </Box>
              ))}
            </SimpleGrid>
          )}
        </Box>
      )}
    </BaseModal>
  )
}
