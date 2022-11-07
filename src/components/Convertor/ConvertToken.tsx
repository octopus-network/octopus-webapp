import {
  Flex,
  Button,
  Input,
  Text,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  Heading,
  CloseButton,
  IconButton,
  Icon,
  useColorModeValue,
  Avatar,
} from "@chakra-ui/react";
import Decimal from "decimal.js";
import { useTokenBalance } from "hooks/useConvertorContract";
import {
  COMPLEX_CALL_GAS,
  FT_MINIMUM_STORAGE_BALANCE,
  SIMPLE_CALL_GAS,
} from "primitives";
import { useState } from "react";
import { MdArrowDownward, MdSwapVert } from "react-icons/md";
import { AccountId, ConversionPool, FungibleTokenMetadata } from "types";
import { DecimalUtil } from "utils";
import { isValidNumber } from "utils/validate";
import NEP141 from "assets/icons/nep141-token.png";
import { useWalletSelector } from "components/WalletSelectorContextProvider";
import { Transaction } from "@near-wallet-selector/core";
import { Toast } from "components/common/toast";
import { providers } from "near-api-js";
import { CodeResult } from "near-api-js/lib/providers/provider";

const TokenInput = ({
  value,
  onValueChange,
  token,
  liquidity,
  inputDisabled = false,
  autoFocus = false,
}: {
  value: string;
  onValueChange: (value: string) => void;
  token: FungibleTokenMetadata | undefined;
  liquidity: string;
  inputDisabled?: boolean;
  autoFocus?: boolean;
}) => {
  const tokenBlance = useTokenBalance(token?.token_id);
  const liq = DecimalUtil.fromString(liquidity, token?.decimals).toFixed(2);

  const balance = DecimalUtil.fromString(tokenBlance, token?.decimals).toFixed(
    2
  );
  const inputBg = useColorModeValue("#f5f7fa", "whiteAlpha.100");

  return (
    <Flex direction="row" align="flex-end" gap={4}>
      <Flex direction="column" flex={1} gap={1}>
        <Flex justify="space-between">
          <Text fontSize="sm" className="octo-gray">{`Liquidity: ${liq}`}</Text>
          <Text
            fontSize="sm"
            className="octo-gray"
          >{`Balance: ${balance}`}</Text>
        </Flex>
        <Input
          placeholder="Amount"
          bg={inputBg}
          value={value}
          disabled={inputDisabled}
          autoFocus={autoFocus}
          onFocus={() => onValueChange("")}
          onChange={(e) => onValueChange(e.target.value)}
        />
      </Flex>
      <Flex direction="row" align="center" gap={2} pt={2} pr={4}>
        <Text fontWeight={600}>{token?.symbol}</Text>
        <Avatar src={token?.icon || NEP141} width={10} height={10} />
      </Flex>
    </Flex>
  );
};

