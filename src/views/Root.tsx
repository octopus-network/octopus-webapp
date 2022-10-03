import React, { useEffect, useMemo, useCallback, useRef } from "react";

import { SWRConfig } from "swr";
import axios from "axios";

import {
  Box,
  useColorModeValue,
  useToast,
  Link,
  Img,
  Flex,
  CloseButton,
  Portal,
} from "@chakra-ui/react";

import { Header, Footer } from "components";

import { providers } from "near-api-js";

import { BridgeHistory, BridgeHistoryStatus } from "types";

import { Outlet } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { useMatchMutate } from "hooks";
import { useTxnsStore } from "stores";

import { API_HOST } from "config";
import { useWalletSelector } from "components/WalletSelectorContextProvider";
import { Toast } from "components/common/toast";
import XothBannerBg from "assets/xoth-banner.png";
import AvatarBannerBg from "assets/avatar-banner.png";
import Carousel from "nuka-carousel/lib/carousel";
import useLocalStorage from "hooks/useLocalStorage";

export const Root: React.FC = () => {
  const headerBg = useColorModeValue("whiteAlpha.800", "whiteAlpha.50");
  const homeBodyBg = useColorModeValue("white", "#0b0c21");
  const otherPageBodyBg = useColorModeValue("#f6f7fa", "#0b0c21");
  const location = useLocation();

  const navigate = useNavigate();

  const toast = useToast();
  const toastIdRef = useRef<any>();
  const urlParams = useMemo(
    () => new URLSearchParams(window.location.search),
    []
  );

  const { accountId, networkConfig } = useWalletSelector();
  const { updateTxn } = useTxnsStore();

  const matchMutate = useMatchMutate();

  // change body bg in different page
  useEffect(() => {
    if (location.pathname === "/home") {
      document.body.style.background = homeBodyBg;
    } else {
      document.body.style.background = otherPageBodyBg;
    }
  }, [location, homeBodyBg, otherPageBodyBg]);

  const checkRedirect = useCallback(() => {
    if (/appchains\/join/.test(location.pathname)) {
      navigate("/appchains");
    } else if (/appchains\/overview/.test(location.pathname)) {
      axios.post(`${API_HOST}/update-appchains`).then(() => {
        // refresh cache
        matchMutate(/^appchain\//);
        matchMutate(/^appchains\//);
      });
    }
  }, [location.pathname, navigate, matchMutate]);

  const onAppchainTokenBurnt = ({
    hash,
    appchainId,
    nearAccount,
    appchainAccount,
    amount,
    notificationIndex,
    contractId,
  }: {
    hash: string;
    appchainId: string;
    nearAccount: string;
    appchainAccount: string;
    amount: string;
    notificationIndex: string;
    contractId: string;
  }) => {
    const tmpHistory: BridgeHistory = {
      isAppchainSide: false,
      appchainId,
      hash,
      sequenceId: (notificationIndex as any) * 1,
      fromAccount: nearAccount,
      toAccount: appchainAccount,
      amount,
      status: BridgeHistoryStatus.Pending,
      timestamp: new Date().getTime(),
      tokenContractId: contractId,
    };

    updateTxn(appchainId, tmpHistory);
  };

  // check tx status
  useEffect(() => {
    if (!accountId) {
      return;
    }

    const transactionHashes = urlParams.get("transactionHashes") || "";
    const errorMessage = urlParams.get("errorMessage") || "";

    if (errorMessage) {
      Toast.error(decodeURIComponent(errorMessage));
      clearMessageAndHashes();
      return;
    } else if (transactionHashes) {
      toastIdRef.current = Toast.info("");
    } else {
      return;
    }

    const provider = new providers.JsonRpcProvider(
      networkConfig?.near.archivalUrl
    );

    const txHashes = transactionHashes.split(",");
    console.log("txHashes", txHashes);

    const lastTxHash = txHashes[txHashes.length - 1];
    provider
      .txStatus(lastTxHash, accountId)
      .then((status) => {
        const { receipts_outcome } = status;
        let message = "";
        console.log("receipts_outcome", receipts_outcome);

        for (let i = 0; i < receipts_outcome.length; i++) {
          const { outcome } = receipts_outcome[i];
          if ((outcome.status as any).Failure) {
            message = JSON.stringify((outcome.status as any).Failure);
            break;
          }

          let res;

          if (outcome.logs?.length) {
            for (let j = 0; j < outcome.logs.length; j++) {
              const log = outcome.logs[j];

              console.log("log", log);

              const reg1 =
                  /Wrapped appchain token burnt in contract '(.+)' by '(.+)' for '(.+)' of appchain. Amount: '(.+)', Crosschain notification index: '(.+)'/,
                reg2 =
                  /Received fungible token in contract '(.+)' from '(.+)'. Start transfer to '(.+)' of appchain. Amount: '(.+)', Crosschain notification index: '(.+)'/,
                reg3 =
                  /Received NFT in contract '(.+)' from '(.+)'. Start transfer to '(.+)' of appchain. Crosschain notification index: '(.+)'./;

              res = reg1.exec(log) ?? reg2.exec(log) ?? reg3.exec(log);

              if (res?.length) {
                const isNFT = res.length === 5;

                const appchainId = (outcome as any).executor_id.split(".")?.[0];

                const contractId = res[1],
                  nearAccount = res[2],
                  appchainAccount = res[3],
                  amount = isNFT ? "1" : res[4],
                  notificationIndex = isNFT ? res[4] : res[5];

                onAppchainTokenBurnt({
                  hash: status.transaction.hash,
                  appchainId,
                  nearAccount,
                  appchainAccount,
                  amount,
                  notificationIndex,
                  contractId,
                });
                break;
              }
            }
          }

          if (res) break;
        }
        if (message) {
          throw new Error(message);
        }
        if (/register/.test(location.pathname)) {
          window.location.replace("/appchains");
        } else if (/bridge/.test(location.pathname)) {
          toast.close(toastIdRef.current);
        } else if (toastIdRef.current) {
          if (/bridge/.test(location.pathname)) {
            toast.close(toastIdRef.current);
          } else {
            toast.update(toastIdRef.current, {
              title: "Success",
              description: (
                <Link
                  variant="octo-linear"
                  href={`${networkConfig?.near.explorerUrl}/transactions/${lastTxHash}`}
                  className="success-tx-link"
                >
                  Click to check transaction detail
                </Link>
              ),
              duration: 2500,
              variant: "left-accent",
              status: "success",
            });
          }
        }

        checkRedirect();
      })
      .catch((err) => {
        toast.update(toastIdRef.current, {
          description: err?.kind?.ExecutionError || err.toString(),
          duration: 5000,
          status: "error",
        });
      });

    clearMessageAndHashes();
  }, [urlParams]);

  const clearMessageAndHashes = useCallback(() => {
    const { protocol, host, pathname, hash } = window.location;
    urlParams.delete("errorMessage");
    urlParams.delete("errorCode");
    urlParams.delete("transactionHashes");
    const params = urlParams.toString();
    const newUrl = `${protocol}//${host}${pathname}${
      params ? "?" + params : ""
    }${hash}`;
    window.history.pushState({ path: newUrl }, "", newUrl);
  }, [urlParams]);

  const [showWalletBanner, setShowWalletBanner] = useLocalStorage(
    "walletBanner",
    true
  );

  return (
    <SWRConfig
      value={{
        refreshInterval: 60 * 1000,
        fetcher: (api) =>
          axios.get(`${API_HOST}/${api}`).then((res) => res.data),
      }}
    >
      <Box position="relative" zIndex="99" bgColor={headerBg}>
        <Header />
      </Box>
      <Outlet />
      <Box mt={16}>
        <Footer />
      </Box>
      {showWalletBanner && (
        <Portal>
          <Box
            position="fixed"
            right="10px"
            bottom="10px"
            zIndex={100}
            width="300px"
          >
            <Flex direction="row" justify="flex-end">
              <CloseButton
                onClick={() => {
                  setShowWalletBanner(false);
                }}
              />
            </Flex>
            <Carousel
              autoplay
              autoplayInterval={5000}
              swiping
              pauseOnHover
              withoutControls
              dragging
              wrapAround
            >
              <a href="https://xoth.app" target="_blank" rel="noreferrer">
                <Img
                  src={XothBannerBg}
                  width="300px"
                  height="200px"
                  alt="Xoth Wallet"
                  borderRadius={10}
                />
              </a>
              <a
                href="https://chrome.google.com/webstore/detail/avatar-wallet/ckfhnogibicdkfkijinnacpmmobbhbjk"
                target="_blank"
                rel="noreferrer"
              >
                <Img
                  src={AvatarBannerBg}
                  width="300px"
                  height="200px"
                  alt="Avatar Wallet"
                  borderRadius={10}
                />
              </a>
            </Carousel>
          </Box>
        </Portal>
      )}
    </SWRConfig>
  );
};
