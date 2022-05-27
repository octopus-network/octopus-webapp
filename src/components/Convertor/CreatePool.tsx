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
  ModalCloseButton,
  Link,
  UnorderedList,
  ListItem,
  useToast,
  HStack,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverHeader,
  PopoverBody,
} from '@chakra-ui/react'
import { BN } from '@polkadot/util'
import { Select, chakraComponents } from 'chakra-react-select'
import { SIMPLE_CALL_GAS } from 'primitives'
import { useState } from 'react'
import { useGlobalStore } from 'stores'
import { AccountId, FungibleTokenMetadata } from 'types'
import {
  MdOutlineSwapVert,
  MdOutlineArrowDownward,
  MdOutlineAdd,
  MdInfoOutline,
} from 'react-icons/md'
import NEP141 from 'assets/icons/nep141-token.png'

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
    let label = ''
    if (props.hasValue) {
      const value = props.getValue()[0]
      icon = value.icon
      label = value.label
    }
    return (
      <chakraComponents.Option {...props} selectProps={{ size: 'sm' }}>
        {icon}
        <Text ml={2} fontSize="lg">
          {label}
        </Text>
      </chakraComponents.Option>
    )
  },
  SingleValue: () => null,
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

const DEFAULT_POOL = {
  in_token: '',
  out_token: '',
  in_token_rate: '',
  out_token_rate: '',
  is_reversible: false,
  in_token_decimals: 0,
  out_token_decimals: 0,
}

export default function CreatePool({
  whitelist,
  contractId,
}: {
  whitelist: FungibleTokenMetadata[]
  contractId: AccountId
}) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [pool, setPool] = useState<PoolProps>(DEFAULT_POOL)

  const { global } = useGlobalStore()
  const toast = useToast()
  const onCreate = async () => {
    try {
      const account = global.wallet?.account()
      if (!account?.accountId) {
        toast({
          position: 'top-right',
          title: 'Error',
          description: 'Please login first',
          status: 'error',
        })
        return
      }

      const attachedDeposit = await account.viewFunction(
        contractId,
        'get_deposit_amount_of_pool_creation'
      )

      await account?.functionCall({
        contractId: contractId,
        methodName: 'create_pool',
        args: {
          in_token: pool.in_token,
          out_token: pool.out_token,
          in_token_rate: Number(pool.in_token_rate),
          out_token_rate: Number(pool.out_token_rate),
          is_reversible: pool.is_reversible,
        },
        gas: new BN(SIMPLE_CALL_GAS),
        attachedDeposit: new BN(attachedDeposit),
      })
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Flex direction="row" justify="space-between">
      <HStack>
        <Text fontSize="2xl" fontWeight="bold">
          Pool list
        </Text>
        <Popover>
          <PopoverTrigger>
            <Button bgColor="transparent" size="sm">
              <MdInfoOutline size={20} className="octo-gray" />
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverHeader>Info</PopoverHeader>
            <PopoverBody>
              To learn more, forward{' '}
              <Link
                href="https://bob-xsb-near.gitbook.io/nep141-token-convertor/"
                target="_blank"
                color="#008cd5"
                rel="noopener noreferrer"
              >
                our docs
              </Link>
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </HStack>
      <Button
        variant="octo-linear"
        leftIcon={<MdOutlineAdd />}
        onClick={onOpen}
      >
        Create Pool
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          onClose()
          setPool(DEFAULT_POOL)
        }}
        isCentered
        size="lg"
      >
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
                  max={10000}
                  size="lg"
                  placeholder="Input conversion rate"
                  value={pool.in_token_rate}
                  onChange={(e) => {
                    if (/^[0-9]{0,}$/.test(e.target.value)) {
                      setPool({ ...pool, in_token_rate: e.target.value })
                    }
                  }}
                />
                <Box w={400}>
                  <Select
                    size="lg"
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
                        icon: (
                          <Image
                            src={t.icon || NEP141}
                            w={30}
                            h={30}
                            alt={t.symbol}
                            borderRadius={15}
                          />
                        ),
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
                  <MdOutlineSwapVert size={30} />
                ) : (
                  <MdOutlineArrowDownward size={30} />
                )}
              </Flex>
              <Flex gap={2}>
                <Input
                  type="number"
                  step={1}
                  min={1}
                  max={10000}
                  size="lg"
                  placeholder="Input conversion rate"
                  value={pool.out_token_rate}
                  onChange={(e) => {
                    if (/^[0-9]{0,}$/.test(e.target.value)) {
                      setPool({ ...pool, out_token_rate: e.target.value })
                    }
                  }}
                />
                <Box w={400}>
                  <Select
                    colorScheme="purple"
                    size="lg"
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
                        icon: (
                          <Image
                            src={t.icon || NEP141}
                            alt={t.symbol}
                            w={30}
                            h={30}
                            borderRadius={15}
                          />
                        ),
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
            <Flex gap={2} align="center" pt={4} mb={2}>
              <Switch
                checked={pool.is_reversible}
                size="lg"
                onChange={(e) =>
                  setPool({ ...pool, is_reversible: e.target.checked })
                }
              />
              <Text size="lg">is conversion reversible?</Text>
            </Flex>
            <UnorderedList className="octo-gray">
              <ListItem>
                <Link
                  color="#008cd5"
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://bob-xsb-near.gitbook.io/nep141-token-convertor/guides/how-to-create-a-pool"
                >
                  How to create a pool
                </Link>
              </ListItem>
              <ListItem>Conversion rate must be integer</ListItem>
              <ListItem>The decimals of pool tokens must be same</ListItem>
              <ListItem>
                Click{' '}
                <Link
                  color="#008cd5"
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://docs.google.com/forms/d/e/1FAIpQLSd1ZbxY70HyCH33-59DrQBT8tVBZZ1HX0MlXrxFS1GDr1zR0A/viewform"
                >
                  here
                </Link>{' '}
                to submit new token
              </ListItem>
            </UnorderedList>
          </ModalBody>
          <ModalFooter justifyContent="center">
            <Button variant="octo-linear" onClick={onCreate} size="lg">
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  )
}
