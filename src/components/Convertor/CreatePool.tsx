import {
  Flex,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  Input,
  Switch,
  Text,
  Box,
  Image,
  useToast,
  ModalCloseButton,
} from '@chakra-ui/react'
import { BN } from '@polkadot/util'
import { Select, chakraComponents } from 'chakra-react-select'
import { useConvertorContract } from 'hooks/useConvertorContract'
import { parseNearAmount } from 'near-api-js/lib/utils/format'
import { SIMPLE_CALL_GAS } from 'primitives'
import { useState } from 'react'
import { FiArrowDown, FiPlus, FiRepeat } from 'react-icons/fi'
import { useGlobalStore } from 'stores'
import { FungibleTokenMetadata } from 'types'

const customComponents = {
  Option: ({ children, ...props }: any) => (
    <chakraComponents.Option {...props}>
      {props.data.icon}
      <Box ml={2}>{children}</Box>
    </chakraComponents.Option>
  ),
}

interface PoolProps {
  in_token: string
  out_token: string
  is_reversible: boolean
  in_token_rate: string
  out_token_rate: string
  in_token_decimals: number
  out_token_decimals: number
}

export default function CreatePool({
  whitelist,
}: {
  whitelist: FungibleTokenMetadata[]
}) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [pool, setPool] = useState<PoolProps>({
    in_token: '',
    out_token: '',
    in_token_rate: '',
    out_token_rate: '',
    is_reversible: false,
    in_token_decimals: 0,
    out_token_decimals: 0,
  })

  const toast = useToast()
  const { global } = useGlobalStore()
  // const contract = useConvertorContract(
  //   global.wallet?.account() as any,
  //   'contract.convertor.testnet'
  // )
  const onCreate = async () => {
    try {
      await global.wallet?.account().functionCall({
        contractId: 'contract.convertor.testnet',
        methodName: 'create_pool',
        args: {
          in_token: pool.in_token,
          out_token: pool.out_token,
          in_token_rate: Number(pool.in_token_rate),
          out_token_rate: Number(pool.out_token_rate),
          is_reversible: pool.is_reversible,
        },
        gas: new BN(SIMPLE_CALL_GAS),
        attachedDeposit: new BN(parseNearAmount('1')!),
      })
    } catch (error) {}
  }

  return (
    <Flex direction="row" justify="space-between">
      <Text fontSize="2xl" fontWeight="bold">
        Pool list
      </Text>
      <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onOpen}>
        Create Pool
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Pool</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex direction="column" gap={2}>
              <Flex gap={2}>
                <Input
                  type="number"
                  step={1}
                  min={1}
                  value={pool.in_token_rate}
                  onChange={(e) =>
                    setPool({ ...pool, in_token_rate: e.target.value })
                  }
                />
                <Box w={400}>
                  <Select
                    colorScheme="purple"
                    options={whitelist
                      .filter((t) => {
                        if (pool.out_token) {
                          return (
                            t.token_id !== pool.out_token &&
                            t.decimals === pool.out_token_decimals
                          )
                        }
                        return true
                      })
                      .map((t) => ({
                        label: t.symbol,
                        value: t.token_id,
                        decimals: t.decimals,
                        icon: <Image src={t.icon || ''} alt="" />,
                      }))}
                    onChange={(newValue) => {
                      setPool({
                        ...pool,
                        in_token: newValue?.value || '',
                        in_token_decimals: newValue?.decimals || 0,
                      })
                    }}
                    components={customComponents}
                  />
                </Box>
              </Flex>
              <Flex justify="center" p={3}>
                {pool.is_reversible ? (
                  <FiRepeat size={24} />
                ) : (
                  <FiArrowDown size={24} />
                )}
              </Flex>
              <Flex gap={2}>
                <Input
                  type="number"
                  step={1}
                  min={1}
                  value={pool.out_token_rate}
                  onChange={(e) =>
                    setPool({ ...pool, out_token_rate: e.target.value })
                  }
                />
                <Box w={400}>
                  <Select
                    colorScheme="purple"
                    options={whitelist
                      .filter((t) => {
                        if (pool.in_token) {
                          return (
                            t.token_id !== pool.in_token &&
                            t.decimals === pool.in_token_decimals
                          )
                        }
                        return true
                      })
                      .map((t) => ({
                        label: t.symbol,
                        value: t.token_id,
                        decimals: t.decimals,
                        icon: <Image src={t.icon || ''} alt="" />,
                      }))}
                    onChange={(newValue) => {
                      setPool({
                        ...pool,
                        out_token: newValue?.value || '',
                        out_token_decimals: newValue?.decimals || 0,
                      })
                    }}
                    components={customComponents}
                  />
                </Box>
              </Flex>
            </Flex>
            <Flex gap={2} align="center" pt={4}>
              <Switch
                checked={pool.is_reversible}
                size="lg"
                onChange={(e) =>
                  setPool({ ...pool, is_reversible: e.target.checked })
                }
              />
              <Text size="lg">is reversable</Text>
            </Flex>
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={onCreate}>
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  )
}