export default function ConvertToken({
  pool,
  whitelist,
  onClose,
  contractId,
}: {
  pool: ConversionPool | null;
  whitelist: FungibleTokenMetadata[];
  onClose: () => void;
  contractId: AccountId;
}) {
  const [inTokenValue, setInTokenValue] = useState<string | number>("");
  const [outTokenValue, setOutTokenValue] = useState<string | number>("");
  const [isReversed, setIsReversed] = useState(false);
  const { accountId, selector, near } = useWalletSelector();

  const bg = useColorModeValue("white", "#15172c");

  const inToken = whitelist.find((t) => t.token_id === pool?.in_token);
  const outToken = whitelist.find((t) => t.token_id === pool?.out_token);

  const _inToken = isReversed ? outToken : inToken;
  const _outToken = !isReversed ? outToken : inToken;
  const inTokenBalanceRaw = useTokenBalance(_inToken?.token_id);
  const inTokenBalance = DecimalUtil.fromString(
    inTokenBalanceRaw,
    _inToken?.decimals
  ).toString();
  const outTokenBalanceRaw = useTokenBalance(_outToken?.token_id);
  const outTokenBalance = DecimalUtil.fromString(
    outTokenBalanceRaw,
    _inToken?.decimals
  ).toString();

  if (!pool) {
    return null;
  }

  const isValid =
    isValidNumber(
      String(isReversed ? outTokenValue : inTokenValue),
      isReversed ? outTokenBalance : inTokenBalance
    ) &&
    isValidNumber(
      String(isReversed ? inTokenValue : outTokenValue),
      DecimalUtil.fromString(
        isReversed ? pool?.in_token_balance : pool?.out_token_balance,
        _outToken?.decimals
      ).toString()
    );

  const onTokenValueChange = (value: string, _isReversed: boolean) => {
    if (value.trim() !== "") {
      if (_isReversed) {
        setOutTokenValue(value);
        setInTokenValue(
          new Decimal(value)
            .mul(!isReversed ? pool.in_token_rate : pool.out_token_rate)
            .div(isReversed ? pool.in_token_rate : pool.out_token_rate)
            .toFixed(inToken?.decimals)
            .toString()
        );
      } else {
        setInTokenValue(value);
        setOutTokenValue(
          new Decimal(value)
            .mul(isReversed ? pool.in_token_rate : pool.out_token_rate)
            .div(!isReversed ? pool.in_token_rate : pool.out_token_rate)
            .toFixed(inToken?.decimals)
            .toString()
        );
      }
    } else {
      setOutTokenValue("");
      setInTokenValue("");
    }
  };

  const onConvert = async () => {
    try {
      if (!accountId) {
        throw new Error("No account");
      }
      const wallet = await selector.wallet();
      const txs: Transaction[] = [];

      const provider = new providers.JsonRpcProvider({
        url: selector.options.network.nodeUrl,
      });

      const res = await provider.query<CodeResult>({
        request_type: "call_function",
        account_id: contractId,
        method_name: "get_storage_fee_gap_of",
        args_base64: btoa(
          JSON.stringify({
            account_id: accountId!,
          })
        ),
        finality: "final",
      });
      const storageFee = JSON.parse(Buffer.from(res.result).toString());

      if (String(storageFee) !== "0") {
        txs.push({
          signerId: accountId,
          receiverId: contractId,
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: "storage_deposit",
                args: {
                  account_id: accountId,
                },
                gas: SIMPLE_CALL_GAS,
                deposit: String(storageFee),
              },
            },
          ],
        });
      }

      const receiveTokenId = !isReversed ? pool.out_token : pool.in_token;
      const account = await near?.account("dontcare");
      const storageBalance = await account?.viewFunction(
        receiveTokenId,
        "storage_balance_of",
        { account_id: accountId }
      );

      if (!storageBalance || storageBalance?.total === "0") {
        txs.push({
          signerId: accountId,
          receiverId: receiveTokenId,
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: "storage_deposit",
                args: {
                  registration_only: true,
                  account_id: accountId,
                },
                gas: SIMPLE_CALL_GAS,
                deposit: FT_MINIMUM_STORAGE_BALANCE!,
              },
            },
          ],
        });
      }

      const tokenContractId = isReversed ? pool.out_token : pool.in_token;
      const amount = inTokenValue;
      const token = whitelist.find((t) => t.token_id === tokenContractId);
      const _amount = DecimalUtil.toU64(
        new Decimal(amount),
        token?.decimals
      ).toString();

      const convertAction = {
        input_token_amount: _amount,
        input_token_id: tokenContractId,
        pool_id: pool.id,
      };

      txs.push({
        signerId: accountId,
        receiverId: tokenContractId,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "ft_transfer_call",
              args: {
                receiver_id: contractId,
                amount: _amount,
                msg: JSON.stringify({
                  Convert: { convert_action: convertAction },
                }),
              },
              gas: COMPLEX_CALL_GAS,
              deposit: "1",
            },
          },
        ],
      });

      await wallet.signAndSendTransactions({
        transactions: txs,
      });
      onClose();
      // Toast.success("Converted")
    } catch (error) {
      Toast.error(error);
    }
  };

  return (
    <Drawer
      placement="right"
      isOpen
      onClose={() => {
        onClose();
        setInTokenValue("");
        setOutTokenValue("");
      }}
      size="md"
    >
      <DrawerOverlay />
      <DrawerContent>
        <DrawerHeader borderBottomWidth="0">
          <Flex justifyContent="space-between" alignItems="center">
            <Heading fontSize="lg">Convert</Heading>
            <CloseButton onClick={onClose} />
          </Flex>
        </DrawerHeader>

        <Flex direction="column" gap={5} pl={6} pr={6}>
          <TokenInput
            value={String(inTokenValue)}
            onValueChange={(value: string) => onTokenValueChange(value, false)}
            token={isReversed ? outToken : inToken}
            liquidity={
              isReversed ? pool.out_token_balance : pool.in_token_balance
            }
          />
          <Flex align="center" justify="center" gap={4}>
            <IconButton
              aria-label="switch"
              isRound
              size="sm"
              borderWidth={3}
              borderColor={bg}
              transform="scale(1.4)"
              disabled={!pool.reversible}
              onClick={() => {
                setIsReversed(!isReversed);
                setInTokenValue("");
                setOutTokenValue("");
              }}
            >
              <Icon
                as={pool.reversible ? MdSwapVert : MdArrowDownward}
                boxSize={4}
              />
            </IconButton>
            <Text>
              {isReversed
                ? `${pool.out_token_rate} : ${pool.in_token_rate}`
                : `${pool.in_token_rate} : ${pool.out_token_rate}`}
            </Text>
          </Flex>
          <TokenInput
            value={String(outTokenValue)}
            onValueChange={(value: string) => onTokenValueChange(value, true)}
            token={!isReversed ? outToken : inToken}
            liquidity={
              !isReversed ? pool.out_token_balance : pool.in_token_balance
            }
          />
          <Button
            colorScheme="octo-blue"
            onClick={onConvert}
            disabled={!isValid}
          >
            Convert
          </Button>
        </Flex>
      </DrawerContent>
    </Drawer>
  );
}
