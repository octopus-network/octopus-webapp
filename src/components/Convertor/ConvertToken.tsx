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
  InputGroup,
  InputLeftElement,
  ModalCloseButton,
} from '@chakra-ui/react'
import { ChangeEventHandler, useState } from 'react'
import { FiRepeat } from 'react-icons/fi'
import { ConversionPool, FungibleTokenMetadata } from 'types'

export default function ConvertToken({
  pool,
  whitelist,
  onClose,
}: {
  pool: ConversionPool | null
  whitelist: FungibleTokenMetadata[]
  onClose: () => void
}) {
  const [inTokenValue, setInTokenValue] = useState('')
  const [outTokenValue, setOutTokenValue] = useState('')
  const [isReversed, setIsReversed] = useState(false)
  if (!pool) {
    return null
  }
  const onInTokenValueChange = (e: any) => {
    if (isReversed) {
      setOutTokenValue(e.target.value)
    } else {
      setInTokenValue(e.target.value)
    }
  }
  const onOutTokenValueChange = (e: any) => {
    if (isReversed) {
      setInTokenValue(e.target.value)
    } else {
      setOutTokenValue(e.target.value)
    }
  }
  const inToken = whitelist.find((t) => t.token_id === pool.in_token)
  const outToken = whitelist.find((t) => t.token_id === pool.out_token)
  return (
    <Modal isOpen onClose={() => {}} isCentered size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Convert</ModalHeader>
        <ModalCloseButton onClick={onClose} />
        <ModalBody>
          <Flex direction="column" gap={5}>
            <InputGroup alignItems="center">
              <InputLeftElement
                pointerEvents="none"
                margin={1}
                children={
                  <Image
                    src={(isReversed ? outToken?.icon : inToken?.icon) || ''}
                    width={10}
                    height={10}
                    alt=""
                  />
                }
              />
              <Input
                placeholder="Amount"
                size="lg"
                pl={14}
                value={isReversed ? outTokenValue : inTokenValue}
                onChange={onInTokenValueChange}
              />
            </InputGroup>
            {pool.reversible && (
              <Flex align="center" justify="center">
                <Button
                  colorScheme="blue"
                  onClick={() => setIsReversed(!isReversed)}
                >
                  <FiRepeat />
                </Button>
              </Flex>
            )}
            <InputGroup alignItems="center">
              <InputLeftElement
                pointerEvents="none"
                margin={1}
                children={
                  <Image
                    src={(isReversed ? inToken?.icon : outToken?.icon) || ''}
                    width={10}
                    height={10}
                    alt=""
                  />
                }
              />
              <Input
                placeholder="Amount"
                size="lg"
                pl={14}
                value={isReversed ? inTokenValue : outTokenValue}
                onChange={onOutTokenValueChange}
              />
            </InputGroup>
          </Flex>
        </ModalBody>
        <ModalFooter gap={2} justifyContent="center">
          <Button colorScheme="blue">Convert</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
