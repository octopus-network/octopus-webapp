import React, { useState, useMemo, useEffect } from "react";
import useSWR from "swr";

import {
  List,
  FormControl,
  Flex,
  Link,
  FormLabel,
  Input,
  HStack,
  Text,
  Switch,
  FormHelperText,
  Button,
  Box,
  useBoolean,
} from "@chakra-ui/react";

import { OCT_TOKEN_DECIMALS, COMPLEX_CALL_GAS } from "primitives";

import { decodeAddress } from "@polkadot/util-crypto";
import { u8aToHex, isHex } from "@polkadot/util";
import { BaseModal } from "components";
import { AnchorContract, AppchainInfoWithAnchorStatus } from "types";
import { DecimalUtil, ZERO_DECIMAL } from "utils";
import { useWalletSelector } from "components/WalletSelectorContextProvider";
import { Toast } from "components/common/toast";
import { onTxSent } from "utils/helper";
import { EMAIL_REGEX } from "config/constants";
import Decimal from "decimal.js";

type RegisterValidatorModalProps = {
  appchain: AppchainInfoWithAnchorStatus | undefined;
  anchor: AnchorContract | undefined;
  isOpen: boolean;
  onClose: () => void;
};

export const RegisterValidatorModal: React.FC<RegisterValidatorModalProps> = ({
  isOpen,
  onClose,
  anchor,
  appchain,
}) => {
  const [amount, setAmount] = useState("");
  const [appchainAccount, setAppchainAccount] = useState("");

  const { accountId, networkConfig, selector } = useWalletSelector();
  const [email, setEmail] = useState("");
  const [socialMediaHandle, setSocialMediaHandle] = useState("");
  const [canBeDelegatedTo, setCanBeDelegatedTo] = useState(false);

  const [minimumDeposit, setMinimumDeposit] = useState(ZERO_DECIMAL);

  const [isSubmitting, setIsSubmitting] = useBoolean();
  const { data: balances } = useSWR(accountId ? `balances/${accountId}` : null);

  const amountInDecimal = useMemo(
    () => DecimalUtil.fromString(amount),
    [amount]
  );
  const octBalance = useMemo(
    () => DecimalUtil.fromString(balances?.["OCT"]),
    [balances]
  );

  useEffect(() => {
    anchor?.get_protocol_settings().then((settings) => {
      const minimumDepositInDecimal = DecimalUtil.fromString(
        settings.minimum_validator_deposit,
        OCT_TOKEN_DECIMALS
      );
      setMinimumDeposit(minimumDepositInDecimal);
      setAmount(minimumDepositInDecimal.toString());
    });
  }, [anchor]);

  const onSubmit = async () => {
    let hexId = "";
    try {
      if (isHex(appchainAccount)) {
        throw new Error("Invalid appchain account");
      }
      const u8a = decodeAddress(appchainAccount);
      hexId = u8aToHex(u8a);
    } catch (err) {
      Toast.error(err);
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      return Toast.error("Invalid email");
    }

    try {
      setIsSubmitting.on();
      const wallet = await selector.wallet();
      await wallet.signAndSendTransaction({
        signerId: accountId,
        receiverId: networkConfig?.octopus.octTokenContractId,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "ft_transfer_call",
              args: {
                receiver_id: anchor?.contractId || "",
                amount: DecimalUtil.toU64(
                  amountInDecimal,
                  OCT_TOKEN_DECIMALS
                ).toString(),
                msg: JSON.stringify({
                  RegisterValidator: {
                    validator_id_in_appchain: hexId,
                    can_be_delegated_to: canBeDelegatedTo,
                    profile: {
                      socialMediaHandle: socialMediaHandle || "",
                      email,
                    },
                  },
                }),
              },
              gas: COMPLEX_CALL_GAS,
              deposit: "1",
            },
          },
        ],
      });
      Toast.success("Submitted");
      setIsSubmitting.off();
      onTxSent();
    } catch (error) {
      Toast.error(error);
      setIsSubmitting.off();
    }
  };

  const isEvm = appchain?.appchain_metadata.template_type === "BarnacleEvm";

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Register Validator">
      <List spacing={4}>
        <FormControl isRequired>
          <Flex alignItems="center" justifyContent="space-between">
            <FormLabel htmlFor="appchainAccount">Appchain Account</FormLabel>
            <Link
              isExternal
              variant="gray-hover-blue"
              href="https://docs.oct.network/maintain/validator-generate-keys.html#generate-validator-account"
            >
              Docs
            </Link>
          </Flex>
          <Input
            autoFocus
            id="appchainAccount"
            placeholder={`Appchain ${
              isEvm ? "H160" : "SS58"
            } format address, eg: ${isEvm ? "0x4423" : "5CaLqqE3"}...`}
            onChange={(e) => setAppchainAccount(e.target.value)}
          />
        </FormControl>

        <FormControl isRequired>
          <Flex alignItems="center" justifyContent="space-between">
            <FormLabel htmlFor="amount">Deposit Amount</FormLabel>
            <FormHelperText>
              OCT balance: {octBalance.toFixed(0, Decimal.ROUND_DOWN)}
            </FormHelperText>
          </Flex>
          <Input
            id="amount"
            placeholder="Deposit amount"
            onChange={(e) => setAmount(e.target.value)}
            defaultValue={amount}
            type="number"
          />
          <FormHelperText>
            Minimum deposit: {DecimalUtil.beautify(minimumDeposit)} OCT
          </FormHelperText>
        </FormControl>

        <FormControl isRequired>
          <FormLabel htmlFor="email">Email</FormLabel>
          <Input
            id="email"
            placeholder="Contact email"
            onChange={(e) => setEmail(e.target.value)}
            type="email"
          />
        </FormControl>

        <FormControl>
          <FormLabel htmlFor="socialLink">Twitter ID</FormLabel>
          <Input
            id="socialMediaHandle"
            placeholder="Your twitter ID"
            onChange={(e) => setSocialMediaHandle(e.target.value)}
            type="text"
          />
        </FormControl>

        <HStack>
          <Text>Accept delegation</Text>
          <Switch
            onChange={(e) => setCanBeDelegatedTo(e.target.checked)}
            size="lg"
            defaultChecked={canBeDelegatedTo}
            colorScheme="octo-blue"
          />
        </HStack>
      </List>
      <Box mt={8}>
        <Button
          width="100%"
          colorScheme="octo-blue"
          type="submit"
          isLoading={isSubmitting}
          onClick={onSubmit}
          disabled={
            !appchainAccount ||
            amountInDecimal.lt(minimumDeposit) ||
            amountInDecimal.gt(octBalance) ||
            isSubmitting ||
            !email
          }
        >
          {!appchainAccount
            ? "Input Account"
            : amountInDecimal.lt(minimumDeposit)
            ? "Minimum Limit"
            : amountInDecimal.gt(octBalance)
            ? "Insufficient Balance"
            : "Register"}
        </Button>
      </Box>
    </BaseModal>
  );
};
