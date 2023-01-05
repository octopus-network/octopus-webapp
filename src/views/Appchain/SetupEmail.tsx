import { Button, Flex, Input, Text, useBoolean } from "@chakra-ui/react";
import { BaseModal } from "components";
import { Toast } from "components/common/toast";
import { useWalletSelector } from "components/WalletSelectorContextProvider";
import { EMAIL_REGEX } from "config/constants";
import { SIMPLE_CALL_GAS } from "primitives";
import { useEffect, useState } from "react";
import { AnchorContract, Validator, ValidatorProfile } from "types";

export default function SetupEmail({
  anchor,
  validator,
  isUpdate = false,
  oldValidatorProfile,
  onClose,
}: {
  anchor?: AnchorContract;
  validator?: Validator;
  isUpdate?: boolean;
  oldValidatorProfile?: ValidatorProfile;
  onClose?: () => void;
}) {
  const { selector, accountId } = useWalletSelector();
  const [validatorProfile, setValidatorProfile] = useState<
    ValidatorProfile | undefined
  >(oldValidatorProfile);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useBoolean(false);

  useEffect(() => {
    if (!(anchor && validator) || oldValidatorProfile) {
      return;
    }
    anchor
      .get_validator_profile({ validator_id: validator.validator_id })
      .then((vp) => {
        setValidatorProfile(vp);
      });
  }, [validator, anchor, oldValidatorProfile]);

  const onConfirm = async () => {
    if (!EMAIL_REGEX.test(email)) {
      return Toast.error("Invalid email");
    }

    try {
      const wallet = await selector.wallet();
      setIsLoading.on();
      await wallet.signAndSendTransaction({
        signerId: accountId,
        receiverId: anchor?.contractId,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "set_validator_profile",
              args: {
                profile: {
                  ...validatorProfile?.profile,
                  email,
                },
              },
              gas: SIMPLE_CALL_GAS,
              deposit: "0",
            },
          },
        ],
      });
      setIsLoading.off();
    } catch (error) {
      setIsLoading.off();
      Toast.error(error);
    }
  };

  return (
    <BaseModal
      isOpen={
        (validatorProfile !== undefined &&
          (!validatorProfile.profile.email ||
            !validatorProfile.profile.email.trim())) ||
        isUpdate
      }
      onClose={() => {
        if (isUpdate) {
          onClose && onClose();
        } else {
          setValidatorProfile(undefined);
        }
      }}
      title="Setup Email"
    >
      <Flex direction="column" gap={4}>
        {!isUpdate && (
          <Text>
            We find you are a validator and your email hasn't been set up yet.
            To get noticed once exceptions happen, please setup your email
            first.
          </Text>
        )}
        <Input
          id="email"
          placeholder="Contact email"
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          size="lg"
        />
        <Button
          colorScheme="octo-blue"
          size="lg"
          disabled={!EMAIL_REGEX.test(email)}
          isLoading={isLoading}
          onClick={onConfirm}
        >
          Confirm
        </Button>
      </Flex>
    </BaseModal>
  );
}
