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
} from '@chakra-ui/react'
import { Select, chakraComponents } from 'chakra-react-select'
import { FiFeather, FiPlus } from 'react-icons/fi'

const customComponents = {
  Option: ({ children, ...props }: any) => (
    <chakraComponents.Option {...props}>
      {props.data.icon}
      <Box ml={2}>{children}</Box>
    </chakraComponents.Option>
  ),
}

export default function CreatePool() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  return (
    <Flex direction="row" justify={'end'}>
      <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onOpen}>
        Create Pool
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Pool</ModalHeader>
          <ModalBody>
            <Flex direction="column" gap={2}>
              <Flex gap={2}>
                <Input type="number" />
                <Box w={400}>
                  <Select
                    colorScheme="purple"
                    options={[
                      {
                        label: 'I am red',
                        value: 'i-am-red',
                        colorScheme: 'red',
                        icon: <FiFeather />,
                      },
                      {
                        label: 'I fallback to purple',
                        value: 'i-am-purple',
                        icon: <FiFeather />,
                      },
                    ]}
                    components={customComponents}
                  />
                </Box>
              </Flex>
              <Flex gap={2}>
                <Input type="number" />
                <Box w={400}>
                  <Select
                    colorScheme="purple"
                    options={[
                      {
                        label: 'I am red',
                        value: 'i-am-red',
                        colorScheme: 'red', // The option color scheme overrides the global
                      },
                      {
                        label: 'I fallback to purple',
                        value: 'i-am-purple',
                      },
                    ]}
                    components={customComponents}
                  />
                </Box>
              </Flex>
            </Flex>
            <Flex gap={2} align="center" pt={2}>
              <Switch />
              <Text>is reversable</Text>
            </Flex>
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue">Confirm</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  )
}
