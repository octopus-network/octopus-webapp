import React, { useMemo, useState, useEffect } from "react";

import {
  Container,
  Box,
  Grid,
  GridItem,
  Drawer,
  DrawerOverlay,
  DrawerContent,
} from "@chakra-ui/react";

import { AnchorContract, WrappedAppchainToken } from "types";

import { useParams, useNavigate } from "react-router-dom";
import { Breadcrumb } from "components";
import { Descriptions } from "./Descriptions";
import { ValidatorProfile } from "./ValidatorProfile";
import { MyNode } from "./MyNode";

import { Validators } from "./Validators";
import { useWalletSelector } from "components/WalletSelectorContextProvider";
import { ANCHOR_METHODS } from "config/constants";
import { useAppChain } from "hooks/useAppChain";
import SetupEmail from "./SetupEmail";
import useNearAccount from "hooks/useNearAccount";

export const Appchain: React.FC = () => {
  const { id = "", validatorId = "" } = useParams();

  const {
    appchain,
    appchainSettings,
    validators,
    validatorsError,
    appchainApi,
    validatorSessionKeys,
    appchainValidators,
  } = useAppChain(id);

  const { accountId, networkConfig } = useWalletSelector();
  const nearAccount = useNearAccount();

  const navigate = useNavigate();

  const [anchor, setAnchor] = useState<AnchorContract>();
  const [wrappedAppchainToken, setWrappedAppchainToken] =
    useState<WrappedAppchainToken>();

  const drawerOpen = useMemo(() => !!id && !!validatorId, [id, validatorId]);

  useEffect(() => {
    if (drawerOpen) {
      (document.getElementById("root") as any).style =
        "transition: all .3s ease-in-out; transform: translateX(-5%)";
    } else {
      (document.getElementById("root") as any).style =
        "transition: all .15s ease-in-out; transform: translateX(0)";
    }
  }, [drawerOpen]);

  useEffect(() => {
    if (!appchain) {
      return;
    }

    const anchorContract = new AnchorContract(
      nearAccount!,
      appchain.appchain_anchor,
      ANCHOR_METHODS
    );

    setAnchor(anchorContract);
  }, [appchain, nearAccount, networkConfig, networkConfig?.near]);

  useEffect(() => {
    if (!anchor) {
      return;
    }
    anchor.get_wrapped_appchain_token().then((wrappedToken) => {
      setWrappedAppchainToken(wrappedToken);
    });
  }, [anchor]);

  const validator = validators?.find((v) => v.validator_id === accountId);
  const isValidator = !!(validator && !validator?.is_unbonding);

  const needKeys = useMemo(() => {
    if (!validatorSessionKeys || !accountId) {
      return false;
    }
    return isValidator && !validatorSessionKeys[accountId];
  }, [validatorSessionKeys, accountId, isValidator]);

  const onDrawerClose = () => {
    navigate(`/appchains/${id}`);
  };

  return (
    <>
      <Container>
        <Box mt={5}>
          <Breadcrumb
            links={[
              { to: "/home", label: "Home" },
              { to: "/appchains", label: "Appchains" },
              { label: id },
            ]}
          />
        </Box>
        <Grid
          templateColumns={{ base: "repeat(3, 1fr)", lg: "repeat(5, 1fr)" }}
          gap={5}
          mt={5}
        >
          <GridItem colSpan={3}>
            <Descriptions
              appchain={appchain}
              appchainApi={appchainApi}
              appchainSettings={appchainSettings}
              wrappedAppchainToken={wrappedAppchainToken}
            />
          </GridItem>
          <GridItem colSpan={{ base: 3, lg: 2 }} borderRadius="md">
            <MyNode
              appchain={appchain}
              appchainId={id}
              needKeys={needKeys}
              appchainApi={appchainApi}
              anchor={anchor}
              validator={validator}
              validatorSessionKeys={validatorSessionKeys}
            />
          </GridItem>
        </Grid>
        <Box mt={8}>
          <Validators
            appchain={appchain}
            isLoadingValidators={!validators && !validatorsError}
            validators={validators}
            appchainValidators={appchainValidators}
            validatorSessionKeys={validatorSessionKeys}
            anchor={anchor}
          />
        </Box>
        <SetupEmail anchor={anchor} validator={validator} />
      </Container>
      <Drawer
        placement="right"
        isOpen={drawerOpen}
        onClose={onDrawerClose}
        size="lg"
      >
        <DrawerOverlay />
        <DrawerContent>
          <ValidatorProfile
            appchain={appchain}
            anchor={anchor}
            validatorId={validatorId}
            appchainValidators={appchainValidators}
            validators={validators}
            validatorSessionKeys={validatorSessionKeys}
            onDrawerClose={onDrawerClose}
          />
        </DrawerContent>
      </Drawer>
    </>
  );
};
