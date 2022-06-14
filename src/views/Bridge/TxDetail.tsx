import { useMemo } from 'react'

import {
  DrawerHeader,
  Flex,
  SlideFade,
  HStack,
  CloseButton,
  Heading,
  Avatar,
  Text,
  Link,
  Box,
  Icon,
  useClipboard,
  useColorModeValue,
  IconButton,
  DrawerBody,
} from '@chakra-ui/react'

import { AppchainInfoWithAnchorStatus } from 'types'

import { DecimalUtil } from 'utils'
import Identicon from '@polkadot/react-identicon'
import { encodeAddress } from '@polkadot/util-crypto'
import nearLogo from 'assets/near.svg'
import { CopyIcon, CheckIcon, ExternalLinkIcon } from '@chakra-ui/icons'
import useSWR from 'swr'
import { useGlobalStore } from 'stores'
import { useParams } from 'react-router-dom'
import { AiOutlineArrowRight } from 'react-icons/ai'
import { Link as RouterLink } from 'react-router-dom'

import { ProcessFromAppchain } from './ProcessFromAppchain'
import { ProcessFromNear } from './ProcessFromNear'

type TxDetailProps = {
  onDrawerClose: VoidFunction
}

export const TxDetail: React.FC<TxDetailProps> = ({ onDrawerClose }) => {
  const { txId } = useParams()
  const { global } = useGlobalStore()

  const grayBg = useColorModeValue('#f2f4f7', '#1e1f34')

  const { data: transaction } = useSWR(
    txId ? `bridge-helper/bridgeTx/${txId}` : null,
    { refreshInterval: 1000 }
  )

  const { hasCopied: hasTxIdCopied, onCopy: onTxIdCopy } = useClipboard(
    transaction?.summary.id
  )

  const [isAppchainSide, appchainId] = useMemo(
    () => [
      transaction?.summary.direction === 'appchain_to_near',
      transaction?.summary.appchain_name.replace(
        `${global.network?.near.networkId}-`,
        ''
      ),
    ],
    [transaction]
  )

  const { data: appchain } = useSWR<AppchainInfoWithAnchorStatus>(
    `appchain/${appchainId}`
  )

  return (
    <>
      <DrawerHeader borderBottomWidth="0">
        <Flex justifyContent="space-between" alignItems="center">
          <HStack>
            <Heading fontSize="lg">Transaction Detail</Heading>
          </HStack>
          <CloseButton onClick={onDrawerClose} />
        </Flex>
      </DrawerHeader>
      <DrawerBody pb={6}>
        <Box bg={grayBg} borderRadius="lg" pl={3} pr={3}>
          <Flex
            alignItems="center"
            justifyContent="space-between"
            pt={2}
            pb={2}
          >
            <Text color="gray">Transaction Id</Text>
            <HStack maxW="70%">
              <Text
                whiteSpace="nowrap"
                overflow="hidden"
                textOverflow="ellipsis"
              >
                {transaction?.summary.id}
              </Text>
              <IconButton aria-label="copy" size="sm" onClick={onTxIdCopy}>
                <Icon as={hasTxIdCopied ? CheckIcon : CopyIcon} />
              </IconButton>
            </HStack>
          </Flex>
          <Flex
            alignItems="center"
            justifyContent="space-between"
            pt={2}
            pb={2}
          >
            <Text color="gray">Direction</Text>
            <HStack>
              {isAppchainSide ? (
                <Link as={RouterLink} to={`/appchains/${appchainId}`}>
                  <HStack spacing={1}>
                    <Avatar
                      boxSize={5}
                      src={
                        isAppchainSide
                          ? (appchain?.appchain_metadata
                              ?.fungible_token_metadata?.icon as any)
                          : nearLogo
                      }
                    />
                    <Text fontSize="sm">
                      {isAppchainSide ? appchainId : 'NEAR'}
                    </Text>
                  </HStack>
                </Link>
              ) : (
                <HStack spacing={1}>
                  <Avatar
                    boxSize={5}
                    src={
                      isAppchainSide
                        ? (appchain?.appchain_metadata?.fungible_token_metadata
                            ?.icon as any)
                        : nearLogo
                    }
                  />
                  <Text fontSize="sm">
                    {isAppchainSide ? appchainId : 'NEAR'}
                  </Text>
                </HStack>
              )}
              <Icon as={AiOutlineArrowRight} boxSize={4} />
              {!isAppchainSide ? (
                <Link as={RouterLink} to={`/appchains/${appchainId}`}>
                  <HStack spacing={1}>
                    <Avatar
                      boxSize={5}
                      src={
                        !isAppchainSide
                          ? (appchain?.appchain_metadata
                              ?.fungible_token_metadata?.icon as any)
                          : nearLogo
                      }
                    />
                    <Text fontSize="sm">
                      {!isAppchainSide ? appchainId : 'NEAR'}
                    </Text>
                  </HStack>
                </Link>
              ) : (
                <HStack spacing={1}>
                  <Avatar
                    boxSize={5}
                    src={
                      !isAppchainSide
                        ? (appchain?.appchain_metadata?.fungible_token_metadata
                            ?.icon as any)
                        : nearLogo
                    }
                  />
                  <Text fontSize="sm">
                    {!isAppchainSide ? appchainId : 'NEAR'}
                  </Text>
                </HStack>
              )}
            </HStack>
          </Flex>

          <Flex
            alignItems="center"
            justifyContent="space-between"
            pt={2}
            pb={2}
          >
            <Text color="gray">Amount</Text>
            <HStack>
              <Heading
                fontSize="md"
                whiteSpace="nowrap"
                overflow="hidden"
                textOverflow="ellipsis"
              >
                {appchain
                  ? DecimalUtil.beautify(
                      DecimalUtil.fromString(
                        transaction?.summary.amount.replaceAll(',', ''),
                        appchain?.appchain_metadata?.fungible_token_metadata
                          ?.decimals
                      )
                    )
                  : '-'}
              </Heading>
              <Text fontSize="sm" color="gray.500">
                {appchain?.appchain_metadata?.fungible_token_metadata.symbol ||
                  '-'}
              </Text>
            </HStack>
          </Flex>
          <Flex
            alignItems="center"
            justifyContent="space-between"
            pt={2}
            pb={2}
          >
            <Text color="gray">From Account</Text>
            <Link
              maxW="70%"
              href={
                isAppchainSide
                  ? `${global.network?.octopus.explorerUrl}/${appchainId}/accounts/${transaction?.summary.from}`
                  : `${global.network?.near.explorerUrl}/accounts/${transaction?.summary.from}`
              }
              _hover={{ textDecoration: 'underline' }}
              color="#2468f2"
              isExternal
              onClick={(e) => e.stopPropagation()}
            >
              <HStack spacing={1}>
                {isAppchainSide ? (
                  <Identicon value={transaction?.summary.from} size={18} />
                ) : null}
                <Text
                  whiteSpace="nowrap"
                  overflow="hidden"
                  textOverflow="ellipsis"
                >
                  {isAppchainSide && transaction?.summary.from
                    ? encodeAddress(transaction?.summary.from)
                    : transaction?.summary.from}
                </Text>
                <Icon as={ExternalLinkIcon} boxSize={4} color="gray" />
              </HStack>
            </Link>
          </Flex>
          <Flex
            alignItems="center"
            justifyContent="space-between"
            pt={3}
            pb={3}
          >
            <Text color="gray">To Account</Text>
            <Link
              maxW="70%"
              href={
                !isAppchainSide
                  ? `${global.network?.octopus.explorerUrl}/${appchainId}/accounts/${transaction?.summary.to}`
                  : `${global.network?.near.explorerUrl}/accounts/${transaction?.summary.to}`
              }
              _hover={{ textDecoration: 'underline' }}
              color="#2468f2"
              isExternal
              onClick={(e) => e.stopPropagation()}
            >
              <HStack spacing={1}>
                {!isAppchainSide ? (
                  <Identicon value={transaction?.summary.to} size={18} />
                ) : null}
                <Text
                  whiteSpace="nowrap"
                  overflow="hidden"
                  textOverflow="ellipsis"
                >
                  {!isAppchainSide && transaction?.summary.to
                    ? encodeAddress(transaction?.summary.to)
                    : transaction?.summary.to}
                </Text>
                <Icon as={ExternalLinkIcon} boxSize={4} color="gray" />
              </HStack>
            </Link>
          </Flex>
        </Box>
        {/* <Flex mt={4} alignItems="center" justifyContent="space-between">
          <Heading fontSize="lg">Process</Heading>
          <Tag size="sm" colorScheme={statusObj[transaction?.summary.status]?.color}>{statusObj[transaction?.summary.status]?.label}</Tag>
        </Flex> */}
        <SlideFade in={!!transaction}>
          <Box mt={6}>
            {isAppchainSide ? (
              <ProcessFromAppchain
                data={transaction}
                network={global.network}
              />
            ) : (
              <ProcessFromNear data={transaction} network={global.network} />
            )}
          </Box>
        </SlideFade>
      </DrawerBody>
    </>
  )
}
